/**
 * Offline / fallback conversational agent (when LLM API is unavailable).
 * Task-aware handlers — not FAQ matching as the brain.
 * Production path prefers /api/chat LLM agent.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
import type {
  AgentCapability,
  ConversationTurn,
  GroundedAnswer,
  IntentId,
} from './types'

export type ConversationPhase = 'open' | 'clarify' | 'gather' | 'act' | 'resolve'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  awaitingInstitution: boolean
  lastCapability: AgentCapability | null
  objective: string | null
  phase: ConversationPhase
  pendingClarify:
    | 'which-problem'
    | 'which-institution'
    | 'exact-error'
    | 'draft-office'
    | 'current-topic'
    | null
  problemSummary: string | null
  errorConfirmed: boolean
  actionsTaken: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  answer?: GroundedAnswer | null
  imagePreview?: string | null
  isFollowUp?: boolean
  timestamp: number
}

export interface AgentTurnResult {
  messages: ChatMessage[]
  slots: ConversationSlots
  diagnosed: boolean
  capability: AgentCapability
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createInitialSlots(uiInstitutionId: string | null = null): ConversationSlots {
  const inst = uiInstitutionId ? getInstitution(uiInstitutionId) : null
  return {
    institutionId: uiInstitutionId,
    institutionName: inst?.name ?? null,
    intent: null,
    exactError: null,
    studentName: null,
    matric: null,
    awaitingInstitution: false,
    lastCapability: null,
    objective: null,
    phase: 'open',
    pendingClarify: null,
    problemSummary: null,
    errorConfirmed: false,
    actionsTaken: [],
  }
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: uid('welcome'),
    role: 'assistant',
    text: 'I can help with portal errors, school contacts, email drafts, or current NELFUND status. Tell me what is going on — or paste the exact message / upload a screenshot (hide passwords and OTP).',
    isFollowUp: true,
    timestamp: Date.now(),
  }
}

export function extractErrorSignals(text: string): string | null {
  if (!text) return null
  const patterns = [
    /missing\s*information[^\n.]{0,80}/i,
    /no\s*school\s*info(?:rmation)?[^\n.]{0,40}/i,
    /student\s*record[s]?\s*(not\s*found|missing)[^\n.]{0,40}/i,
    /record\s*not\s*found[^\n.]{0,40}/i,
    /invalid\s*jamb[^\n.]{0,40}/i,
    /nin\s*(verification\s*)?failed[^\n.]{0,40}/i,
    /application\s*(is\s*)?pending[^\n.]{0,40}/i,
    /application\s*(was\s*)?reject(?:ed)?[^\n.]{0,40}/i,
    /no\s*record\s*found[^\n.]{0,40}/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return m[0].trim().replace(/\s+/g, ' ')
  }
  return null
}

function mergeQuery(userText: string, ocrText: string | null): string {
  const parts = [userText.trim(), ocrText?.trim()].filter(Boolean) as string[]
  return parts.join('\n')
}

function applyInstitutionToSlots(
  slots: ConversationSlots,
  text: string,
  uiInstitutionId: string | null,
): ConversationSlots {
  const next = { ...slots }
  if (uiInstitutionId && !next.institutionId) {
    next.institutionId = uiInstitutionId
    next.institutionName = getInstitution(uiInstitutionId)?.name ?? null
  }
  const found = resolveInstitutionFromText(text)
  if (found) {
    next.institutionId = found
    next.institutionName = getInstitution(found)?.name ?? null
    next.awaitingInstitution = false
    if (next.pendingClarify === 'which-institution') next.pendingClarify = null
  }
  return next
}

function isAckOrThanks(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    t.length < 50 &&
    /^(thanks?|thank\s*you|ok|okay|alright|got\s*it|cool|noted|done|sorted|fixed|cleared|great|fine)\.?$/i.test(
      t,
    )
  )
}

function isVagueProblem(text: string, intent: IntentId): boolean {
  const t = text.toLowerCase().trim()
  if (isAckOrThanks(t)) return false
  if (t.length < 8 && !/help|hi|hello|abeg|pls/i.test(t)) return false
  if (
    /^(help|hi|hello|please|abeg|pls)\.?$/i.test(t) ||
    /nelfund\s*(is\s*)?(not\s*working|no\s*dey\s*work)/i.test(t) ||
    /having\s*(a\s*)?(problem|issue|wahala)/i.test(t) ||
    /something\s*(is\s*)?wrong/i.test(t) ||
    /i\s*don'?t\s*know\s*what\s*to\s*do/i.test(t) ||
    /this\s*thing\s*(is\s*)?(frustrating|confusing|stressing)/i.test(t) ||
    /(frustrating|tired\s*of|fed\s*up).{0,30}nelfund/i.test(t) ||
    /nelfund.{0,30}(frustrating|confusing)/i.test(t)
  ) {
    return intent === 'unknown' || intent === 'contact-support'
  }
  if (
    intent === 'unknown' &&
    t.length < 60 &&
    /(problem|issue|help|stuck|error|not\s*working|wahala)/i.test(t)
  ) {
    return true
  }
  return false
}

function needsInstitutionSlot(capability: AgentCapability, intent: IntentId): boolean {
  if (capability === 'email-draft' || capability === 'contact-lookup') return true
  if (capability === 'troubleshooting') {
    return [
      'missing-information',
      'school-not-found',
      'jamb-verification',
      'institution-verification',
      'pending-application',
      'rejected-application',
    ].includes(intent)
  }
  return false
}

function shortAck(slots: ConversationSlots, intent: IntentId): string {
  if (intent === 'missing-information') {
    return slots.institutionName
      ? `Got you — that often means the portal cannot match your student record yet (sometimes on the ${slots.institutionName} side).`
      : 'Got you — that often means the portal cannot match your student record with your school yet.'
  }
  if (intent === 'institution-verification') {
    return 'You are asking how to tell whether your school has submitted your record to NELFUND.'
  }
  if (intent === 'jamb-verification') return 'Okay — JAMB issues are often a data-match problem.'
  if (intent === 'nin-verification') return 'Okay — NIN failures are often a mismatch or temporary system issue.'
  if (intent === 'pending-application') return 'Understood — pending usually means still processing, not rejected.'
  if (intent === 'rejected-application') return 'Sorry that happened. We can work from the portal reason if you have it.'
  if (intent === 'school-not-found') return 'Got it — school-not-showing is common and not always permanent.'
  return 'Understood.'
}

function simpleAnswer(
  text: string,
  intent: IntentId,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.8,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function answerPortalLogin(): GroundedAnswer {
  return simpleAnswer(
    'For login and for continuing an existing application, use the official NELFUND portal:\n\nhttps://portal.nelf.gov.ng/\n\nThat is the same official destination whether you are signing in or filling application information. Avoid third-party sites that ask for payment or OTP.\n\nPublic information site: https://nelf.gov.ng/',
    'portal-login',
    {
      sources: [
        { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
        { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
      ],
    },
  )
}

function answerDataUploadCheck(slots: ConversationSlots): GroundedAnswer {
  const schoolQ = slots.institutionName
    ? `If you need the school to check the upload for ${slots.institutionName}, say so and I can help with contacts or a draft email.`
    : 'If you need your school to check, tell me your institution name and I can help with contacts or a draft email.'
  return simpleAnswer(
    'As a student you cannot open a private NELFUND “upload log.” What you can check is what the portal shows for your own account.\n\nCommon signs that your record may not be matched yet:\n• School not appearing when it should\n• “Missing information” / student record messages\n• Institutional verification stuck or failing\n\nWhat helps next: confirm your NIN, JAMB, matric, and name match your school’s records exactly, then ask your institution’s ICT / Registry / NELFUND desk whether your session cohort was submitted.\n\n' +
      schoolQ,
    'institution-verification',
  )
}

function answerEligibilityDisqualify(userText: string): GroundedAnswer {
  const grounded = answerQuestion(userText, null, [])
  if (grounded.hasEvidence && grounded.answer) {
    const parts = grounded.answer.split(/(?<=[.!?])\s+/)
    const short = parts.slice(0, 5).join(' ')
    return {
      ...grounded,
      responseMode: 'conversation',
      answer: short,
      whatThisMeans: null,
      nextActions: [
        'Confirm current rules on https://nelf.gov.ng/faq',
        'Data mismatches can block progress even when formal disqualification grounds do not apply.',
      ].slice(0, 3),
    }
  }
  return simpleAnswer(
    'Official NELFUND FAQ guidance lists denial circumstances such as: default on a previous loan from a licensed financial institution; fake/fraudulent documents and dismissal for exam malpractice; and conviction for fraud, forgery, drug offences, cultism, felony, or offences involving dishonesty.\n\nSeparately, incomplete school records or data mismatches can block verification even without those grounds.\n\nConfirm the latest wording on https://nelf.gov.ng/faq — rules can be updated.',
    'eligibility',
    {
      sources: [{ id: 'faq', label: 'Official NELFUND FAQ', url: 'https://nelf.gov.ng/faq', official: true }],
    },
  )
}

function clarifyVagueMessage(frustrated: boolean): GroundedAnswer {
  const open = frustrated
    ? "I understand — let's work through it step by step.\n\nWhat part is not working?"
    : 'I can help. What part is not working?'
  return simpleAnswer(
    open +
      '\n\n' +
      '• Creating account / login\n' +
      '• JAMB verification\n' +
      '• Missing student information\n' +
      '• School not showing\n' +
      '• Application status (pending / rejected)\n' +
      '• Something else\n\n' +
      'If you see an error, paste the exact message or upload a screenshot (hide passwords and OTP).',
    'unknown',
  )
}

function runEmailDraft(slots: ConversationSlots, intent: IntentId): GroundedAnswer {
  const draft = draftSupportEmail({
    institutionId: slots.institutionId,
    institutionName: slots.institutionName,
    exactError: slots.exactError,
    intentLabel: (intent === 'email-draft' ? 'missing-information' : intent).replace(/-/g, ' '),
    studentName: slots.studentName,
    matric: slots.matric,
  })
  const planIntent: IntentId =
    intent === 'unknown' || intent === 'email-draft' || intent === 'contact-lookup'
      ? 'missing-information'
      : intent
  const plan = buildEscalationPlan(planIntent, slots.institutionId, {
    errorMessage: slots.exactError,
  })
  const lines = [
    'Here is a professional email you can adapt. Fill in the bracketed placeholders before sending.',
    '',
    `Subject: ${draft.subject}`,
    '',
    draft.body,
  ]
  return {
    hasEvidence: true,
    intent: 'email-draft',
    confidence: 0.9,
    responseMode: 'email-draft',
    problem: 'Support email draft',
    answer: lines.join('\n'),
    whatThisMeans: null,
    nextActions: [
      'Confirm the correct official email before sending.',
      'NELFUND support if needed: https://nelfund.esupport.ng/create',
    ],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      {
        id: 'nelfund-esupport',
        label: 'NELFUND eSupport',
        url: 'https://nelfund.esupport.ng/create',
        official: true,
      },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: plan,
    draft,
  }
}

function runContactLookup(slots: ConversationSlots, intent: IntentId): GroundedAnswer {
  const effectiveIntent: IntentId =
    intent === 'contact-lookup' || intent === 'contact-support' || intent === 'email-draft' || intent === 'unknown'
      ? 'missing-information'
      : intent
  const plan = buildEscalationPlan(effectiveIntent, slots.institutionId, {
    errorMessage: slots.exactError,
  })
  const narrative = describeContactLookup(slots.institutionName, plan)
  return {
    hasEvidence: true,
    intent: 'contact-lookup',
    confidence: 0.88,
    responseMode: 'contact-lookup',
    problem: 'Institution / NELFUND contact lookup',
    answer: narrative,
    whatThisMeans: null,
    nextActions: [
      'NELFUND support ticket: https://nelfund.esupport.ng/create',
      'I can draft the message once you confirm the office.',
    ],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      {
        id: 'nelfund-esupport',
        label: 'NELFUND eSupport',
        url: 'https://nelfund.esupport.ng/create',
        official: true,
      },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: plan,
  }
}

function runTroubleshootingConcise(
  slots: ConversationSlots,
  intent: IntentId,
  userText: string,
  history: ConversationTurn[],
): GroundedAnswer {
  if (intent === 'institution-verification') return answerDataUploadCheck(slots)

  const grounded = answerQuestion(userText, slots.institutionId, history)
  const plan =
    grounded.escalation ||
    buildEscalationPlan(
      intent === 'email-draft' || intent === 'contact-lookup' ? 'missing-information' : intent,
      slots.institutionId,
      { errorMessage: slots.exactError },
    )

  const ack = shortAck(slots, intent)
  let core = grounded.answer || ''
  const sentences = core.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length > 2) core = sentences.slice(0, 2).join(' ')

  const next: string[] = []
  if (plan?.institutionContacts?.[0]) {
    const primary = plan.institutionContacts[0]
    if (primary.email) next.push(`Contact ${primary.label}: ${primary.email}`)
    else if (primary.url) next.push(`Confirm the right office on: ${primary.url}`)
  }
  next.push('NELFUND support if needed: https://nelfund.esupport.ng/create')
  next.push('After you contact them, tell me what they said and we can decide the next step.')

  return {
    ...grounded,
    responseMode: 'conversation',
    answer: [ack, '', core].filter(Boolean).join('\n'),
    whatThisMeans: null,
    nextActions: next.slice(0, 4),
    clarifyingQuestions: [],
    escalation: plan,
  }
}

/** No more "I am not sure I have enough detail yet" wall. */
function conversationalFallback(userText: string, history: ConversationTurn[]): GroundedAnswer {
  const lower = userText.toLowerCase()
  if (isAckOrThanks(userText) || (/thank|thanks|ok|okay|alright|got it|done|sorted/.test(lower) && userText.trim().length < 50)) {
    return simpleAnswer(
      /done|sorted|fixed|cleared/.test(lower)
        ? 'Good to hear. If anything else shows up on the portal, paste the message or a screenshot and we can continue.'
        : 'You are welcome. If another portal message appears, paste it or upload a screenshot (hide passwords and OTP).',
      'unknown',
    )
  }

  if (/login|log\s*in|sign\s*in|which\s*link/i.test(userText)) return answerPortalLogin()
  if (/upload|data\s*(been\s*)?upload|how\s*(do\s*i|to)\s*know.*school/i.test(userText)) {
    return answerDataUploadCheck(createInitialSlots(null))
  }
  if (/disqualif|eligib|deny|who\s*can\s*apply/i.test(userText)) return answerEligibilityDisqualify(userText)
  if (/open|latest|current|today|deadline|announce/i.test(userText)) {
    // Caller should prefer current-information capability; this is last resort text.
    return simpleAnswer(
      'For whether applications are open right now, check the official portal and site:\n\nhttps://portal.nelf.gov.ng/\nhttps://nelf.gov.ng/\n\nI can also summarise the latest curated status snapshot if you ask “Is NELFUND open?” again after the live agent is configured.',
      'current-information',
    )
  }

  const grounded = answerQuestion(userText, null, history)
  if (grounded.hasEvidence && grounded.answer) {
    const parts = grounded.answer.split(/(?<=[.!?])\s+/)
    return {
      ...grounded,
      responseMode: 'conversation',
      answer: parts.slice(0, 4).join(' '),
      whatThisMeans: null,
      nextActions: grounded.nextActions.slice(0, 2),
    }
  }

  return simpleAnswer(
    'I want to help with the right thing. Are you trying to:\n\n• Check if applications are open\n• Log in or find the portal link\n• Fix a portal error (paste the message if you can)\n• Contact your school or NELFUND\n• Draft an email\n\nReply with the option that fits — or paste the exact portal text.',
    'unknown',
  )
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const history = opts.history || []
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const combined = mergeQuery(rawUser, ocr)

  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
    imagePreview: opts.imagePreview || null,
    timestamp: Date.now(),
  }

  const wasAwaiting = opts.slots.awaitingInstitution
  const priorCapability = opts.slots.lastCapability
  const priorIntent = opts.slots.intent
  const priorPending = opts.slots.pendingClarify

  let slots: ConversationSlots = applyInstitutionToSlots(
    { ...opts.slots, actionsTaken: [...(opts.slots.actionsTaken || [])] },
    combined,
    opts.uiInstitutionId ?? null,
  )

  const err = extractErrorSignals(combined)
  if (err) {
    slots.exactError = err
    slots.errorConfirmed = true
    slots.problemSummary = err
    if (slots.pendingClarify === 'exact-error') slots.pendingClarify = null
  }

  if (ocr && !rawUser) {
    const ocrErr = extractErrorSignals(ocr)
    if (ocrErr) {
      slots.exactError = ocrErr
      slots.errorConfirmed = true
      slots.problemSummary = ocrErr
    }
  }

  const intentMeta = classifyIntent(combined || rawUser, history)
  let intent = intentMeta.intent

  if (wasAwaiting && slots.institutionId && priorIntent) {
    const looksLikeInstitutionOnly =
      rawUser.length < 80 && Boolean(resolveInstitutionFromText(rawUser))
    if (looksLikeInstitutionOnly || intent === 'unknown') intent = priorIntent
  }

  if (priorPending === 'which-problem' && intent === 'unknown') {
    if (/missing|record/i.test(rawUser)) intent = 'missing-information'
    else if (/jamb/i.test(rawUser)) intent = 'jamb-verification'
    else if (/nin/i.test(rawUser)) intent = 'nin-verification'
    else if (/pending|status/i.test(rawUser)) intent = 'pending-application'
    else if (/reject/i.test(rawUser)) intent = 'rejected-application'
    else if (/school.*(not|no)|not\s*show/i.test(rawUser)) intent = 'school-not-found'
    else if (/login|account|sign\s*in/i.test(rawUser)) intent = 'portal-login'
  }

  slots.intent = intent
  if (!slots.problemSummary && intentMeta.problem) slots.problemSummary = intentMeta.problem
  if (!slots.objective) slots.objective = intentMeta.problem

  let capability = resolveCapability(intent, combined || rawUser)
  if (
    wasAwaiting &&
    slots.institutionId &&
    priorCapability &&
    (priorCapability === 'email-draft' ||
      priorCapability === 'contact-lookup' ||
      priorCapability === 'troubleshooting')
  ) {
    const override = resolveCapability(intent, combined || rawUser)
    if (
      override === 'verified-knowledge' ||
      override === 'conversation' ||
      override === priorCapability
    ) {
      capability = priorCapability
    } else if (
      override === 'email-draft' ||
      override === 'contact-lookup' ||
      override === 'current-information'
    ) {
      capability = override
    } else {
      capability = priorCapability
    }
  }
  slots.lastCapability = capability

  // Direct task replies (no FAQ wall)
  if (intent === 'portal-login' || (capability === 'verified-knowledge' && /login|log\s*in|sign\s*in/i.test(combined))) {
    const answer = answerPortalLogin()
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (intent === 'institution-verification') {
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.phase = 'gather'
      slots.pendingClarify = 'which-institution'
      const text =
        answerDataUploadCheck(slots).answer +
        '\n\nWhich institution do you attend? I can then help with the right office or a draft message.'
      return {
        messages: [userMsg, { id: uid('asst'), role: 'assistant', text, isFollowUp: true, timestamp: Date.now() }],
        slots,
        diagnosed: false,
        capability: 'troubleshooting',
      }
    }
    const answer = answerDataUploadCheck(slots)
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'troubleshooting',
    }
  }

  if (intent === 'eligibility') {
    const answer = answerEligibilityDisqualify(combined || rawUser)
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (isVagueProblem(combined || rawUser, intent) && capability === 'conversation') {
    slots.phase = 'clarify'
    slots.pendingClarify = 'which-problem'
    const frustrated = /frustrat|stress|fed\s*up|tired\s*of|wahala/i.test(combined || rawUser)
    const answer = clarifyVagueMessage(frustrated)
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, isFollowUp: true, timestamp: Date.now() },
      ],
      slots,
      diagnosed: false,
      capability: 'conversation',
    }
  }

  if (capability === 'email-draft' && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.phase = 'gather'
    slots.pendingClarify = 'which-institution'
    const ask =
      'I can draft that for you. Which institution should it go to? (e.g. LASU, UNILAG — full name or short form is fine.)'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: ask, isFollowUp: true, timestamp: Date.now() }],
      slots,
      diagnosed: false,
      capability,
    }
  }

  if (capability === 'contact-lookup' && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.phase = 'gather'
    slots.pendingClarify = 'which-institution'
    const ask = 'Sure. Which institution do you attend so I can look up the right official office?'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: ask, isFollowUp: true, timestamp: Date.now() }],
      slots,
      diagnosed: false,
      capability,
    }
  }

  if (capability === 'troubleshooting') {
    if (needsInstitutionSlot(capability, intent) && !slots.institutionId) {
      slots.awaitingInstitution = true
      slots.phase = 'gather'
      slots.pendingClarify = 'which-institution'
      const ack = shortAck(slots, intent)
      const ask = `${ack}\n\nWhich institution do you attend? That tells me which office to point you to.`
      return {
        messages: [userMsg, { id: uid('asst'), role: 'assistant', text: ask, isFollowUp: true, timestamp: Date.now() }],
        slots,
        diagnosed: false,
        capability,
      }
    }
  }

  slots.phase = 'act'
  slots.pendingClarify = null
  slots.awaitingInstitution = false

  let answer: GroundedAnswer

  switch (capability) {
    case 'email-draft':
      answer = runEmailDraft(slots, intent)
      break
    case 'contact-lookup':
      answer = runContactLookup(slots, intent)
      break
    case 'current-information': {
      const cur = await buildCurrentInformationAnswerLive()
      answer = {
        hasEvidence: true,
        intent: 'current-information',
        confidence: 0.85,
        responseMode: 'conversation',
        problem: 'Current / time-sensitive NELFUND status',
        answer: cur.answer,
        whatThisMeans: null,
        nextActions: cur.nextActions.slice(0, 3),
        clarifyingQuestions: [],
        evidence: [],
        sources: cur.sources,
        video: null,
        insufficientReason: null,
        officialFallbackUrl: 'https://portal.nelf.gov.ng/',
        escalation: null,
      }
      break
    }
    case 'troubleshooting':
      answer = runTroubleshootingConcise(slots, intent, combined || rawUser, history)
      break
    case 'verified-knowledge': {
      const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
      if (grounded.hasEvidence) {
        const parts = grounded.answer.split(/(?<=[.!?])\s+/)
        answer = {
          ...grounded,
          responseMode: 'conversation',
          answer: parts.slice(0, 4).join(' '),
          whatThisMeans: null,
          nextActions: grounded.nextActions.slice(0, 3),
        }
      } else {
        answer = conversationalFallback(combined || rawUser, history)
      }
      break
    }
    case 'conversation':
    default:
      answer = conversationalFallback(combined || rawUser, history)
      break
  }

  const assistantText =
    answer.answer ||
    'Check the official portal: https://portal.nelf.gov.ng/ — or tell me more about what you are trying to do.'

  const asst: ChatMessage = {
    id: uid('asst'),
    role: 'assistant',
    text: assistantText,
    answer,
    timestamp: Date.now(),
  }

  const diagnosed =
    capability !== 'conversation' &&
    (answer.hasEvidence || capability === 'email-draft' || capability === 'contact-lookup')

  if (diagnosed) slots.phase = 'resolve'

  return { messages: [userMsg, asst], slots, diagnosed, capability }
}
