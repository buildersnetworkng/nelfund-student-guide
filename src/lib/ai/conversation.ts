/**
 * Conversational dialogue manager for NELFUND student support.
 */

import { classifyIntent } from './intent'
import { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
import { diagnosticAssemble } from './diagnostics'
import {
  buildEscalationPlan,
  needsInstitutionForEscalation,
  resolveInstitutionFromText,
} from '../escalation'
import { getSource, sources, getInstitution } from '../data'
import type {
  ConversationTurn,
  EvidenceItem,
  GroundedAnswer,
  IntentId,
  IntentResult,
  AnswerSource,
  AnswerVideo,
} from './types'

const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  confidence: number
  exactError: string | null
  ocrText: string | null
  screenshotAttached: boolean
  isTroubleshooting: boolean
  entities: string[]
  problem: string | null
  askedFor: Array<'institution' | 'exact_error' | 'screenshot' | 'jamb_match' | 'when_submitted'>
  phase: 'gathering' | 'ready' | 'answered'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  imagePreview?: string | null
  answer?: GroundedAnswer | null
  isFollowUp?: boolean
  timestamp: number
}

export interface AgentTurnResult {
  messages: ChatMessage[]
  slots: ConversationSlots
  diagnosed: boolean
}

function emptySlots(): ConversationSlots {
  return {
    institutionId: null,
    institutionName: null,
    intent: null,
    confidence: 0,
    exactError: null,
    ocrText: null,
    screenshotAttached: false,
    isTroubleshooting: false,
    entities: [],
    problem: null,
    askedFor: [],
    phase: 'gathering',
  }
}

export function extractErrorSignals(text: string): {
  exactError: string | null
  intentHint: IntentId | null
} {
  const patterns: Array<{ re: RegExp; label: string; intent: IntentId }> = [
    { re: /missing\s*information\s*[-–—]?\s*student\s*records?/i, label: 'Missing Information – Student Records', intent: 'missing-information' },
    { re: /missing\s*information/i, label: 'Missing Information', intent: 'missing-information' },
    { re: /student\s*records?\s*(not\s*found|missing|unavailable)/i, label: 'Student records not found', intent: 'missing-information' },
    { re: /school\s*(not\s*found|not\s*listed|does\s*not\s*appear|no\s*dey\s*show)/i, label: 'School not found / not listed', intent: 'school-not-found' },
    { re: /invalid\s*(jamb|registration)|jamb.*(invalid|reject|not\s*accept|incorrect|no\s*dey)/i, label: 'Invalid or rejected JAMB registration number', intent: 'jamb-verification' },
    { re: /not\s*accepting\s*my\s*jamb|jamb\s*(registration\s*)?(number\s*)?(keeps?\s*)?(reject|fail|invalid)/i, label: 'JAMB registration number not accepted', intent: 'jamb-verification' },
    { re: /missing\s*info|no\s*dey\s*show\s*missing|e\s*dey\s*show\s*missing/i, label: 'Missing Information', intent: 'missing-information' },
    { re: /nin.*(invalid|mismatch|not\s*match|reject)/i, label: 'NIN verification problem', intent: 'nin-verification' },
    { re: /pending|under\s*review|processing/i, label: 'Application pending / under review', intent: 'pending-application' },
    { re: /reject(ed)?|not\s*approved|declined/i, label: 'Application rejected', intent: 'rejected-application' },
  ]
  for (const p of patterns) {
    if (p.re.test(text)) return { exactError: p.label, intentHint: p.intent }
  }
  return { exactError: null, intentHint: null }
}

function resolveInstitution(
  text: string,
  uiInstitutionId: string | null,
  slots: ConversationSlots,
): { id: string | null; name: string | null } {
  if (uiInstitutionId) {
    const inst = getInstitution(uiInstitutionId)
    return { id: uiInstitutionId, name: inst?.name ?? uiInstitutionId }
  }
  if (slots.institutionId) return { id: slots.institutionId, name: slots.institutionName }
  const fromText = resolveInstitutionFromText(text)
  if (fromText) {
    const inst = getInstitution(fromText)
    return { id: fromText, name: inst?.name ?? fromText }
  }
  return { id: null, name: null }
}

