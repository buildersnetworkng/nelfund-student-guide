/**
 * Public turn entry. Conversation engine lives in ./conversation.
 * Extra student-path gates (overview, term meaning) run first so thin
 * paraphrases never fall through to a generic portal dump.
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
  return {
    messages: [
      userMsg,
      { id: uid('asst'), role: 'assistant', text, timestamp: Date.now() },
    ],
    slots: { ...slots, intent, phase: 'resolve' },
    diagnosed: true,
    capability: 'conversation',
  }
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
  const lastAsst =
    [...(opts.history || [])].reverse().find((h) => h.role === 'assistant')?.text || null

  if (raw && isOverviewAsk(raw)) {
    return wrap(raw, opts.slots, 'what-is-nelfund', fullNelfundOverview())
  }

  const term = raw ? explainTerm(raw, lastAsst) : null
  if (term) {
    return wrap(raw, opts.slots, term.intent, term.text)
  }

  if (raw && /forgot|reset\s*password|i\s*no\s*remember\s*(my\s*)?password/i.test(raw)) {
    const pb = playbookAnswer('password-reset', { userText: raw, lastAssistant: lastAsst })
    if (pb) return wrap(raw, opts.slots, 'password-reset', pb)
  }

  if (raw && /email\s*(already|don)\s*(used|exist|register)|used\s*by\s*another/i.test(raw)) {
    const pb = playbookAnswer('email-already-used', { userText: raw, lastAssistant: lastAsst })
    if (pb) return wrap(raw, opts.slots, 'email-already-used', pb)
  }

  if (
    raw &&
    /how\s*(to|do\s*i|i\s*go|i\s*fit)\s*apply/.test(raw.toLowerCase()) &&
    /upkeep|loan/.test(raw.toLowerCase())
  ) {
    const pb = playbookAnswer('how-to-apply', { userText: raw, lastAssistant: lastAsst })
    if (pb) return wrap(raw, opts.slots, 'how-to-apply', pb)
  }

  if (raw && /(loan\s*(or|vs)\s*scholarship|na\s*scholarship|na\s*grant|free\s*money)/i.test(raw)) {
    const pb = playbookAnswer('loan-or-scholarship', { userText: raw, lastAssistant: lastAsst })
    if (pb) return wrap(raw, opts.slots, 'loan-or-scholarship', pb)
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
