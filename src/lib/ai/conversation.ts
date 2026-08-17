/**
 * Conversational student-support agent for NELFUND.
 * GROUND THE FACTS, NOT THE CONVERSATION.
 *
 * Flow: understand → clarify (one question) → investigate → act → check resolution.
 * Does not dump FAQ walls on the first vague message.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswer } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
import type {
  AgentCapability,
  ConversationTurn,
  GroundedAnswer,
  IntentId,
} from './types'

export type ConversationPhase =
  | 'open'
  | 'clarify'
  | 'gather'
  | 'act'
  | 'resolve'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  awaitingInstitution: boolean
  lastCapability: AgentCapability | null
  /** What we are trying to help with */
  objective: string | null
  /** open → clarify → gather → act → resolve */
  phase: ConversationPhase
  /** Pending single clarification question type */
  pendingClarify:
    | 'which-problem'
    | 'which-institution'
    | 'exact-error'
    | 'draft-office'
    | 'current-topic'
    | null
  /** Short summary of the student problem */
  problemSummary: string | null
  /** Whether error message was confirmed */
  errorConfirmed: boolean
  /** Actions already suggested so we do not loop the same advice */
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

/** Very vague / emotional / "not working" with no specific error. */
function isVagueProblem(text: string, intent: IntentId): boolean {
  const t = text.toLowerCase().trim()
  if (t.length < 8) return true
  if (
    /^(help|hi|hello|please|abeg|pls)\.?$/i.test(t) ||
    /nelfund\s*(is\s*)?(not\s*working|no\s*dey\s*work|dey\s*frustrat)/i.test(t) ||
    /having\s*(a\s*)?(problem|issue|wahala)/i.test(t) ||
    /something\s*(is\s*)?wrong/i.test(t) ||
    /i\s*don'?t\s*know\s*what\s*to\s*do/i.test(t) ||
    /this\s*thing\s*(is\s*)?(frustrating|confusing)/i.test(t)
  ) {
    return intent === 'unknown' || intent === 'contact-support'
  }
  // Short complaint without concrete error
  if (
    intent === 'unknown' &&
    t.length < 60 &&
    /(problem|issue|help|stuck|error|not\s*working)/i.test(t)
  ) {
    return true
  }
  return false
}

function isFactualDirect(intent: IntentId, capability: AgentCapability): boolean {
  if (capability === 'current-information') return true
  if (capability === 'email-draft' || capability === 'contact-lookup') return false
  return [
    'what-is-nelfund',
    'upkeep',
    'school-fees',
    'institutional-charges',
    'repayment',
    'gsi',
    'loan-or-scholarship',
    'guarantor',
    'how-to-apply',
    'eligibility',
    'documents-needed',
    'official-sources',
    'scam-safety',
    'readiness',
  ].includes(intent)
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
      ? `Got you — that usually means the portal cannot match your student record yet (often on the ${slots.institutionName} side).`
      : 'Got you — that usually means the portal cannot match your student record with your school yet.'
  }
  if (intent === 'jamb-verification') {
    return 'Okay — JAMB number issues are often a data match problem, not that you typed randomly.'
  }
  if (intent === 'nin-verification') {
    return 'Okay — NIN verification failures are often a mismatch or temporary system issue.'
  }
  if (intent === 'pending-application') {
    return 'Understood — pending means submitted and still processing, not necessarily rejected.'
  }
  if (intent === 'rejected-application') {
    return 'Sorry that happened. We can work from whatever reason the portal shows.'
  }
  if (intent === 'school-not-found') {
    return 'Got it — school-not-showing is common and not always permanent.'
  }
  return 'Understood.'
}

