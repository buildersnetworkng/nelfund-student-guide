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
  if (t.length > 120) return false
  if (
    /^(yes|yeah|yep|ok|okay|sure|please|continue|more|thanks|thank\s*you|abeg|alright|all\s*right|step\s*2|step\s*1)\.?$/i.test(
      t,
    )
  )
    return true
  if (t.length < 40 && /^(and|then|also|but|so)\b/i.test(t)) return true
  if (
    /what\s*(should|will|can)\s*i\s*(do|take)|what'?s\s*(the\s*)?(next|solution|first)|what\s*next|so\s*what|wetin\s*(i\s*)?(go|to)\s*do|wattin\s*i\s*go\s*do|first\s*(step|thing)|alright\s+so|so\s*wetin\s*now|na\s*wetin\s*remain|make\s*una\s*tell\s*me\s*(next|wetin)|what\s*should\s*i\s*do\s*now|wetin\s*i\s*go\s*do\s*now/i.test(
      t,
    )
  )
    return true
  return false
}
