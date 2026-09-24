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
import { residualOtherHourly154 } from './residualOtherHourly154'
import { residualOtherHourly155 } from './residualOtherHourly155'

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

function tryHourly155(q: string, entities: string[]): IntentResult | null {
  try {
    const h155 = residualOtherHourly155(q, entities)
    if (h155 && h155.intent !== 'unknown') return h155
  } catch {
    /* hourly optional */
  }
  return null
}

/** Extra residual shapes for the live other unknown bucket. */
export function residualOtherRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  const h155 = tryHourly155(q, entities)
  if (h155) return h155

  try {
    const h154 = residualOtherHourly154(q, entities)
    if (h154 && h154.intent !== 'unknown') return h154
  } catch {
    /* hourly optional */
  }

  try {
    const h153 = residualOtherHourly153(q, entities)
    if (h153 && h153.intent !== 'unknown') return h153
  } catch {
    /* hourly optional */
  }

  if (
    /email\s*(already|don|has|is)\s*(used|exist|registered)|registered\s*(last\s*)?year|account\s*already|forgot\s*(my\s*)?password|cannot\s*(log\s*in|login)|otp\s*(no|not|never)|mail\s*(don|already)\s*(use|exist)|this\s*email\s*has\s*already|mail\s*already\s*in\s*use/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'Email used / last year register', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(no|not|never|invalid|wrong|fail|reject)|utme\s*(no|not|invalid)|cannot\s*verify\s*jamb|jamb\s*no\s*dey\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.9, ['jamb'], 'JAMB verification residual', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|list)|institution\s*(no|not)\s*(dey|on|in)|cannot\s*(see|find)\s*(my\s*)?school|school\s*missing/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'School list residual', 'applying', entities, true)
  }

  if (
    /when\s*(do\s*i|to|i\s*(go|fit))\s*(start\s*)?repay|pay\s*back|after\s*nysc|how\s*(will|go)\s*i\s*pay|repayment\s*(start|begin|plan)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.88, ['repayment'], 'Repayment residual', 'repaying', entities)
  }

  if (
    /how\s*far|still\s*pending|application\s*(is\s*)?pending|wetin\s*dey\s*hold|money\s*never|status\s*(na|is|still)\s*pending|una\s*never\s*pay|waiting\s*for\s*(loan|upkeep|alert)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Pending residual', 'waiting', entities, true)
  }

  if (
    /^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening)|yo|sup|gm)\s*(una|there|boss|sir|ma)?[.!? ]*$/i.test(q) ||
    /^(please|pls|abeg)?\s*(help|assist|guide)\s*(me)?\s*(out)?[.!? ]*$/i.test(q)
  ) {
    return hit('official-sources', 0.72, ['greeting-vague'], 'Greeting / vague help', 'exploring', entities)
  }

  if (
    /i\s*(just\s*)?(need|wan|want)\s*(help|info|information|guidance)|abeg\s*(help|assist)|una\s*fit\s*help|i\s*dey\s*(lost|confused|stranded)|gimme\s*(menu|options|list)|short\s*menu|kindly\s*assist|orientate\s*me/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.86, ['greeting-vague'], 'Vague Pidgin / help menu', 'exploring', entities)
  }

  if (
    /i\s*(wan|want|wanna|go)\s*(to\s*)?(apply|register)|how\s*(i\s*)?(go|fit|can|do)\s*(apply|register)|steps?\s*(to\s*)?apply|how\s*to\s*apply|apply.{0,24}(loan|upkeep)|loan\s*and\s*upkeep/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.88, ['apply'], 'Vague apply start residual', 'applying', entities)
  }

  if (/missing\s*info|information\s*(is\s*)?(missing|not\s*showing)|profile\s*(no|not)\s*complete/i.test(q)) {
    return hit('missing-information', 0.88, ['missing-info'], 'Missing information residual', 'applying', entities, true)
  }

  if (/what\s*(is|be)\s*nelfund|wetin\s*be\s*nelfund|nelfund\s*all\s*about|explain\s*nelfund/i.test(q)) {
    return hit('what-is-nelfund', 0.86, ['what-is'], 'What is NELFUND residual', 'exploring', entities)
  }

  return null
}

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
    /how\s*(do\s*i|to|i\s*(go|fit|can)|can\s*i)\s*(log\s*in|login|sign\s*in|sign\s*up)|portal\s*(log\s*in|login|sign\s*in)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'How to log in / sign in', 'applying', entities, true)
  }

  if (/who\s*(built|founded|created|started|own|owns|establish)\s*(nelfund|the\s*loan)/i.test(q)) {
    return hit('what-is-nelfund', 0.9, ['what-is'], 'Who built / founded NELFUND', 'exploring', entities)
  }

  if (
    /how\s+(does\s+)?(nelfund|it|this|dis)\s+(thing|stuff|matter|loan)?\s*(dey\s*)?work|how\s+nelfund\s+works|go\s*through.{0,24}nelfund|whole\s+nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'how-it-works'], 'How NELFUND works', 'exploring', entities)
  }

  if (
    /what\s+do\s+(you|u)\s+mean.{0,40}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+institutional|school\s*fees?\s*(mean|na)/i.test(
      q,
    )
  ) {
    return hit('institutional-charges', 0.92, ['fees'], 'Institutional charges term residual', 'exploring', entities)
  }

  if (/\bjamb\b|utme/.test(q) && /invalid|wrong|fail|verify|not\s*work|no\s*gree/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb'], 'JAMB residual soft', 'applying', entities, true)
  }

  if (/school\s*(not|no|never)\s*(show|dey|appear|list)|cannot\s*find\s*(my\s*)?school/i.test(q)) {
    return hit('school-not-found', 0.9, ['school-list'], 'School list residual soft', 'applying', entities, true)
  }

  if (/repay|pay\s*back|after\s*nysc|when\s*(do\s*i|to)\s*pay/i.test(q)) {
    return hit('repayment', 0.88, ['repayment'], 'Repayment residual soft', 'repaying', entities)
  }

  if (
    /status\s*(na|is|still)\s*(pending|processing)|application\s*(still\s*)?(pending|processing)|money\s*never|how\s*far\s*(my|na)|wetin\s*dey\s*hold/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Residual pending / how far', 'waiting', entities, true)
  }

  if (
    /is\s*(it|nelfund|portal|loan|application)\s*(still\s*)?(open|on|close[d]?)|deadline|closing\s*date|can\s*i\s*still\s*apply/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status'], 'Open / deadline residual', 'exploring', entities)
  }

  const h155 = tryHourly155(q, entities)
  if (h155) return h155

  try {
    const h154 = residualOtherHourly154(q, entities)
    if (h154 && h154.intent !== 'unknown') return h154
  } catch {
    /* hourly optional */
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

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  return null
}
