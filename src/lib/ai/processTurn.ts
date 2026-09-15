/**
 * NELFUND AI turn entry: portal screenshot understanding first, then conversation.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
} from './conversation'
import type { ConversationTurn } from './types'
import { understandPortalText, dashboardFollowUpExplanation } from './screenshotUnderstand'
import type { GroundedAnswer } from './types'
import { isPurposeAsk } from './intentClassify'
import { playbookAnswer } from './playbook'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const combined = [rawUser, ocr].filter(Boolean).join('\n')

  if (isPurposeAsk(rawUser) && !ocr) {
    const answerText = playbookAnswer('what-is-nelfund', { userText: rawUser })
    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: 'what-is-nelfund',
      confidence: 0.95,
      responseMode: 'conversation',
      problem: 'What NELFUND is / why it was created',
      answer: answerText,
      whatThisMeans: null,
      nextActions: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'],
      clarifyingQuestions: [],
      evidence: [],
      sources: [
        { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
        { id: 'faq', label: 'NELFUND FAQ', url: 'https://nelf.gov.ng/faq', official: true },
      ],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://nelf.gov.ng/',
      escalation: null,
    }
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser, imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots: { ...opts.slots, intent: 'what-is-nelfund', phase: 'resolve' },
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  return processUserTurnCore(opts)
}

export {
  createInitialSlots,
  createWelcomeMessage,
  extractErrorSignals,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'
