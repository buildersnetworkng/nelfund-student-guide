/**
 * Conversation orchestrator for NELFUND student support.
 * GROUND THE FACTS, NOT THE CONVERSATION.
 *
 * Pipeline:
 *   user message (+ optional OCR)
 *   → merge slots / detect institution
 *   → classify intent
 *   → resolve capability (override for draft / contact / current)
 *   → execute capability
 *   → return assistant messages + updated slots
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

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  awaitingInstitution: boolean
  lastCapability: AgentCapability | null
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
  }
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: uid('welcome'),
    role: 'assistant',
    text: 'Ask about applications, portal errors, school contacts, or current NELFUND status. I use verified information and will not invent contacts or deadlines.',
    isFollowUp: true,
    timestamp: Date.now(),
  }
}

/** Extract portal-style error phrases from free text or OCR. */
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
  }
  return next
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
    '',
    'Do not include passwords, OTP, PIN, BVN, or NIN in the email body unless an official channel explicitly requires a non-secret identifier and you are sure it is safe.',
  ]
  return {
    hasEvidence: true,
    intent: 'email-draft',
    confidence: 0.9,
    responseMode: 'email-draft',
    problem: 'Support email draft',
    answer: lines.join('\n'),
    whatThisMeans: 'This is a writing aid. Verify the recipient on your institution website or the contact cards below before sending.',
    nextActions: [
      'Confirm the correct official email on your school website or the contacts shown below.',
      'Attach a screenshot with passwords/OTP/PIN hidden.',
      'Open a NELFUND support ticket if the school confirms your record is correct but the portal still fails: https://nelfund.esupport.ng/create',
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

function runContactLookup(slots: ConversationSlots, intent: IntentId, _userText: string): GroundedAnswer {
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

  return {
    hasEvidence: true,
    intent: 'contact-lookup',
    confidence: 0.88,
    responseMode: 'contact-lookup',
    problem: 'Institution / NELFUND contact lookup',
    answer: narrative,
    whatThisMeans:
      'Contacts shown are from curated official website pointers in this guide. Dedicated unit emails are only shown when verified; otherwise you are directed to the official site.',
    nextActions: next,
    clarifyingQuestions: plan?.needsInstitution ? ['Which institution do you attend?'] : [],
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

function conversationalFallback(userText: string, history: ConversationTurn[]): GroundedAnswer {
  const lower = userText.toLowerCase()
  if (/thank|thanks|ok|okay|alright|got it/.test(lower) && userText.trim().length < 40) {
    return {
      hasEvidence: false,
      intent: 'unknown',
      confidence: 0.4,
      responseMode: 'conversation',
      problem: null,
      answer: 'You are welcome. If another portal message appears, paste it here or upload a screenshot (hide passwords and OTP).',
      whatThisMeans: null,
      nextActions: ['Ask about application steps, portal errors, school contacts, or current NELFUND status.'],
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
      grounded.answer +
      '\n\nYou can also ask me to draft an email to your school, find official contacts, or check the latest status this guide has on file.',
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

  let slots = applyInstitutionToSlots(
    { ...opts.slots },
    combined,
    opts.uiInstitutionId ?? null,
  )

  const err = extractErrorSignals(combined)
  if (err) slots.exactError = err

  const intentMeta = classifyIntent(combined || rawUser, history)
  let intent = intentMeta.intent

  // Institution-only reply after we asked for school: keep prior intent
  if (wasAwaiting && slots.institutionId && priorIntent) {
    const looksLikeInstitutionOnly =
      rawUser.length < 80 && Boolean(resolveInstitutionFromText(rawUser))
    if (looksLikeInstitutionOnly || intent === 'unknown') {
      intent = priorIntent
    }
  }
  slots.intent = intent

  let capability = resolveCapability(intent, combined || rawUser)
  // Preserve email-draft / contact-lookup when user only named the school
  if (
    wasAwaiting &&
    slots.institutionId &&
    priorCapability &&
    (priorCapability === 'email-draft' || priorCapability === 'contact-lookup' || priorCapability === 'troubleshooting')
  ) {
    const override = resolveCapability(intent, combined || rawUser)
    // Only keep prior if new message does not explicitly switch to a stronger capability
    if (override === 'verified-knowledge' || override === 'conversation' || override === priorCapability) {
      capability = priorCapability
    } else if (override === 'email-draft' || override === 'contact-lookup' || override === 'current-information') {
      capability = override
    } else {
      capability = priorCapability
    }
  }
  slots.lastCapability = capability

  if (needsInstitutionSlot(capability, intent) && !slots.institutionId) {
    slots.awaitingInstitution = true
    const ask: ChatMessage = {
      id: uid('asst'),
      role: 'assistant',
      text:
        capability === 'email-draft'
          ? 'I can draft a professional email for you. Which institution do you attend? (full name or short form, e.g. LASU, UNILAG, OOU)'
          : capability === 'contact-lookup'
            ? 'I can help you find the right official office. Which institution do you attend?'
            : 'This usually needs your school records office or ICT. Which institution do you attend so I can point you to the right place?',
      isFollowUp: true,
      timestamp: Date.now(),
    }
    return {
      messages: [userMsg, ask],
      slots,
      diagnosed: false,
      capability,
    }
  }

  let answer: GroundedAnswer

  switch (capability) {
    case 'email-draft':
      answer = runEmailDraft(slots, intent)
      break
    case 'contact-lookup':
      answer = runContactLookup(slots, intent, combined)
      break
    case 'current-information':
      answer = buildGroundedFromCurrent()
      break
    case 'troubleshooting':
    case 'verified-knowledge': {
      const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
      answer = { ...grounded, responseMode: capability }
      if (capability === 'troubleshooting' && !answer.escalation) {
        answer.escalation = buildEscalationPlan(
          intent === 'email-draft' || intent === 'contact-lookup' ? 'missing-information' : intent,
          slots.institutionId,
          { errorMessage: slots.exactError },
        )
      }
      break
    }
    case 'conversation':
    default:
      answer = conversationalFallback(combined || rawUser, history)
      break
  }

  slots.awaitingInstitution = false

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

  return {
    messages: [userMsg, asst],
    slots,
    diagnosed,
    capability,
  }
}
