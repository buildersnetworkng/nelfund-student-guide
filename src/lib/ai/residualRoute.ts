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
import { residualPendingMore } from './residualPendingMore'

const SCHOOL_HINTS = [
  'unilag',
  'lasu',
  'oou',
  'yabatech',
  'unilorin',
  'ui',
  'oau',
  'uniben',
  'abu',
  'unijos',
  'futo',
  'noun',
]

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.role === 'user' && h.intent) return h.intent
  }
  return null
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const q = (question || '').trim()
  if (!history?.length) return q
  const prior = history
    .filter((h) => h.role === 'user')
    .slice(-3)
    .map((h) => h.text)
    .join(' ')
  if (q.length < 12 && prior) return `${prior} ${q}`
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
  if (SCHOOL_HINTS.some((s) => t.includes(s))) out.push('school')
  return out
}

export function isPortalDump(text: string): boolean {
  const t = text || ''
  return t.length > 280 && /(portal\.nelf|nelf\.gov|status|pending|invalid)/i.test(t)
}

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string | null,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /is\s+(nelfund\s+)?(loan\s*)?(upkeep\s*)?(application\s*)?(still\s+|currently\s+)?(open|closed|dey\s+open)|loan\s+application\s+(still\s+)?(open|closed)|still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|nelfund\s+(loan\s+)?(application\s+)?open/i.test(
    q,
  )
}

export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)
  const compact = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  const faqIntent = officialFaqIntent(q)
  if (faqIntent) {
    return hit(faqIntent, 0.92, ['official-faq'], 'Official FAQ topic', 'exploring', entities)
  }

  const pendingMore = residualPendingMore(q, entities)
  if (pendingMore) return pendingMore

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  const more = residualOtherMore(q, entities)
  if (more) return more

  const hourlyFns = [
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
  ]
  for (const fn of hourlyFns) {
    const hourly = fn(q, entities)
    if (hourly) return hourly
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status'], 'Is NELFUND open / deadline', 'applying', entities)
  }

  if (/email\s*(already\s*)?(used|exist)|registered\s*last\s*year|account\s*already/i.test(q)) {
    return hit('portal-login', 0.88, ['login'], 'Email already used, log in instead', 'applying', entities)
  }

  if (/invalid\s*jamb|jamb\s*(number\s*)?(invalid|wrong|error)/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb'], 'Invalid JAMB number', 'applying', entities, true)
  }

  if (/school\s*(not|no)\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*(found|showing)/i.test(q)) {
    return hit('school-not-found', 0.88, ['school'], 'School not on list', 'applying', entities, true)
  }

  if (/pending|under\s*review|how\s*far|money\s*(never|no)\s*enter/i.test(q)) {
    return hit('pending-application', 0.85, ['pending'], 'Pending application', 'waiting', entities, true)
  }

  if (/how\s*(to|do\s*i)\s*apply|step\s*by\s*step|sign\s*up/i.test(q)) {
    return hit('how-to-apply', 0.8, ['apply'], 'How to apply', 'applying', entities)
  }

  if (compact.length < 8) {
    return hit('official-sources', 0.4, ['vague'], 'Vague short message', 'unknown', entities)
  }

  return null
}