function mergeSlots(
  prev: ConversationSlots,
  intentMeta: IntentResult,
  text: string,
  uiInstitutionId: string | null,
  ocrText: string | null,
  hasImage: boolean,
): ConversationSlots {
  const signals = extractErrorSignals([text, ocrText || ''].join(' '))
  const inst = resolveInstitution(text, uiInstitutionId, prev)

  let intent = prev.intent
  let confidence = prev.confidence
  if (
    intentMeta.intent !== 'unknown' &&
    (intentMeta.confidence >= confidence || !intent || intent === 'unknown')
  ) {
    intent = intentMeta.intent
    confidence = intentMeta.confidence
  }
  if (signals.intentHint && (!intent || intent === 'unknown' || confidence < 0.6)) {
    intent = signals.intentHint
    confidence = Math.max(confidence, 0.7)
  }

  const supportIntent =
    Boolean(intent && needsInstitutionForEscalation(intent as IntentId)) ||
    Boolean(signals.intentHint && needsInstitutionForEscalation(signals.intentHint))

  const isTroubleshooting =
    prev.isTroubleshooting ||
    intentMeta.isTroubleshooting ||
    Boolean(signals.intentHint) ||
    supportIntent ||
    hasImage

  const exactError =
    signals.exactError ||
    prev.exactError ||
    (ocrText && ocrText.length > 8 && /missing|invalid|error|reject|not found|pending/i.test(ocrText)
      ? ocrText.slice(0, 160).trim()
      : null)

  return {
    ...prev,
    institutionId: inst.id,
    institutionName: inst.name,
    intent: intent || intentMeta.intent,
    confidence: confidence || intentMeta.confidence,
    exactError,
    ocrText: ocrText || prev.ocrText,
    screenshotAttached: prev.screenshotAttached || hasImage,
    isTroubleshooting,
    entities: Array.from(new Set([...prev.entities, ...intentMeta.entities])),
    problem: intentMeta.problem || prev.problem,
    askedFor: prev.askedFor,
    phase: prev.phase,
  }
}

function nextFollowUp(slots: ConversationSlots): {
  question: string
  slot: ConversationSlots['askedFor'][number]
} | null {
  if (!slots.isTroubleshooting && slots.intent && slots.intent !== 'unknown') {
    return null
  }

  const needsSchool =
    slots.intent &&
    needsInstitutionForEscalation(slots.intent) &&
    !slots.institutionId

  if (needsSchool && !slots.askedFor.includes('institution')) {
    return {
      slot: 'institution',
      question: 'I can help you troubleshoot that. Which institution/school are you attending?',
    }
  }

  const errorIntents: IntentId[] = [
    'missing-information',
    'jamb-verification',
    'nin-verification',
    'school-not-found',
    'institution-verification',
  ]
  if (
    slots.intent &&
    errorIntents.includes(slots.intent) &&
    !slots.exactError &&
    !slots.screenshotAttached &&
    !slots.askedFor.includes('exact_error')
  ) {
    return {
      slot: 'exact_error',
      question:
        'What exact message does the portal show? If you can, upload a screenshot of the error (hide any password, OTP, or PIN).',
    }
  }

  if (
    slots.intent === 'jamb-verification' &&
    !slots.askedFor.includes('jamb_match') &&
    slots.institutionId
  ) {
    return {
      slot: 'jamb_match',
      question:
        'Does the JAMB registration number you are entering match the one on your official JAMB profile or admission letter exactly (no extra spaces or digits)?',
    }
  }

  if (
    slots.intent === 'pending-application' &&
    !slots.askedFor.includes('when_submitted') &&
    slots.institutionId
  ) {
    return {
      slot: 'when_submitted',
      question: 'Roughly when did you submit the application (for example this week, last month)?',
    }
  }

  if (needsSchool) {
    return {
      slot: 'institution',
      question:
        'To point you to the right office at your school, please tell me which institution you attend (full name or common short name is fine).',
    }
  }

  return null
}

