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
  const lastAsst =
    [...(opts.history || [])].reverse().find((h) => h.role === 'assistant')?.text || null
  const low = raw.toLowerCase()

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

  if (raw && /forgot|reset\s*password|i\s*no\s*remember\s*(my\s*)?password|password\s*no\s*dey\s*work/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'password-reset')
    if (hit) return hit
  }

  if (raw && /email\s*(already|don|don\s*already)\s*(used|exist|register)|used\s*by\s*another|old\s*email\s*(from\s*)?(last\s*)?year/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'email-already-used')
    if (hit) return hit
  }

  if (raw && /how\s*(do\s*i|to|i\s*go|i\s*fit)\s*(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'portal-login')
    if (hit) return hit
  }

  if (raw && /how\s*(to|do\s*i|i\s*go|i\s*fit)\s*apply/.test(low) && /upkeep|loan/.test(low)) {
    const hit = gate(raw, opts.slots, lastAsst, 'how-to-apply')
    if (hit) return hit
  }

  if (raw && /(loan\s*(or|vs)\s*scholarship|na\s*scholarship|na\s*grant|free\s*money)/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'loan-or-scholarship')
    if (hit) return hit
  }

  if (raw && /school\s*(no|not|never)\s*(dey|show|on\s*(the\s*)?list)|cannot\s*find\s*(my\s*)?school|institution\s*(missing|not\s*listed)/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'school-not-found')
    if (hit) return hit
  }

  if (raw && /missing\s*information|information\s*(no|not)\s*dey|name\s*(no|not)\s*dey\s*(the\s*)?portal/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'missing-information')
    if (hit) return hit
  }

  if (raw && /pending|how\s*far\s*(my|na|now)|when\s*(dem|they)\s*(go|will)\s*pay|never\s*(enter|drop|credit)|disburse/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'pending-application')
    if (hit) return hit
  }

  if (raw && /invalid\s*jamb|jamb\s*(no|not|never|invalid)|verify\s*with\s*jamb/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'jamb-verification')
    if (hit) return hit
  }

  if (raw && /repay|pay\s*back|after\s*nysc|when\s*(i|una)\s*(go|will)\s*pay\s*(am|back)/i.test(raw) && !/how\s*to\s*apply/.test(low)) {
    const hit = gate(raw, opts.slots, lastAsst, 'repayment')
    if (hit) return hit
  }

  if (raw && /scam|fake\s*portal|pay\s*(an?\s*)?agent|otp|buy\s*slot/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'scam-safety')
    if (hit) return hit
  }

  if (raw && /contact\s*(support|nelfund)|esupport|customer\s*care|who\s*(do\s*i|to)\s*call/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'contact-support')
    if (hit) return hit
  }

  if (raw && /documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry|requirements?\s*to\s*apply/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'documents-needed')
    if (hit) return hit
  }

  if (raw && /application\s*(open|close|still\s*dey)|is\s*(the\s*)?(loan|portal|application)\s*(open|close)|deadline|window/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'current-information')
    if (hit) return hit
  }

  if (raw && /interest[-\s]*free|zero\s*interest|any\s*interest/i.test(raw)) {
    const hit = gate(raw, opts.slots, lastAsst, 'loan-or-scholarship')
    if (hit) return hit
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
