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
  return /is\s+(nelfund\s+)?(loan\s*)?(upkeep\s*)?(application\s*)?(still\s+|currently\s+)?(open|closed|dey\s+open)|loan\s+application\s+(still\s+)?(open|closed)|still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|nelfund\s+(loan\s+)?(application\s+)?open/i.test(
    q,
  )
}

export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)
  const compact = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  // Official FAQ topics (any wording) -> correct intent so playbook returns FAQ answer
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

  const hourly = residualOtherHourly(q, entities)
  if (hourly) return hourly

  const hourly2 = residualOtherHourly2(q, entities)
  if (hourly2) return hourly2

  const hourly3 = residualOtherHourly3(q, entities)
  if (hourly3) return hourly3

  const hourly4 = residualOtherHourly4(q, entities)
  if (hourly4) return hourly4

  const hourly5 = residualOtherHourly5(q, entities)
  if (hourly5) return hourly5

  const hourly6 = residualOtherHourly6(q, entities)
  if (hourly6) return hourly6

  const hourly7 = residualOtherHourly7(q, entities)
  if (hourly7) return hourly7

  const hourly8 = residualOtherHourly8(q, entities)
  if (hourly8) return hourly8

  const hourly9 = residualOtherHourly9(q, entities)
  if (hourly9) return hourly9

  const hourly10 = residualOtherHourly10(q, entities)
  if (hourly10) return hourly10

  const hourly11 = residualOtherHourly11(q, entities)
  if (hourly11) return hourly11

  const hourly12 = residualOtherHourly12(q, entities)
  if (hourly12) return hourly12

  const hourly13 = residualOtherHourly13(q, entities)
  if (hourly13) return hourly13

  const hourly14 = residualOtherHourly14(q, entities)
  if (hourly14) return hourly14

  const hourly15 = residualOtherHourly15(q, entities)
  if (hourly15) return hourly15

  const hourly16 = residualOtherHourly16(q, entities)
  if (hourly16) return hourly16

  const hourly17 = residualOtherHourly17(q, entities)
  if (hourly17) return hourly17

  const hourly18 = residualOtherHourly18(q, entities)
  if (hourly18) return hourly18

  const hourly19 = residualOtherHourly19(q, entities)
  if (hourly19) return hourly19

  const hourly20 = residualOtherHourly20(q, entities)
  if (hourly20) return hourly20

  const hourly21 = residualOtherHourly21(q, entities)
  if (hourly21) return hourly21

  const hourly22 = residualOtherHourly22(q, entities)
  if (hourly22) return hourly22

  const hourly23 = residualOtherHourly23(q, entities)
  if (hourly23) return hourly23

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
