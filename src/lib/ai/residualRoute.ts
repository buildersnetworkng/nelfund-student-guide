/**
 * Minimal residual routing helpers for intent classification.
 * Keeps classifyIntent working without the long hourly residual chain.
 */
import type { ConversationTurn, IntentId, IntentResult } from './types'
import { officialFaqIntent } from './officialFaq'
import { residualOtherHourly144 } from './residualOtherHourly144'
import { residualOtherHourly146 } from './residualOtherHourly146'
import { residualOtherHourly147 } from './residualOtherHourly147'
import { residualOtherHourly148 } from './residualOtherHourly148'
import { residualOtherHourly149 } from './residualOtherHourly149'
import { residualOtherHourly150 } from './residualOtherHourly150'
import { residualOtherHourly153 } from './residualOtherHourly153'

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
    /^(alright|okay|ok|so|and|then|now|please|abeg|pls)?\s*(what|wetin|how|where|which|who)?\s*(should|will|can|do|go)?\s*(i|we)?\s*(do|take|try)?\s*(next|now|first)?/i.test(
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
  if (/pending|under\s*review|how\s*far|never\s*enter|processing|alert\s*never|money\s*never|mates?\s*don|dashboard\s*(0|zero)|\bbatch\b/.test(t))
    out.push('pending')
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

/** Extra residual shapes for the live other unknown bucket. */
export function residualOtherRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  try {
    const h153 = residualOtherHourly153(q, entities)
    if (h153 && h153.intent !== 'unknown') return h153
  } catch {
    /* hourly optional */
  }
  return null
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

  if (/who\s*(built|founded|created|started|own|owns|establish)\s*(nelfund|the\s*loan)|nelfund\s*(founder|builder|creator)/i.test(q)) {
    return hit('what-is-nelfund', 0.9, ['what-is'], 'Who built / founded NELFUND', 'exploring', entities)
  }

  if (
    /how\s+(does\s+)?(nelfund|it|this)\s+work|how\s+nelfund\s+works|everything\s+(on|about)\s+(how\s+)?nelfund|know\s+everything/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'how-it-works'], 'How NELFUND works', 'exploring', entities)
  }

  if (
    /school\s*(not|no|never)\s*(showing|show|appear|dey|listed)|institution\s*(missing|not\s*(on|in)\s*(the\s*)?(list|portal))|cannot\s*find\s*(my\s*)?school|school\s*no\s*dey\s*list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'School missing on list', 'applying', entities, true)
  }

  if (
    /status\s*(na|is|still)\s*(pending|processing)|application\s*(still\s*)?(pending|processing)|money\s*never|how\s*far\s*(my|na)|wetin\s*dey\s*hold/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Residual pending / how far', 'waiting', entities, true)
  }

  if (
    /pendin[g]?|pendng|still\s*pend|e\s*never\s*move|e\s*no\s*move|status\s*no\s*change|no\s*update\s*since|i\s*check\s*am\s*still|dashboard\s*still\s*(0|zero|pending)|batch\s*(no|not|never)|dem\s*pay\s*my\s*mate|mates?\s*don\s*(collect|receive|see)|una\s*pay\s*others|when\s*my\s*own\s*go\s*(enter|drop|show)|approved\s*(but|and)\s*(no|never|not)\s*(money|alert)|total\s*loans?\s*(is\s*|still\s*)?(0|zero)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.86, ['pending-status'], 'Pending typo / mates paid', 'waiting', entities, true)
  }

  if (
    /jam[b]?\s*(no|not|invalid|wrong)|utme\s*(no|not)|caps\s*(no|not|fail)|jamb\s*reg\s*(no|not|invalid)|verify\s*my\s*jamb|jamb\s*details?\s*(wrong|invalid)|admission\s*letter\s*(jamb|utme)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.86, ['jamb'], 'JAMB typo residual', 'applying', entities, true)
  }

  if (
    /is\s*(it|nelfund|portal|loan|application)\s*(still\s*)?(open|on|close[d]?)|deadline|closing\s*date|can\s*i\s*still\s*apply|dem\s*still\s*dey\s*(open|collect|accept)|una\s*still\s*dey\s*(open|collect)|window\s*(still\s*)?(open|close)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status'], 'Open / deadline residual', 'exploring', entities)
  }

  try {
    const h153 = residualOtherHourly153(q, entities)
    if (h153 && h153.intent !== 'unknown') return h153
  } catch {
    /* hourly optional */
  }

  try {
    const h150 = residualOtherHourly150(q, entities)
    if (h150 && h150.intent !== 'unknown') return h150
  } catch {
    /* hourly optional */
  }

  try {
    const h149 = residualOtherHourly149(q, entities)
    if (h149 && h149.intent !== 'unknown') return h149
  } catch {
    /* hourly optional */
  }

  try {
    const h148 = residualOtherHourly148(q, entities)
    if (h148 && h148.intent !== 'unknown') return h148
  } catch {
    /* hourly optional */
  }

  try {
    const h147 = residualOtherHourly147(q, entities)
    if (h147 && h147.intent !== 'unknown') return h147
  } catch {
    /* hourly optional */
  }

  try {
    const h146 = residualOtherHourly146(q, entities)
    if (h146 && h146.intent !== 'unknown') return h146
  } catch {
    /* hourly optional */
  }

  try {
    const h144 = residualOtherHourly144(q, entities)
    if (h144 && h144.intent !== 'unknown') return h144
  } catch {
    /* hourly optional */
  }

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  return null
}