function clarifyVagueMessage(): GroundedAnswer {
  return {
    hasEvidence: false,
    intent: 'unknown',
    confidence: 0.5,
    responseMode: 'conversation',
    problem: null,
    answer:
      'I can help. What part is not working?\n\n' +
      '• Creating account / login\n' +
      '• JAMB verification\n' +
      '• Missing student information\n' +
      '• School not showing\n' +
      '• Application status (pending / rejected)\n' +
      '• Something else\n\n' +
      'If you see an error, paste the exact message or upload a screenshot (hide passwords and OTP).',
    whatThisMeans: null,
    nextActions: [],
    clarifyingQuestions: [],
    evidence: [],
    sources: [],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function askOne(
  text: string,
  slots: ConversationSlots,
  capability: AgentCapability,
  intent: IntentId,
): AgentTurnResult {
  const userPlaceholder: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: '',
    timestamp: Date.now(),
  }
  // caller replaces user message
  const asst: ChatMessage = {
    id: uid('asst'),
    role: 'assistant',
    text,
    isFollowUp: true,
    timestamp: Date.now(),
  }
  return {
    messages: [userPlaceholder, asst],
    slots,
    diagnosed: false,
    capability,
  }
}

function buildGroundedFromCurrent(): GroundedAnswer {
  const cur = buildCurrentInformationAnswer()
  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: 0.85,
    responseMode: 'current-information',
    problem: 'Current / time-sensitive NELFUND status',
    answer: cur.answer,
    whatThisMeans: cur.whatThisMeans,
    nextActions: cur.nextActions,
    clarifyingQuestions: [],
    evidence: [],
    sources: cur.sources,
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
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
    whatThisMeans:
      'Writing aid only. Confirm the recipient on your institution website or the contact cards below before sending. Never include passwords, OTP, or PIN.',
    nextActions: [
      'Confirm the correct official email on your school website or the contacts below.',
      'Attach a screenshot with passwords/OTP/PIN hidden.',
      'If the school confirms your record is correct but the portal still fails: https://nelfund.esupport.ng/create',
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
  const next: string[] = []
  if (plan?.institutionContacts?.length) {
    for (const c of plan.institutionContacts.slice(0, 3)) {
      if (c.email) next.push(`${c.label}: ${c.email}`)
      else if (c.url) next.push(`${c.label}: confirm contact on ${c.url}`)
      else next.push(`${c.label}: confirm on institution website`)
    }
  }
  next.push('NELFUND support ticket: https://nelfund.esupport.ng/create')
  next.push('Never share passwords, OTP, or PIN with anyone.')
  next.push('If you want, I can draft the message once you confirm the office.')

  return {
    hasEvidence: true,
    intent: 'contact-lookup',
    confidence: 0.88,
    responseMode: 'contact-lookup',
    problem: 'Institution / NELFUND contact lookup',
    answer: narrative,
    whatThisMeans:
      'Contacts are from curated official website pointers. Dedicated unit emails appear only when verified; otherwise use the official site.',
    nextActions: next,
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

/** Concise troubleshooting: short explanation + one path, not a wall of FAQ. */
function runTroubleshootingConcise(
  slots: ConversationSlots,
  intent: IntentId,
  userText: string,
  history: ConversationTurn[],
): GroundedAnswer {
  const grounded = answerQuestion(userText, slots.institutionId, history)
  const plan =
    grounded.escalation ||
    buildEscalationPlan(
      intent === 'email-draft' || intent === 'contact-lookup' ? 'missing-information' : intent,
      slots.institutionId,
      { errorMessage: slots.exactError },
    )

  const ack = shortAck(slots, intent)
  let core = grounded.answer
  // Keep first 2 sentences max for conversational tone
  const sentences = core.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length > 2) {
    core = sentences.slice(0, 2).join(' ')
  }

  const next: string[] = []
  if (plan?.institutionContacts?.length) {
    const primary = plan.institutionContacts[0]
    if (primary.email) next.push(`Contact ${primary.label}: ${primary.email}`)
    else if (primary.url) next.push(`Confirm the right office on: ${primary.url}`)
  }
  next.push('NELFUND support ticket if needed: https://nelfund.esupport.ng/create')
  if (grounded.nextActions[0]) next.unshift(grounded.nextActions[0])
  // Deduplicate and limit
  const seen = new Set<string>()
  const limited = next.filter((a) => {
    const k = a.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 4)

  limited.push('After you contact them, tell me what they said and we can decide the next step.')

  const answerText = [
    ack,
    '',
    core,
    slots.institutionName
      ? `\nFor ${slots.institutionName}, start with the contacts below (or ask me to draft an email).`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    ...grounded,
    responseMode: 'troubleshooting',
    answer: answerText,
    whatThisMeans: grounded.whatThisMeans
      ? grounded.whatThisMeans.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
      : null,
    nextActions: limited,
    clarifyingQuestions: [],
    escalation: plan,
  }
}

function conversationalFallback(userText: string, history: ConversationTurn[]): GroundedAnswer {
  const lower = userText.toLowerCase()
  if (/thank|thanks|ok|okay|alright|got it|done|sorted/.test(lower) && userText.trim().length < 50) {
    return {
      hasEvidence: false,
      intent: 'unknown',
      confidence: 0.4,
      responseMode: 'conversation',
      problem: null,
      answer:
        /done|sorted|fixed|cleared/.test(lower)
          ? 'Good to hear. If anything else shows up on the portal, paste the message or a screenshot and we can continue.'
          : 'You are welcome. If another portal message appears, paste it or upload a screenshot (hide passwords and OTP).',
      whatThisMeans: null,
      nextActions: [],
      clarifyingQuestions: [],
      evidence: [],
      sources: [],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://portal.nelf.gov.ng/',
      escalation: null,
    }
  }
  const grounded = answerQuestion(userText, null, history)
  if (grounded.hasEvidence) return { ...grounded, responseMode: 'verified-knowledge' }
  return {
    ...grounded,
    responseMode: 'conversation',
    answer:
      'I am not sure I have enough detail yet. You can tell me the exact portal message, your institution, or ask me to draft an email / find contacts / check current status.',
  }
}

export function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): AgentTurnResult {
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

  // OCR-only: treat as error signal
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

  // Institution-only reply after we asked for school
  if (wasAwaiting && slots.institutionId && priorIntent) {
    const looksLikeInstitutionOnly =
      rawUser.length < 80 && Boolean(resolveInstitutionFromText(rawUser))
    if (looksLikeInstitutionOnly || intent === 'unknown') {
      intent = priorIntent
    }
  }

  // Pending clarify: map short answers to context
  if (priorPending === 'which-problem' && intent === 'unknown') {
    // try to pick up problem from short reply
    if (/missing|record/i.test(rawUser)) intent = 'missing-information'
    else if (/jamb/i.test(rawUser)) intent = 'jamb-verification'
    else if (/nin/i.test(rawUser)) intent = 'nin-verification'
    else if (/pending|status/i.test(rawUser)) intent = 'pending-application'
    else if (/reject/i.test(rawUser)) intent = 'rejected-application'
    else if (/school.*(not|no)|not\s*show/i.test(rawUser)) intent = 'school-not-found'
    else if (/login|account|sign\s*in/i.test(rawUser)) intent = 'profile-update'
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

  // ——— VAGUE: clarify first, do not dump FAQ ———
  if (isVagueProblem(combined || rawUser, intent) && capability === 'conversation') {
    slots.phase = 'clarify'
    slots.pendingClarify = 'which-problem'
    const answer = clarifyVagueMessage()
    const asst: ChatMessage = {
      id: uid('asst'),
      role: 'assistant',
      text: answer.answer,
      answer,
      isFollowUp: true,
      timestamp: Date.now(),
    }
    return { messages: [userMsg, asst], slots, diagnosed: false, capability: 'conversation' }
  }

  // ——— EMAIL DRAFT: need institution first ———
  if (capability === 'email-draft' && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.phase = 'gather'
    slots.pendingClarify = 'which-institution'
    const ask =
      'I can draft that for you. Which institution should it go to? (e.g. LASU, UNILAG, OOU — full name or short form is fine.)'
    const asst: ChatMessage = {
      id: uid('asst'),
      role: 'assistant',
      text: ask,
      isFollowUp: true,
      timestamp: Date.now(),
    }
    return { messages: [userMsg, asst], slots, diagnosed: false, capability }
  }

  // ——— CONTACT: need institution first ———
  if (capability === 'contact-lookup' && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.phase = 'gather'
    slots.pendingClarify = 'which-institution'
    const ask = 'Sure. Which institution do you attend so I can look up the right official office?'
    const asst: ChatMessage = {
      id: uid('asst'),
      role: 'assistant',
      text: ask,
      isFollowUp: true,
      timestamp: Date.now(),
    }
    return { messages: [userMsg, asst], slots, diagnosed: false, capability }
  }

  // ——— TROUBLESHOOTING: one question at a time ———
  if (capability === 'troubleshooting') {
    // Need institution?
    if (needsInstitutionSlot(capability, intent) && !slots.institutionId) {
      slots.awaitingInstitution = true
      slots.phase = 'gather'
      slots.pendingClarify = 'which-institution'
      const ack = shortAck(slots, intent)
      const ask = `${ack}\n\nWhich institution do you attend? That tells me which office to point you to.`
      const asst: ChatMessage = {
        id: uid('asst'),
        role: 'assistant',
        text: ask,
        isFollowUp: true,
        timestamp: Date.now(),
      }
      return { messages: [userMsg, asst], slots, diagnosed: false, capability }
    }

    // Have institution but weak error signal for jamb — ask exact error once
    if (
      intent === 'jamb-verification' &&
      !slots.errorConfirmed &&
      slots.pendingClarify !== 'exact-error' &&
      !extractErrorSignals(combined)
    ) {
      slots.phase = 'gather'
      slots.pendingClarify = 'exact-error'
      const ask =
        'What exact message does the portal show when you enter the JAMB number? (You can paste it or upload a screenshot with passwords/OTP hidden.)'
      const asst: ChatMessage = {
        id: uid('asst'),
        role: 'assistant',
        text: `Okay, let's check rather than guess.\n\n${ask}`,
        isFollowUp: true,
        timestamp: Date.now(),
      }
      return { messages: [userMsg, asst], slots, diagnosed: false, capability }
    }
  }

  // ——— ACT ———
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
    case 'current-information':
      answer = buildGroundedFromCurrent()
      break
    case 'troubleshooting':
      answer = runTroubleshootingConcise(slots, intent, combined || rawUser, history)
      break
    case 'verified-knowledge': {
      if (isFactualDirect(intent, capability)) {
        const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
        // Keep factual answers reasonably short
        let text = grounded.answer
        const parts = text.split(/(?<=[.!?])\s+/)
        if (parts.length > 4) text = parts.slice(0, 4).join(' ')
        answer = {
          ...grounded,
          responseMode: 'verified-knowledge',
          answer: text,
          nextActions: grounded.nextActions.slice(0, 3),
        }
      } else {
        answer = runTroubleshootingConcise(slots, intent, combined || rawUser, history)
      }
      break
    }
    case 'conversation':
    default:
      answer = conversationalFallback(combined || rawUser, history)
      break
  }

  // Offer single next step if troubleshooting and we have institution
  if (capability === 'troubleshooting' && slots.institutionId && !/draft/i.test(answer.answer)) {
    if (!answer.nextActions.some((a) => /draft/i.test(a))) {
      answer.nextActions = [
        ...answer.nextActions.slice(0, 3),
        'If you want, I can draft an email to your school for this issue.',
      ]
    }
  }

  const assistantText =
    answer.answer ||
    'I could not build a confident answer from verified information. Check the official portal.'

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

  return {
    messages: [userMsg, asst],
    slots,
    diagnosed,
    capability,
  }
}

// silence unused helper warning in some toolchains
void askOne
