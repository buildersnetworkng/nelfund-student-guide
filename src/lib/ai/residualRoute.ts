/**
 * Minimal residual routing helpers for intent classification.
 * Keeps classifyIntent working without the long hourly residual chain.
 */
import type { ConversationTurn, IntentId, IntentResult } from './types'
import { officialFaqIntent } from './officialFaq'

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

/**
 * Soft residual route: official FAQ first, then a few high-value patterns.
 * Returns null when nothing matches so classifyIntent can fall through.
 */
export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)

  try {
    const faqIntent = officialFaqIntent(q)
    if (faqIntent) {
      return hit(faqIntent, 0.92, ['official-faq'], 'Official FAQ topic', 'exploring', entities)
    }
  } catch {
    /* officialFaq optional */
  }

  if (
    /how\s*(do\s*i|to|i\s*(go|fit|can)|can\s*i)\s*(log\s*in|login|sign\s*in|sign\s*up)|log\s*in\s*(to|into|for)?\s*(the\s*)?(portal|nelfund)|sign\s*in\s*(to|into)?\s*(the\s*)?(portal|nelfund)|portal\s*(log\s*in|login|sign\s*in)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'How to log in / sign in', 'applying', entities, true)
  }

  if (
    /(difference|diff|vs|versus|between).{0,40}(upkeep|stipend).{0,40}(fee|fees|tuition|charges)|((fee|fees|tuition|charges).{0,40}(upkeep|stipend)|(upkeep|stipend).{0,40}(fee|fees|tuition|charges))/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.9, ['upkeep', 'fees'], 'Upkeep vs school fees', 'exploring', entities)
  }

  if (/who\s*(built|founded|created|started|own|owns|establish)\s*(nelfund|the\s*fund)|nelfund\s*(founder|builder|creator)/i.test(q)) {
    return hit('what-is-nelfund', 0.9, ['what-is'], 'Who built / founded NELFUND', 'exploring', entities)
  }

  if (
    /how\s+(does\s+)?(nelfund|it|this)\s+work|how\s+nelfund\s+works|everything\s+(on|about)\s+(how\s+)?nelfund|know\s+everything/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'how-it-works'], 'How NELFUND works', 'exploring', entities)
  }

  return null
}