function buildSources(evidence: EvidenceItem[]): AnswerSource[] {
  const out: AnswerSource[] = []
  const seen = new Set<string>()
  for (const e of evidence) {
    if (!e.source_id || seen.has(e.source_id)) continue
    seen.add(e.source_id)
    const s = getSource(e.source_id)
    if (s) out.push({ id: s.id, label: s.label, url: s.url, official: s.official })
    else out.push({ id: e.source_id, label: e.source_id, url: null, official: false })
  }
  if (out.length === 0 || !out.some((s) => s.official)) {
    const portal = sources.find((x) => x.id === 'nelfund-portal' || (x.official && x.scope === 'nelfund-wide'))
    if (portal && !seen.has(portal.id)) {
      out.push({ id: portal.id, label: portal.label, url: portal.url, official: portal.official })
    }
  }
  return out.sort((a, b) => Number(b.official) - Number(a.official))
}

function mapVideo(
  v: NonNullable<ReturnType<typeof retrieveRelevantVideo>>,
): AnswerVideo {
  return {
    id: v.id,
    title: v.title,
    url: v.url,
    channel: v.channel,
    source_type: v.source_type,
    verification_status: v.verification_status,
    warning: v.warning,
    freshness_note: v.freshness_note,
  }
}

function produceDiagnosis(
  slots: ConversationSlots,
  userText: string,
  _history: ConversationTurn[],
): GroundedAnswer {
  const intent = (slots.intent || 'unknown') as IntentId
  const intentMeta: IntentResult = {
    intent,
    confidence: slots.confidence || 0.6,
    topics: [],
    problem: slots.problem,
    stage: 'unknown',
    entities: slots.entities,
    isTroubleshooting: slots.isTroubleshooting,
  }

  const retrievalQuery = [userText, slots.exactError, slots.ocrText, slots.institutionName]
    .filter(Boolean)
    .join(' ')

  const evidence = retrieveEvidence(retrievalQuery, intent, slots.institutionId)
  const strongEvidence = evidence.filter(
    (e) =>
      e.verification_status === 'verified' ||
      e.verification_status === 'may_change' ||
      e.verification_status === 'guidance',
  )

  if (strongEvidence.length === 0 && intent === 'unknown') {
    return {
      hasEvidence: false,
      intent,
      confidence: intentMeta.confidence,
      problem: intentMeta.problem,
      answer:
        "I do not have enough verified information in this guide's knowledge layer to answer that confidently.",
      whatThisMeans:
        'This assistant only answers from verified NELFUND information and does not invent policies, contacts, or deadlines.',
      nextActions: [
        'Check the official NELFUND portal: https://portal.nelf.gov.ng/',
        'Review official announcements on https://nelf.gov.ng/',
      ],
      clarifyingQuestions: ['What exact message or screen are you seeing?'],
      evidence: [],
      sources: buildSources([]),
      video: null,
      insufficientReason: 'No matching verified knowledge for this question.',
      officialFallbackUrl: OFFICIAL_PORTAL,
      escalation: null,
    }
  }

  const assembled = diagnosticAssemble(intent, strongEvidence, intentMeta)
  const videoRaw = retrieveRelevantVideo(strongEvidence, intent, slots.institutionId)
  const escalation = buildEscalationPlan(intent, slots.institutionId, {
    errorMessage: slots.exactError,
  })

  let answerText = assembled.answer
  if (slots.exactError) {
    answerText = `From what you shared, the portal is showing something like: \"${slots.exactError}\". ${assembled.answer}`
  } else if (slots.screenshotAttached && slots.ocrText) {
    answerText = `I looked at the text visible in your screenshot. ${assembled.answer}`
  }
  if (slots.institutionName && escalation && !escalation.needsInstitution) {
    answerText += ` Since you attend ${slots.institutionName}, I can also point you to the relevant institutional offices below.`
  }

  return {
    hasEvidence: strongEvidence.length > 0,
    intent,
    confidence: intentMeta.confidence,
    problem: intentMeta.problem,
    answer: answerText,
    whatThisMeans: assembled.whatThisMeans,
    nextActions: assembled.nextActions,
    clarifyingQuestions: [],
    evidence: strongEvidence,
    sources: buildSources(strongEvidence),
    video: videoRaw ? mapVideo(videoRaw) : null,
    insufficientReason: strongEvidence.length === 0 ? 'Limited verified evidence for this specific case.' : null,
    officialFallbackUrl: OFFICIAL_PORTAL,
    escalation,
  }
}

