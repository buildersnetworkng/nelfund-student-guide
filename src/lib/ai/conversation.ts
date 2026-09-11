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
  const institutionId = uiInstitutionId || null
  let institutionName: string | null = null
  if (institutionId) {
    const inst = getInstitution(institutionId)
    if (inst) institutionName = inst.name
  }
  return {
    institutionId,
    institutionName,
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
    text: 'Ask about NELFUND in your own words, portal errors, school contacts, drafts, eligibility, or current status.',
    timestamp: Date.now(),
  }
}

function mergeQuery(user: string, ocr: string | null): string {
  if (user && ocr) return `${user}\n${ocr}`
  return user || ocr || ''
}

function applyInstitutionToSlots(
  slots: ConversationSlots,
  text: string,
  uiInstitutionId: string | null,
): ConversationSlots {
  const next = { ...slots }
  if (uiInstitutionId && !next.institutionId) {
    next.institutionId = uiInstitutionId
    const inst = getInstitution(uiInstitutionId)
    if (inst) next.institutionName = inst.name
  }
  const found = resolveInstitutionFromText(text)
  if (found) {
    next.institutionId = found
    const inst = getInstitution(found)
    if (inst) next.institutionName = inst.name
    next.awaitingInstitution = false
    next.pendingClarify = next.pendingClarify === 'institution' ? null : next.pendingClarify
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
    confidence: 0.88,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
      { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
      { id: 'esupport', label: 'NELFUND eSupport', url: 'https://nelfund.esupport.ng/create', official: true },
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

function isShortFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (t.length > 70) return false
  return /^(yes|yeah|yep|ok|okay|sure|please|continue|more|thanks|thank\s*you|abeg|step\s*2|step\s*1)\.?$/i.test(t) || (t.length < 25 && /^(and|then|also|but|so)\b/i.test(t))
}

function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (/nelfund|apply|portal|loan|jamb|pending|upkeep|create|account|step|guide/i.test(t)) return false
  if (/^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening))[.!?\s]*$/i.test(t)) return true
  return false
}

function greetingReply(): string {
  return `How far, I can help with **NELFUND**.\n\nTell me what is going on in one short line (apply, pending, missing information, JAMB error, upkeep, repayment…).`
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

  if (!ocr && rawUser && isOffTopic(rawUser, priorIntent)) {
    return finalize(userMsg, { ...opts.slots }, 'official-sources', offTopicReply(), 'conversation')
  }

  {
    const asked = rawUser || combined
    const earlyIntent = classifyIntent(asked, history).intent
    const purposeAsk =
      earlyIntent === 'what-is-nelfund' || PURPOSE_RE.test(rawUser) || isPurposeQuestion(rawUser)
    const needsLive =
      !purposeAsk && (earlyIntent === 'deadline' || questionNeedsCurrentLive(rawUser))
    if (needsLive) {
      try {
        const live = await buildCurrentInformationAnswerLive(asked)
        if (live?.answer) {
          return finalize(
            userMsg,
            { ...opts.slots, intent: 'current-information' },
            'current-information',
            live.answer,
            'conversation',
            {
              next: live.nextActions?.length ? live.nextActions.slice(0, 3) : ['https://portal.nelf.gov.ng/'],
              sources: live.sources,
            },
          )
        }
      } catch {
        /* fall through */
      }
    }
  }

  {
    const earlyIntent = classifyIntent(rawUser || combined, history).intent
    const early = playbookAnswer(earlyIntent !== 'unknown' ? earlyIntent : 'how-to-apply', {
      institutionName: opts.slots.institutionName,
      problemSummary: opts.slots.problemSummary,
      exactError: opts.slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: rawUser || combined,
      priorIntent: opts.slots.intent,
    })
    if (early && early.length > 40) {
      const intentGuess: IntentId =
        earlyIntent !== 'unknown' ? earlyIntent : priorIntent && priorIntent !== 'unknown' ? priorIntent : 'how-to-apply'
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
    (intent === 'unknown' ||
      (rawUser.length < 80 && isShortFollowUp(rawUser)) ||
      (rawUser.length < 100 && intentMeta.confidence < 0.75))
  ) {
    if (!isNewUserAsk(rawUser)) intent = priorIntent
  }
  // Step-by-step apply follow-ups keep how-to-apply
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
    const grounded = await answerQuestion({
      question: combined || rawUser,
      institutionId: slots.institutionId,
      intent,
    })
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
