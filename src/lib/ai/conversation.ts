/**
 * NELFUND AI conversational core. Restored after bad push.
 * Off-topic gate lives in ./offTopic and respects priorIntent.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive, isPurposeQuestion, questionNeedsCurrentLive } from './current'
import { PURPOSE_RE, classifyIntent } from './intent'
import { isOffTopic } from './offTopic'
import { isNearDuplicate, isNewUserAsk, nextStepAdvance, playbookAnswer } from './playbook'
import { institutionAskPrompt, needsInstitutionEarly } from './supportGates'
import type { AgentCapability, ConversationTurn, GroundedAnswer, IntentId } from './types'
import { understandPortalText } from './screenshotUnderstand'
import { isGreeting, greetingReply } from './greetings'

export type ConversationPhase = 'open' | 'clarify' | 'gather' | 'act' | 'resolve'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  jamb: string | null
  nin: string | null
  problemSummary: string | null
  objective: string | null
  phase: ConversationPhase
  awaitingInstitution: boolean
  pendingClarify: string | null
  lastCapability: AgentCapability | null
  errorConfirmed: boolean
  actionsTaken: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
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

export function createInitialSlots(uiInstitutionId?: string | null): ConversationSlots {
  const inst = uiInstitutionId ? getInstitution(uiInstitutionId) : null
  return {
    institutionId: uiInstitutionId || null,
    institutionName: inst?.name || inst?.short_name || null,
    intent: null,
    exactError: null,
    studentName: null,
    matric: null,
    jamb: null,
    nin: null,
    problemSummary: null,
    objective: null,
    phase: 'open',
    awaitingInstitution: false,
    pendingClarify: null,
    lastCapability: null,
    errorConfirmed: false,
    actionsTaken: [],
  }
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: uid('sys'),
    role: 'assistant',
    text: greetingReply(),
    timestamp: Date.now(),
  }
}

function mergeQuery(user: string, ocr: string | null): string {
  return [user, ocr].filter(Boolean).join('\n').trim()
}

function applyInstitutionToSlots(
  slots: ConversationSlots,
  text: string,
  uiInstitutionId: string | null,
): ConversationSlots {
  const next = { ...slots, actionsTaken: [...(slots.actionsTaken || [])] }
  if (uiInstitutionId && !next.institutionId) {
    next.institutionId = uiInstitutionId
    const inst = getInstitution(uiInstitutionId)
    next.institutionName = inst?.name || inst?.short_name || null
  }
  if (!next.institutionId && text) {
    const resolved = resolveInstitutionFromText(text)
    if (resolved?.id) {
      next.institutionId = resolved.id
      next.institutionName = resolved.name || resolved.short_name || null
      next.awaitingInstitution = false
    }
  }
  return next
}

function lightAnswer(
  intent: IntentId,
  text: string,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.85,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function lastAssistantText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') return history[i].text || ''
  }
  return ''
}

function userTurnCount(history: ConversationTurn[]): number {
  return history.filter((h) => h.role === 'user').length
}

function isAckClose(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 60) return false
  if (
    /^(alright|all\s*right|alright\s*(boss|sir|ma|bro|sis|o|oh|now|then)?|ok(ay)?|ok(ay)?\s*(boss|sir|ma|bro|sis)?|yes\s*(sir|ma|boss)?|yeah|yep|yup|sure|correct|true|noted|got\s*it|i\s*hear\s*(you|una)|i\s*see|sharp|copy|received|understood|thank(s|\s*you)|tenki|bless\s*(you|up)|nice|cool|fine|good|done|clear|roger|bet|fiam|e\s*don\s*clear|na\s*am|na\s*so|i\s*dey|okay\s*boss)(\s+(boss|sir|ma|bro|sis|o|oh|now|then))?$/i.test(
      t,
    )
  )
    return true
  return false
}

function isExpandRequest(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 120) return false
  if (
    /^(please\s*)?(tell\s*me\s*more|tell\s*me\s*(everything|all|about\s*(it|this|that|them)?)|more\s*(details?|info|information|about\s*(it|this)?)?|elaborate(\s*(more|on\s*(it|this)?)?)?|expanciate(\s*(more|on\s*(it|this)?)?)?|expand(\s*(it|more|please|on\s*(it|this)?)?)?|explain\s*(more|further|again|better|it|this)?|break\s*(it\s*)?down(\s*more)?|go\s*(deeper|further|on)|continue|more\s*please|give\s*me\s*more|add\s*more|full\s*(detail|explanation)|in\s*detail|more\s*explanation|say\s*more|unpack\s*(it|this)|wetin\s*else|any\s*other\s*(thing|info)|and\s*then|what\s*else|more\s*on\s*(that|this|it))(\s+(abeg|please|pls))?$/i.test(
      t,
    )
  )
    return true
  if (/tell\s*me\s*more\s*about/i.test(t) && t.length < 60) return true
  if (/^(please\s+)?(tell|explain|break)\s*(me\s*)?(more|further|again)/i.test(t) && t.length < 60)
    return true
  return false
}

function isNextStepAsk(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 60) return false
  return /^(what\s*next|what'?s\s*next|wetin\s*next|so\s*what(\s*now)?|first\s*step|what\s*should\s*i\s*do(\s*now)?|wetin\s*i\s*go\s*do(\s*now)?|so\s*wetin\s*now)$/i.test(t)
}

function softCloseReply(): string {
  return `Alright, you are covered for now.\n\nIf anything else comes up on the portal (pending, missing information, JAMB, login, upkeep), just type it here. I am still here.`
}

function expandReply(priorIntent: IntentId, slots: ConversationSlots, prevAsst: string, userText: string): string {
  const advanced = nextStepAdvance(
    {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      lastAssistant: prevAsst,
      userText,
      priorIntent,
    } as any,
    priorIntent,
  )
  if (advanced && advanced.length > 30) {
    return `**More on this**\n\n${advanced}\n\nIf the portal still shows the same error after the school confirms upload, open a ticket at https://nelfund.esupport.ng/create with a screenshot.`
  }
  if (priorIntent === 'missing-information' || priorIntent === 'school-not-found') {
    return `**More on missing information**\n\n1. The portal only shows your name after **your school** uploads the student record for this session.\n2. Take admission letter + JAMB number to ICT / Registry / campus NELFUND desk and ask them to confirm the upload.\n3. After they confirm, wait a bit, then retry https://portal.nelf.gov.ng/\n4. Still empty after school confirms: https://nelfund.esupport.ng/create (attach screenshot).\n\nI cannot see your school file from this chat.`
  }
  if (priorIntent === 'what-is-nelfund' || priorIntent === 'nelfund-history' || priorIntent === 'nelfund-purpose') {
    return `**More on NELFUND**\n\nNELFUND was set up under the Students Loans (Access to Higher Education) Act so eligible students in **public** tertiary institutions can access interest-free loans for institutional charges and optional upkeep.\n\n- Institutional charges go to the school.\n- Upkeep (if ticked) goes to your bank account.\n- It is a **loan**, not a scholarship.\n\nOfficial: https://nelf.gov.ng/ and https://portal.nelf.gov.ng/`
  }
  return `**More detail**\n\n1. Open https://portal.nelf.gov.ng/ and note the exact status or error\n2. If it points to your school, use the campus NELFUND desk\n3. Still stuck: https://nelfund.esupport.ng/create`
}

function isShortFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (t.length > 120) return false
  if (isAckClose(t) || isExpandRequest(t) || isNextStepAsk(t)) return true
  if (
    /^(yes|yeah|yep|ok|okay|sure|please|continue|more|thanks|thank\s*you|abeg|alright|all\s*right|step\s*2|step\s*1|alright\s*boss|okay\s*boss)\.?$/i.test(
      t,
    )
  )
    return true
  if (t.length < 40 && /^(and|then|also|but|so)\b/i.test(t)) return true
  if (
    /what\s*(should|will|can)\s*i\s*(do|take)|what'?s\s*(the\s*)?(next|solution|first)|what\s*next|so\s*what|wetin\s*(i\s*)?(go|to)\s*do|wattin\s*i\s*go\s*do|first\s*(step|thing)|alright\s+so|so\s*wetin\s*now|na\s*wetin\s*remain|make\s*una\s*tell\s*me\s*(next|wetin)|what\s*should\s*i\s*do\s*now|wetin\s*i\s*go\s*do\s*now|tell\s*me\s*more|elaborate|expanciate/i.test(
      t,
    )
  )
    return true
  return false
}

function offTopicReply(): string {
  return `I only cover **NELFUND** (apply, portal problems, eligibility, upkeep, repayment, school records).\n\nWhat NELFUND issue should we handle?`
}

function finalize(
  userMsg: ChatMessage,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
  capability: AgentCapability,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources']; escalation?: GroundedAnswer['escalation'] },
): AgentTurnResult {
  const answer = lightAnswer(intent, text, opts)
  if (opts?.escalation) answer.escalation = opts.escalation
  slots.intent = intent
  slots.phase = slots.awaitingInstitution ? 'clarify' : 'resolve'
  slots.lastCapability = capability
  return {
    messages: [
      userMsg,
      { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
    ],
    slots,
    diagnosed: true,
    capability,
  }
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  try {
    return await processUserTurnInner(opts)
  } catch {
    const rawUser = (opts.userText || '').trim()
    const userMsg: ChatMessage = {
      id: uid('user'),
      role: 'user',
      text: rawUser || (opts.ocrText ? '[Screenshot uploaded]' : ''),
      imagePreview: opts.imagePreview || null,
      timestamp: Date.now(),
    }
    if (isGreeting(rawUser)) {
      return finalize(userMsg, { ...opts.slots }, 'official-sources', greetingReply(), 'conversation')
    }
    if (isAckClose(rawUser)) {
      return finalize(
        userMsg,
        { ...opts.slots },
        (opts.slots.intent || 'official-sources') as IntentId,
        softCloseReply(),
        'conversation',
      )
    }
    return finalize(
      userMsg,
      { ...opts.slots },
      'official-sources',
      'I hit a snag processing that. Try rephrasing, or open portal.nelf.gov.ng directly.',
      'conversation',
    )
  }
}

async function processUserTurnInner(opts: {
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
  const prevAsst = lastAssistantText(history)
  const turnIndex = userTurnCount(history)
  const priorIntent = opts.slots.intent

  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
    imagePreview: opts.imagePreview || null,
    timestamp: Date.now(),
  }

  if (!ocr && rawUser && isGreeting(rawUser)) {
    return finalize(userMsg, { ...opts.slots }, 'official-sources', greetingReply(), 'conversation')
  }

  if (
    !ocr &&
    rawUser &&
    isAckClose(rawUser) &&
    priorIntent &&
    priorIntent !== 'unknown' &&
    priorIntent !== 'official-sources'
  ) {
    return finalize(userMsg, { ...opts.slots }, priorIntent, softCloseReply(), 'conversation')
  }

  if (
    !ocr &&
    rawUser &&
    isExpandRequest(rawUser) &&
    priorIntent &&
    priorIntent !== 'unknown'
  ) {
    const deeper = expandReply(priorIntent, opts.slots, prevAsst, rawUser)
    return finalize(userMsg, { ...opts.slots, intent: priorIntent }, priorIntent, deeper, 'conversation')
  }

  if (
    !ocr &&
    rawUser &&
    isNextStepAsk(rawUser) &&
    priorIntent &&
    priorIntent !== 'unknown' &&
    priorIntent !== 'official-sources'
  ) {
    const step = nextStepAdvance(
      {
        institutionName: opts.slots.institutionName,
        problemSummary: opts.slots.problemSummary,
        exactError: opts.slots.exactError,
        lastAssistant: prevAsst,
        userText: rawUser,
        priorIntent,
      } as any,
      priorIntent,
    )
    return finalize(userMsg, { ...opts.slots, intent: priorIntent }, priorIntent, step, 'conversation')
  }

  if (!ocr && rawUser && isOffTopic(rawUser, priorIntent)) {
    return finalize(userMsg, { ...opts.slots }, 'official-sources', offTopicReply(), 'conversation')
  }

  {
    const classified = classifyIntent(rawUser || combined, history)
    let earlyIntent = classified.intent
    const keepPrior =
      priorIntent &&
      priorIntent !== 'unknown' &&
      priorIntent !== 'official-sources' &&
      (isShortFollowUp(rawUser) || isExpandRequest(rawUser) || isNextStepAsk(rawUser) || isAckClose(rawUser)) &&
      (earlyIntent === 'unknown' || earlyIntent === 'official-sources' || classified.confidence < 0.55)
    if (keepPrior) {
      earlyIntent = priorIntent
    }
    const early = playbookAnswer(earlyIntent !== 'unknown' ? earlyIntent : 'how-to-apply', {
      institutionName: opts.slots.institutionName,
      problemSummary: opts.slots.problemSummary,
      exactError: opts.slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: rawUser || combined,
      priorIntent: priorIntent || opts.slots.intent,
    })
    if (
      early &&
      early.length > 40 &&
      !(
        /How far, welcome/i.test(early) &&
        priorIntent &&
        priorIntent !== 'unknown' &&
        priorIntent !== 'official-sources'
      )
    ) {
      const intentGuess: IntentId =
        earlyIntent !== 'unknown'
          ? earlyIntent
          : priorIntent && priorIntent !== 'unknown'
            ? priorIntent
            : 'official-sources'
      return finalize(userMsg, { ...opts.slots, intent: intentGuess }, intentGuess, early, 'conversation', {
        next: ['https://portal.nelf.gov.ng/'],
      })
    }
  }

  const slots: ConversationSlots = applyInstitutionToSlots(
    { ...opts.slots, actionsTaken: [...(opts.slots.actionsTaken || [])] },
    combined,
    opts.uiInstitutionId ?? null,
  )

  const intentMeta = classifyIntent(rawUser || combined, history)
  let intent: IntentId = intentMeta.intent
  if (
    priorIntent &&
    priorIntent !== 'unknown' &&
    (isShortFollowUp(rawUser) || isExpandRequest(rawUser) || isNextStepAsk(rawUser)) &&
    (intent === 'unknown' || intent === 'official-sources' || intentMeta.confidence < 0.55)
  ) {
    intent = priorIntent
  }
  if (
    priorIntent === 'how-to-apply' &&
    /step|one\s*by\s*one|guide|creating|create|continue|next/i.test(rawUser)
  ) {
    intent = 'how-to-apply'
  }
  slots.intent = intent
  if (intentMeta.problem) slots.problemSummary = slots.problemSummary || intentMeta.problem

  const capability = resolveCapability(intent, combined || rawUser)
  slots.lastCapability = capability

  if (needsInstitutionEarly(intent) && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.pendingClarify = 'institution'
    const pb = playbookAnswer(intent, {
      institutionName: null,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined,
      priorIntent,
    })
    return finalize(userMsg, slots, intent, `${pb || ''}\n\n${institutionAskPrompt(intent)}`.trim(), capability)
  }

  {
    const pb = playbookAnswer(intent, {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: rawUser || combined,
      priorIntent,
    })
    if (pb && pb.length > 40) {
      let esc = null as GroundedAnswer['escalation']
      try {
        if (slots.institutionId) {
          esc = buildEscalationPlan(intent, slots.institutionId, {
            errorMessage: slots.exactError || slots.problemSummary,
          })
        }
      } catch {
        esc = null
      }
      return finalize(userMsg, slots, intent, pb, capability, {
        next: pb.includes('portal.nelf.gov.ng') ? undefined : ['https://portal.nelf.gov.ng/'],
        escalation: esc || undefined,
      })
    }
  }

  try {
    const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
    if (grounded?.answer) {
      return finalize(userMsg, slots, intent, grounded.answer, capability, {
        next: grounded.nextActions,
        sources: grounded.sources,
        escalation: grounded.escalation || undefined,
      })
    }
  } catch {
    /* fall through */
  }

  const fallback = playbookAnswer(intent, {
    institutionName: slots.institutionName,
    problemSummary: slots.problemSummary,
    exactError: slots.exactError,
    turnIndex,
    lastAssistant: prevAsst,
    userText: combined,
    priorIntent,
  })
  return finalize(
    userMsg,
    slots,
    intent,
    fallback ||
      'I can help with NELFUND. Say if you mean sign up, login, loan application, pending status, school fees, or upkeep.',
    capability,
  )
}
