import type { ConversationTurn, IntentId, IntentResult } from './types'
import { residualOtherRoute } from './residualOther'
import { officialFaqIntent } from './officialFaq'
import { residualOtherMore } from './residualOtherMore'
import { residualOtherHourly } from './residualOtherHourly'
import { residualOtherHourly2 } from './residualOtherHourly2'
import { residualOtherHourly3 } from './residualOtherHourly3'
import { residualOtherHourly4 } from './residualOtherHourly4'
import { residualOtherHourly5 } from './residualOtherHourly5'
import { residualOtherHourly6 } from './residualOtherHourly6'
import { residualOtherHourly7 } from './residualOtherHourly7'
import { residualOtherHourly8 } from './residualOtherHourly8'
import { residualOtherHourly9 } from './residualOtherHourly9'
import { residualOtherHourly10 } from './residualOtherHourly10'
import { residualOtherHourly11 } from './residualOtherHourly11'
import { residualOtherHourly12 } from './residualOtherHourly12'
import { residualOtherHourly13 } from './residualOtherHourly13'
import { residualOtherHourly14 } from './residualOtherHourly14'
import { residualOtherHourly15 } from './residualOtherHourly15'
import { residualOtherHourly16 } from './residualOtherHourly16'
import { residualOtherHourly17 } from './residualOtherHourly17'
import { residualOtherHourly18 } from './residualOtherHourly18'
import { residualOtherHourly19 } from './residualOtherHourly19'
import { residualOtherHourly20 } from './residualOtherHourly20'
import { residualOtherHourly21 } from './residualOtherHourly21'
import { residualOtherHourly22 } from './residualOtherHourly22'
import { residualOtherHourly23 } from './residualOtherHourly23'
import { residualOtherHourly24 } from './residualOtherHourly24'
import { residualOtherHourly25 } from './residualOtherHourly25'
import { residualOtherHourly26 } from './residualOtherHourly26'
import { residualOtherHourly27 } from './residualOtherHourly27'
import { residualOtherHourly28 } from './residualOtherHourly28'
import { residualOtherHourly29 } from './residualOtherHourly29'
import { residualOtherHourly30 } from './residualOtherHourly30'
import { residualOtherHourly31 } from './residualOtherHourly31'
import { residualOtherHourly32 } from './residualOtherHourly32'
import { residualOtherHourly33 } from './residualOtherHourly33'
import { residualOtherHourly34 } from './residualOtherHourly34'
import { residualOtherHourly35 } from './residualOtherHourly35'
import { residualOtherHourly36 } from './residualOtherHourly36'
import { residualOtherHourly37 } from './residualOtherHourly37'
import { residualOtherHourly38 } from './residualOtherHourly38'
import { residualOtherHourly39 } from './residualOtherHourly39'
import { residualOtherHourly40 } from './residualOtherHourly40'
import { residualOtherHourly41 } from './residualOtherHourly41'
import { residualOtherHourly42 } from './residualOtherHourly42'
import { residualOtherHourly43 } from './residualOtherHourly43'
import { residualOtherHourly44 } from './residualOtherHourly44'
import { residualOtherHourly45 } from './residualOtherHourly45'

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
  if (/pending|under\s*review|how\s*far|never\s*enter|mates?\s*don/.test(t)) out.push('pending')
  if (/login|sign\s*in|password|otp/.test(t)) out.push('login')
  if (/missing\s*information|not\s*on\s*(the\s*)?list/.test(t)) out.push('missing')
  return out
}

export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = (q || '').trim()
  if (!text) return null

  const faqIntent = officialFaqIntent(q)
  if (faqIntent) return faqIntent

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  const more = residualOtherMore(q, entities)
  if (more) return more

  for (const fn of [
    residualOtherHourly,
    residualOtherHourly2,
    residualOtherHourly3,
    residualOtherHourly4,
    residualOtherHourly5,
    residualOtherHourly6,
    residualOtherHourly7,
    residualOtherHourly8,
    residualOtherHourly9,
    residualOtherHourly10,
    residualOtherHourly11,
    residualOtherHourly12,
    residualOtherHourly13,
    residualOtherHourly14,
    residualOtherHourly15,
    residualOtherHourly16,
    residualOtherHourly17,
    residualOtherHourly18,
    residualOtherHourly19,
    residualOtherHourly20,
    residualOtherHourly21,
    residualOtherHourly22,
    residualOtherHourly23,
    residualOtherHourly24,
    residualOtherHourly25,
    residualOtherHourly26,
    residualOtherHourly27,
    residualOtherHourly28,
    residualOtherHourly29,
    residualOtherHourly30,
    residualOtherHourly31,
    residualOtherHourly32,
    residualOtherHourly33,
    residualOtherHourly34,
    residualOtherHourly35,
    residualOtherHourly36,
    residualOtherHourly37,
    residualOtherHourly38,
    residualOtherHourly39,
    residualOtherHourly40,
    residualOtherHourly41,
    residualOtherHourly42,
    residualOtherHourly43,
    residualOtherHourly44,
    residualOtherHourly45,
  ]) {
    try {
      const hit = fn(q, entities)
      if (hit && hit.intent !== 'unknown') return hit
    } catch {
      /* ignore */
    }
  }

  return null
}
