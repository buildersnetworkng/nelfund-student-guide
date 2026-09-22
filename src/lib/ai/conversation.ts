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

function mergeQuery(userText: string, ocr: string | null): string {
  return [userText, ocr].filter(Boolean).join('\n').trim()
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
          return {
            messages: [
              userMsg,
              {
                id: uid('asst'),
                role: 'assistant',
                text: live.answer,
                answer: live,
                timestamp: Date.now(),
              },
            ],
            slots: { ...opts.slots, intent: 'current-information', phase: 'resolve' },
            diagnosed: true,
            capability: 'current-information',
          }
        }
      } catch {
        /* fall through */
      }
    }
  }

  // Institution resolution from text
  let slots: ConversationSlots = { ...opts.slots }
  if (opts.uiInstitutionId && !slots.institutionId) {
    slots.institutionId = opts.uiInstitutionId
    const inst = getInstitution(opts.uiInstitutionId)
    slots.institutionName = inst?.name || inst?.short_name || null
  }
  if (!slots.institutionId && rawUser) {
    const resolved = resolveInstitutionFromText(rawUser)
    if (resolved?.id) {
      slots.institutionId = resolved.id
      slots.institutionName = resolved.name || resolved.short_name || null
      slots.awaitingInstitution = false
    }
  }

  if (needsInstitutionEarly(rawUser, slots) && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.phase = 'clarify'
    return finalize(
      userMsg,
      slots,
      (slots.intent || 'official-sources') as IntentId,
      institutionAskPrompt(),
      'conversation',
    )
  }

  if (slots.awaitingInstitution && slots.institutionId) {
    slots.awaitingInstitution = false
  }

  // Near-duplicate / next-step follow-ups
  if (priorIntent && isNearDuplicate(rawUser, prevAsst)) {
    const advanced = nextStepAdvance(priorIntent, rawUser, slots)
    if (advanced) {
      return finalize(userMsg, slots, priorIntent, advanced, 'conversation')
    }
  }

  if (isNewUserAsk(rawUser, turnIndex) && priorIntent) {
    // keep going
  }

  // Core answer path
  const result = await answerQuestion({
    userText: combined || rawUser,
    history,
    slots,
    ocrText: ocr,
  })

  const capability = resolveCapability(result.intent, result)
  slots.intent = result.intent
  slots.phase = 'resolve'
  slots.lastCapability = capability
  if (result.problem) slots.problemSummary = result.problem

  return {
    messages: [
      userMsg,
      {
        id: uid('asst'),
        role: 'assistant',
        text: result.answer,
        answer: result,
        timestamp: Date.now(),
      },
    ],
    slots,
    diagnosed: true,
    capability,
  }
}
