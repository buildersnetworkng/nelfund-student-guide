/**
 * Public turn entry. Conversation engine lives in ./conversation.
 * Extra student-path gates (overview, term meaning, portal UI knowledge) run first.
 */
export {
  processUserTurn as processUserTurnInner,
  createInitialSlots,
  createWelcomeMessage,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'

import {
  processUserTurn as innerProcess,
  createInitialSlots,
  type AgentTurnResult,
  type ConversationSlots,
  type ChatMessage,
} from './conversation'
import { isOverviewAsk, fullNelfundOverview } from './overviewAsk'
import { explainTerm } from './termDefine'
import { playbookAnswer } from './playbook'
import { classifyIntent } from './intentClassify'
import { matchPortalKnowledge } from './portalKnowledge'
import { understandPortalText } from './screenshotUnderstand'
import { suggest } from './suggest'
import type { IntentId } from './types'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function wrap(
  userText: string,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
): AgentTurnResult {
  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: userText,
    timestamp: Date.now(),
  }
  const chips = suggest(intent, userText)
  return {
    messages: [
      userMsg,
      {
        id: uid('asst'),
        role: 'assistant',
        text,
        timestamp: Date.now(),
        answer: {
          hasEvidence: true,
          intent,
          confidence: 0.9,
          problem: null,
          answer: text,
          nextActions: [],
          clarifyingQuestions: [...chips].slice(0, 2),
          evidence: [],
          sources: [
            { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
          ],
          video: null,
          insufficientReason: null,
          officialFallbackUrl: 'https://portal.nelf.gov.ng/',
          escalation: null,
          responseMode: 'conversation',
        },
      },
    ],
    slots: { ...slots, intent, phase: 'resolve' },
    diagnosed: true,
    capability: 'conversation',
  }
}

function gate(
  raw: string,
  slots: ConversationSlots,
  lastAsst: string | null,
  intent: IntentId,
): AgentTurnResult | null {
  const pb = playbookAnswer(intent, { userText: raw, lastAssistant: lastAsst })
  if (pb) return wrap(raw, slots, intent, pb)
  return null
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: { role: string; text: string }[]
}): Promise<AgentTurnResult> {
  const raw = (opts.userText || '').trim()
  const ocr = (typeof opts.ocrText === 'string' ? opts.ocrText : '').trim()
  const lastAsst =
    [...(opts.history || [])].reverse().find((h) => h.role === 'assistant')?.text || null
  const low = raw.toLowerCase()

  // Screenshot upload: identify page + applied status from OCR first
  if (ocr.length >= 12) {
    const screen = understandPortalText(ocr)
    if (screen) {
      const intent: IntentId =
        screen.kind === 'error'
          ? 'missing-information'
          : screen.hasApplied === true
            ? 'pending-application'
            : screen.hasApplied === false
              ? 'how-to-apply'
              : 'current-information'
      return wrap(raw || '[Screenshot uploaded]', { ...opts.slots, intent }, intent, screen.explanation)
    }
  }

  if (raw && /admission\s*letter\s*(is\s*)?required|please\s*upload\s*(an?\s*)?admission|upload\s*(an?\s*)?admission\s*letter/i.test(raw)) {
    const portalHitAdm = matchPortalKnowledge(raw)
    if (portalHitAdm) return wrap(raw, opts.slots, portalHitAdm.intent as IntentId, portalHitAdm.text)
    const hit = gate(raw, opts.slots, lastAsst, 'documents-needed')
    if (hit) return hit
  }

  if (raw && isOverviewAsk(raw)) {
    return wrap(raw, opts.slots, 'what-is-nelfund', fullNelfundOverview())
  }

  const term = raw ? explainTerm(raw, lastAsst) : null
  if (term) {
    return wrap(raw, opts.slots, term.intent, term.text)
  }

  const portalHit = raw ? matchPortalKnowledge(raw) : null
  if (portalHit) {
    return wrap(raw, opts.slots, portalHit.intent as IntentId, portalHit.text)
  }

  try {
    return await innerProcess(opts as any)
  } catch {
    const classified = classifyIntent(raw)
    const pb = playbookAnswer(classified.intent, { userText: raw, lastAssistant: lastAsst })
    return wrap(
      raw,
      opts.slots || createInitialSlots(),
      classified.intent,
      pb ||
        'Open https://portal.nelf.gov.ng/ and ask again with the exact portal wording. Official site: https://nelf.gov.ng/',
    )
  }
}
