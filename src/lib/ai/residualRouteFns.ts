import type { ConversationTurn, IntentId, IntentResult } from './types'
import { residualOtherRoute } from './residualOther'
import { officialFaqIntent } from './officialFaq'
import { residualOtherMore } from './residualOtherMore'
import { residualPendingMore } from './residualPendingMore'
import { residualOtherHourly139 } from './residualOtherHourly139'
import { residualOtherHourly140 } from './residualOtherHourly140'
import { residualOtherHourly141 } from './residualOtherHourly141'
import { residualOtherHourly142 } from './residualOtherHourly142'

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

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
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
    /^(alright|okay|ok|so|and|then|now|please|abeg)?\s*(what|wetin|how|where|which|who)?\s*(should|will|can|do|go)?\s*(i|we)?\s*(do|take|try)?\s*(next|now|first)?/i.test(
      q,
    )
  if ((q.length < 12 || followUp) && priorUsers) {
    const asstSnippet = lastAsst ? lastAsst.slice(0, 180) : ''
    return `${priorUsers} ${asstSnippet} ${q}`.trim()
  }
  return q
}

export function detectEntities(text: string): string[] {
  const t = text.toLowerCase()
  const out: string[] = []
  if (/\bjamb\b|utme/.test(t)) out.push('jamb')
  if (/\bnin\b|national\s*id/.test(t)) out.push('nin')
  if (/\bbvn\b/.test(t)) out.push('bvn')
  if (/upkeep|stipend|allowance/.test(t)) out.push('upkeep')
  if (/school\s*fees?|tuition|institutional\s*charges?/.test(t)) out.push('fees')
  if (/pending|under\s*review|how\s*far|never\s*enter|mates?\s*don|processing|nothing\s*don\s*drop|no\s*(credit\s*)?alert|money\s*(never|no)|wetin\s*(dey\s*)?happen\s*to\s*my|una\s*never\s*pay|batch\s*\d+|dashboard\s*(0|zero)|disburse|kobo\s*never/.test(t))
    out.push('pending')
  if (/login|sign\s*in|password|otp/.test(t)) out.push('login')
  if (/missing\s*information|not\s*on\s*(the\s*)?list/.test(t)) out.push('missing')
  return out
}

export function residualSoftRouteRest(q: string, entities: string[]): IntentResult | null {
  const text = (q || '').trim()
  if (!text) return null
  const faqIntent = officialFaqIntent(q)
  if (faqIntent) return faqIntent
  const extra = residualOtherRoute(q, entities)
  if (extra) return extra
  const more = residualOtherMore(q, entities)
  if (more) return more
  const pendingMore = residualPendingMore(q, entities)
  if (pendingMore) return pendingMore
  for (const fn of [residualOtherHourly142, residualOtherHourly141, residualOtherHourly140, residualOtherHourly139]) {
    try {
      const hit = fn(q, entities)
      if (hit && hit.intent !== 'unknown') return hit
    } catch {
      /* ignore */
    }
  }
  return null
}
