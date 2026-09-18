/** Residual routing helpers for NELFUND AI intent classification. */
import type { ConversationTurn, IntentId, IntentResult } from './types'

export function isPortalDump(text: string): boolean {
  const t = (text || '').toLowerCase()
  if (t.length < 40) return false
  const hits = [
    /student\s*loan\s*portal/,
    /dashboard/,
    /total\s*loans/,
    /pending\s*loans/,
    /approved\s*loans/,
    /session\s*registration/,
    /welcome\s*to\s*student\s*loan/,
    /successfully\s*signed\s*in/,
  ].filter((re) => re.test(t)).length
  return hits >= 2
}

function hit(
  intent: IntentResult['intent'],
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /is\s+(nelfund|application|loan)\s+(still\s+)?(open|closed)|deadline|closing\s*date|when\s*(does|will)\s*(it|application)\s*close/i.test(
    q,
  )
}

export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = (q || '').trim()
  if (!text) return null

  if (/re-?apply|apply\s*again|next\s*session|another\s*session/i.test(text) && !liveish(text)) {
    return hit('reapplication', 0.8, ['how-to-apply', 'reapply'], 'Re-apply / next session leftover', 'preparing', entities)
  }
  if (/guarantor|surety|guarantor\s*form/i.test(text)) {
    return hit('documents-needed', 0.78, ['documents', 'guarantor'], 'Guarantor leftover', 'preparing', entities)
  }
  if (/\b(bvn|nin)\b/i.test(text) && /(invalid|not\s*match|no\s*gree|reject)/i.test(text)) {
    return hit('nin-bvn', 0.82, ['nin', 'bvn'], 'NIN/BVN mismatch leftover', 'applying', entities, true)
  }
  if (/school\s*(fees?|tuition)|institutional\s*charges?/i.test(text) && /upkeep|stipend|allowance/i.test(text)) {
    return hit('upkeep-vs-fees', 0.84, ['fees', 'upkeep'], 'Fees vs upkeep leftover', 'exploring', entities)
  }
  if (/upkeep|stipend|allowance/i.test(text) && !/repay|repayment/i.test(text)) {
    return hit('upkeep-payment', 0.8, ['upkeep'], 'Upkeep leftover', 'waiting', entities)
  }
  if (/repay|repayment|when\s*(do|will)\s*i\s*(start\s*)?pay/i.test(text)) {
    return hit('repayment', 0.84, ['repayment'], 'Repayment leftover', 'exploring', entities)
  }
  if (/scam|agent|buy\s*slot|pay\s*(an?\s*)?agent/i.test(text)) {
    return hit('scam-safety', 0.9, ['other'], 'Scam leftover', 'exploring', entities)
  }
  if (/customer\s*care|hotline|phone\s*(number|no)|who\s*(do\s*i|to)\s*call/i.test(text)) {
    return hit('contact-support', 0.86, ['other'], 'Contact leftover', 'exploring', entities)
  }
  if (/^(apply|how\s*to\s*apply|i\s*want\s*to\s*apply|help\s*me\s*apply)\.?$/i.test(text)) {
    return hit('how-to-apply', 0.78, ['how-to-apply', 'other'], 'Bare apply / what next leftover', 'preparing', entities)
  }
  if (/next\s*batch|when\s*(is|be)\s*(the\s*)?next\s*(payment|batch|disburse)/i.test(text) && !liveish(text)) {
    return hit('pending-application', 0.84, ['pending-status', 'next-batch'], 'Next batch leftover', 'waiting', entities, true)
  }
  return null
}

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  // Prefer the most recent turn that carries an intent (assistant answers store intent in history).
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.intent && h.intent !== 'unknown') return h.intent
  }
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.role === 'user' && h.intent) return h.intent
  }
  return null
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const q = (question || '').trim()
  if (!history?.length) return q
  const priorUsers = history
    .filter((h) => h.role === 'user')
    .slice(-3)
    .map((h) => h.text)
    .join(' ')
  const lastAsst = [...history].reverse().find((h) => h.role === 'assistant')?.text || ''
  const followUp =
    q.length < 90 &&
    /^(alright|okay|ok|so|and|then|now|please)?\s*(what|wetin|how|where|which|who)?\s*(should|will|can|do|go)?\s*(i|we)?\s*(do|take|try)?\s*(next|now|first)?/i.test(
      q,
    )
  // Short or conversational follow-ups inherit prior user question + last assistant topic
  if ((q.length < 12 || followUp) && priorUsers) {
    const asstSnippet = lastAsst ? lastAsst.slice(0, 180) : ''
    return `${priorUsers} ${asstSnippet} ${q}`.trim()
  }
  return q
}

export function detectEntities(text: string): string[] {
  const t = (text || '').toLowerCase()
  const out: string[] = []
  if (/\bjamb\b|utme/.test(t)) out.push('jamb')
  if (/\bnin\b|national\s*id/.test(t)) out.push('nin')
  if (/\bbvn\b/.test(t)) out.push('bvn')
  if (/upkeep|stipend|allowance/.test(t)) out.push('upkeep')
  if (/school\s*fees?|tuition|institutional\s*charges?/.test(t)) out.push('fees')
  if (/pending|under\s*review/.test(t)) out.push('pending')
  if (/login|sign\s*in|password|otp/.test(t)) out.push('login')
  if (/missing\s*information|not\s*on\s*(the\s*)?list/.test(t)) out.push('missing')
  return out
}
