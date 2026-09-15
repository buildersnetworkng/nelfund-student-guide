import type { ConversationTurn, IntentId, IntentResult } from './types'
import { residualOtherRoute } from './residualOther'
import { residualPendingMore } from './residualPendingMore'

const SCHOOL_HINTS = [
  'unilag', 'lasu', 'oou', 'yabatech', 'unilorin', 'uniben', 'oau', 'unijos',
  'noun', 'nou', 'futo', 'futa', 'abu', 'ui', 'university of lagos', 'lagos state', 'olabisi',
]

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i]
    if (turn.intent && turn.intent !== 'unknown') return turn.intent
  }
  return null
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const raw = (question || '').trim()
  if (!history?.length) return raw
  if (raw.length >= 80) return raw
  if (raw.length < 48) {
    const priorUsers = history.filter((h) => h.role === 'user').map((h) => h.text.trim()).filter(Boolean)
    if (!priorUsers.length) return raw
    const last = priorUsers[priorUsers.length - 1]
    if (!last || last === raw) return raw
    return `${last}\n${raw}`
  }
  return raw
}

export function detectEntities(text: string): string[] {
  const q = (text || '').toLowerCase()
  const out: string[] = []
  if (/\bjamb\b|utme/.test(q)) out.push('jamb')
  if (/\bnin\b/.test(q)) out.push('nin')
  if (/\bbvn\b/.test(q)) out.push('bvn')
  if (/\botp\b|one[\s-]*time/.test(q)) out.push('otp')
  if (/\bpending\b|under\s*review|how\s*far/.test(q)) out.push('status')
  if (/upkeep|stipend|allowance|20,?000/.test(q)) out.push('upkeep')
  if (/school\s*fees|tuition|institutional/.test(q)) out.push('fees')
  if (/portal|dashboard|sign\s*in|login/.test(q)) out.push('portal')
  if (SCHOOL_HINTS.some((s) => q.includes(s))) out.push('school')
  if (/missing\s*information|not\s*(on\s*)?(the\s*)?list|change\s*of\s*institution|session\s*(no|not)\s*(dey|show)/.test(q)) out.push('missing')
  if (/repay|nysc|scholarship|grant/.test(q)) out.push('policy')
  return out
}

export function isPortalDump(text: string): boolean {
  const q = (text || '').toLowerCase()
  const hits = [
    /student\s*loan\s*portal/, /total\s*loans/, /pending\s*loans/, /approved\s*loans/,
    /session\s*registration/, /successfully\s*signed\s*in/, /welcome\s*to\s*student\s*loan/,
    /dashboard/, /application\s*id/,
  ].filter((re) => re.test(q)).length
  return hits >= 2 || (hits >= 1 && q.length > 220)
}

function hit(
  intent: IntentId,
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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)
  const compact = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  const pendingMore = residualPendingMore(q, entities)
  if (pendingMore) return pendingMore

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  if (/^(ok|okay|thanks|thank\s*you|alright|seen|noted|yes|no|pls|abeg)[.!? ]*$/i.test(q)) {
    return hit('official-sources', 0.5, ['ack'], 'Short acknowledgement', 'unknown', entities)
  }
  if (/^(help(\s*me)?|abeg(\s*help)?|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['guidance', 'how-to-apply'], 'Vague help / start ask', 'preparing', entities)
  }
  if (/i\s*(need|wan(t)?)\s*(the\s*)?(student\s*)?loan|how\s*i\s*go\s*start|first\s*time\s*(apply|applicant)/i.test(q)) {
    return hit('how-to-apply', 0.8, ['how-to-apply', 'start'], 'Need loan / how I start', 'preparing', entities)
  }
  if (/^(my\s*money|check|check\s*(am|status|loan)|wetin\s*dey\s*happen)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.72, ['pending-status'], 'Short money / check status', 'waiting', entities, true)
  }
  if (/scholarship|loan\s*or\s*scholarship|na\s*scholarship|grant|free\s*money/i.test(q)) {
    return hit('loan-or-scholarship', 0.82, ['scholarship', 'loan'], 'Loan vs scholarship', 'exploring', entities)
  }
  if (/private\s*(uni|university|poly|school)|part[\s-]*time|sandwich|post\s*grad|\bphd\b|direct\s*entry/i.test(q) && !/pending|how\s*far/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility'], 'Eligibility leftover', 'exploring', entities)
  }
  if (/how\s*far|money\s*(never|no)\s*(enter|drop|show)|still\s*pending|under\s*review|i\s*don\s*apply/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status'], 'Residual pending / payout wait', 'waiting', entities, true)
  }
  if (liveish(q) || /still\s*(open|dey\s*open)|closing\s*date|open\s*again/i.test(q)) {
    return hit('current-information', 0.84, ['open-status', 'current'], 'Residual open / deadline ask', 'exploring', entities)
  }
  if (/create\s*(account|profile)|sign\s*up|how\s*(to|i\s*go)\s*apply|next\s*step|step\s*by\s*step/i.test(q)) {
    return hit('how-to-apply', 0.78, ['how-to-apply'], 'Residual apply / create account', 'preparing', entities)
  }
  if (/login|sign\s*in|password|session\s*expired|forgot/i.test(q)) {
    return hit('portal-login', 0.78, ['login'], 'Residual login', 'applying', entities, true)
  }
  if (/wetin\s*be|what\s*is\s*nelfund|purpose|why\s*(dem|they|una)\s*(create|form|bring)/i.test(q)) {
    return hit('what-is-nelfund', 0.8, ['what-is'], 'Residual purpose ask', 'exploring', entities)
  }
  if (/invalid\s*jamb|jamb\s*(no|not|never)|\butme\b/i.test(q) || entities.includes('jamb')) {
    return hit('jamb-verification', 0.82, ['jamb'], 'JAMB leftover phrasing', 'applying', entities, true)
  }
  if (entities.includes('status') || (entities.includes('upkeep') && /never|pending|wait/.test(compact))) {
    return hit('pending-application', 0.6, ['pending-status'], 'Entity status fallback', 'waiting', entities, true)
  }
  if (entities.includes('missing')) {
    return hit('missing-information', 0.62, ['missing'], 'Entity missing fallback', 'applying', entities, true)
  }
  if (entities.includes('bvn') || entities.includes('nin')) {
    return hit('nin-verification', 0.64, ['nin', 'bvn'], 'Entity BVN/NIN fallback', 'applying', entities, true)
  }
  if (entities.includes('otp')) {
    return hit('portal-login', 0.64, ['login', 'otp'], 'Entity OTP fallback', 'applying', entities, true)
  }
  if (entities.includes('school')) {
    return hit('missing-information', 0.55, ['school-list', 'other'], 'School-name residual', 'applying', entities)
  }
  if (entities.includes('portal')) {
    return hit('portal-login', 0.55, ['login', 'other'], 'Portal leftover residual', 'applying', entities, true)
  }
  if (entities.includes('fees') || entities.includes('upkeep')) {
    return hit('school-fees', 0.55, ['fees', 'other'], 'Fees/upkeep leftover residual', 'exploring', entities)
  }
  if (entities.includes('policy')) {
    return hit('repayment', 0.55, ['repayment', 'other'], 'Policy leftover residual', 'repaying', entities)
  }
  return hit('official-sources', 0.42, ['other', 'guidance'], 'Residual other → official help', 'exploring', entities)
}
