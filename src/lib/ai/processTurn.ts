/**
 * Entry point for offline turns: interpret portal screenshots first, then conversation.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
} from './conversation'
import type { ConversationTurn } from './types'
import { understandPortalText } from './screenshotUnderstand'
import type { GroundedAnswer } from './types'

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

  const screen = understandPortalText(combined)
  if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
    const slots: ConversationSlots = { ...opts.slots, actionsTaken: [...(opts.slots.actionsTaken || [])] }
    if (screen.exactError) {
      slots.exactError = screen.exactError
      slots.problemSummary = screen.exactError
      slots.errorConfirmed = true
    } else if (screen.kind === 'dashboard') {
      slots.problemSummary = slots.problemSummary || 'portal_dashboard'
    }
    slots.phase = 'resolve'

    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: screen.kind === 'error' ? 'missing-information' : 'current-information',
      confidence: 0.88,
      responseMode: 'conversation',
      problem: screen.exactError || screen.kind,
      answer: screen.explanation,
      whatThisMeans: null,
      nextActions: screen.nextActions.slice(0, 4),
      clarifyingQuestions: [],
      evidence: [],
      sources: [
        {
          id: 'portal',
          label: 'NELFUND portal',
          url: 'https://portal.nelf.gov.ng/',
          official: true,
        },
      ],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://portal.nelf.gov.ng/',
      escalation: null,
    }

    return {
      messages: [
        {
          id: uid('user'),
          role: 'user',
          text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
          imagePreview: opts.imagePreview || null,
          timestamp: Date.now(),
        },
        {
          id: uid('asst'),
          role: 'assistant',
          text: answer.answer,
          answer,
          timestamp: Date.now(),
        },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  return processUserTurnCore(opts)
}

export {
  createInitialSlots,
  createWelcomeMessage,
  extractErrorSignals,
} from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