let msgCounter = 0
function mid(): string {
  msgCounter += 1
  return `m-${Date.now()}-${msgCounter}`
}

export function processUserTurn(args: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId: string | null
  slots: ConversationSlots
  history: ConversationTurn[]
}): AgentTurnResult {
  const text = (args.userText || '').trim()
  const ocr = (args.ocrText || '').trim() || null
  const hasImage = Boolean(args.imagePreview)

  const historyForIntent: ConversationTurn[] = [
    ...args.history,
    { role: 'user', text: text || ocr || '[screenshot]' },
  ]

  const intentMeta = classifyIntent(text || ocr || 'missing information', historyForIntent)
  let slots = mergeSlots(args.slots, intentMeta, text || ocr || '', args.uiInstitutionId, ocr, hasImage)

  const userMsg: ChatMessage = {
    id: mid(),
    role: 'user',
    text: text || (hasImage ? 'Uploaded a screenshot of the portal.' : ''),
    imagePreview: args.imagePreview || null,
    timestamp: Date.now(),
  }

  const out: ChatMessage[] = [userMsg]

  if (hasImage && slots.exactError) {
    out.push({
      id: mid(),
      role: 'assistant',
      text: `I can see the portal is showing something like: \"${slots.exactError}\". That usually means NELFUND cannot fully match your student information with an institutional record yet.`,
      isFollowUp: true,
      timestamp: Date.now(),
    })
  } else if (hasImage && ocr && ocr.length > 5) {
    out.push({
      id: mid(),
      role: 'assistant',
      text: 'I read the text visible in your screenshot. Tell me which institution you attend if you have not already, and I will narrow down the next steps.',
      isFollowUp: true,
      timestamp: Date.now(),
    })
  } else if (hasImage && (!ocr || ocr.length < 5)) {
    out.push({
      id: mid(),
      role: 'assistant',
      text: 'I could not extract clear portal text from that image. What exact message or problem are you seeing on the NELFUND portal?',
      isFollowUp: true,
      timestamp: Date.now(),
    })
    slots = {
      ...slots,
      askedFor: slots.askedFor.includes('exact_error')
        ? slots.askedFor
        : [...slots.askedFor, 'exact_error'],
    }
    return { messages: out, slots, diagnosed: false }
  }

  const follow = nextFollowUp(slots)
  if (follow) {
    slots = {
      ...slots,
      askedFor: slots.askedFor.includes(follow.slot)
        ? slots.askedFor
        : [...slots.askedFor, follow.slot],
      phase: 'gathering',
    }
    const alreadySaid = out.some(
      (m) => m.role === 'assistant' && m.text.includes('Which institution'),
    )
    if (!alreadySaid) {
      out.push({
        id: mid(),
        role: 'assistant',
        text: follow.question,
        isFollowUp: true,
        timestamp: Date.now(),
      })
    } else if (follow.slot !== 'institution') {
      out.push({
        id: mid(),
        role: 'assistant',
        text: follow.question,
        isFollowUp: true,
        timestamp: Date.now(),
      })
    }
    return { messages: out, slots, diagnosed: false }
  }

  slots = { ...slots, phase: 'ready' }
  const answer = produceDiagnosis(slots, text || ocr || slots.exactError || '', historyForIntent)
  slots = { ...slots, phase: 'answered' }

  out.push({
    id: mid(),
    role: 'assistant',
    text: answer.answer,
    answer,
    isFollowUp: false,
    timestamp: Date.now(),
  })

  return { messages: out, slots, diagnosed: true }
}

export function createInitialSlots(uiInstitutionId: string | null): ConversationSlots {
  const base = emptySlots()
  if (uiInstitutionId) {
    const inst = getInstitution(uiInstitutionId)
    return {
      ...base,
      institutionId: uiInstitutionId,
      institutionName: inst?.name ?? uiInstitutionId,
    }
  }
  return base
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: mid(),
    role: 'assistant',
    text: 'Hi. Describe your NELFUND problem in your own words (Pidgin is fine), or attach a screenshot from your gallery or camera. I will ask only what I need, then guide you with verified steps — I will not invent contacts or policies.',
    isFollowUp: true,
    timestamp: Date.now(),
  }
}
