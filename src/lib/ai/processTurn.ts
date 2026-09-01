/**
 * NELFUND AI turn entry: portal screenshot understanding first, then conversation.
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
  const allowErrorScreen = !!(ocr && ocr.trim().length >= 8)

  // Screenshot-first: if OCR looks like a portal error, force that path
  if (allowErrorScreen && screen.kind !== 'unknown' && screen.kind !== 'dashboard') {
    const enriched = {
      ...opts,
      userText: rawUser || `[Portal screenshot: ${screen.kind}]`,
      ocrText: ocr,
    }
    return processUserTurnCore(enriched)
  }

  return processUserTurnCore(opts)
}

export {
  createInitialSlots,
  createWelcomeMessage,
  extractErrorSignals,
} from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
