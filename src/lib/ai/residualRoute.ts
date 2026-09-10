import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b/i, 'jamb'],
    [/\bnin\b/i, 'nin'],
    [/\bbvn\b/i, 'bvn'],
    [/school|institution|university|poly|college/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|allowance/i, 'upkeep'],
    [/pending|status|under\s*review/i, 'status'],
    [/bank|account/i, 'bank'],
    [/portal|nelfund|nelf\.gov/i, 'portal'],
    [/login|sign\s*in|password|otp/i, 'login'],
    [/repay|gsi|pay\s*back|imprison|jail|prison/i, 'repayment'],
    [/eligib|qualify|cgpa|level/i, 'eligibility'],
    [/apply|register|sign\s*up/i, 'apply'],
    [/reject|declined|not\s*approv/i, 'rejected'],
    [/disburse|payment|money\s*enter/i, 'disbursement'],
  ]
  for (const [re, name] of map) {
    if (re.test(q) && !entities.includes(name)) entities.push(name)
  }
  return entities
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  if (!history || history.length === 0) return question
  const recentUser = history.filter((t) => t.role === 'user').slice(-2).map((t) => t.text).join(' ')
  const q = question.trim()
  if (q.length < 80 && recentUser) return `${recentUser} ${question}`
  if (q.length < 280 && recentUser && recentUser.length < 800) return `${recentUser.slice(-320)} ${question}`
  return question
}

export function isPortalDump(q: string): boolean {
  const hits = [/total\s*loans/i, /approved\s*loans/i, /pending\s*loans/i, /declined\s*loans/i, /student\s*loan\s*portal/i, /institutional\s*charges/i, /application\s*status/i, /nelf\.gov/i, /portal\.nelf/i].filter((re) => re.test(q)).length
  return q.length > 180 && hits >= 2
}

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history) return null
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].intent) return history[i].intent as IntentId
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].intent) return history[i].intent as IntentId
  }
  return null
}

const SCHOOL_ONLY = /\b(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|noun?|futo|abu|unizik|unn|unical|uniport|futa|lautech|tasued)\b/i

export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const compact = q.replace(/\s+/g, ' ').trim()
  const pidginHelp = /abeg|wetin|wahala|e\s*no\s*(dey|gree|work|show)|i\s*wan|how\s*i\s*go|no\s*gree|don\s*apply|check\s*am|help\s*me|i\s*need\s*help|assist\s*me/i.test(q)
  const vagueHelp = /^(help|please\s*help|i\s*need\s*(help|assistance)|assist(\s*me)?|stuck|confused|please|what\s*next)[.!?\s]*$/i.test(compact)
  const multiIssue = (compact.match(/\band\b|,|;|also|plus/gi) || []).length >= 2 && compact.length > 80
  const errorDump = /error\s*(code|500|400|403|404)|bad\s*request|unable\s*to|try\s*again|session\s*(timed?\s*out|expired)|something\s*went\s*wrong|kindly\s*provide|invalid\s*(login|credentials|details)|network\s*error/i.test(q)
  const alreadyApplied = /i\s*(have\s*)?(already\s*)?(don\s*)?apply|submitted\s*(my\s*)?(application|form)|check\s*(my\s*)?(loan|application)/i.test(q)
  const wantContact = /ticket|complain|esupport|customer\s*care|phone\s*number|hotline|who\s*do\s*i\s*(call|mail|contact)/i.test(q)
  const schoolOnly = SCHOOL_ONLY.test(q) && compact.length < 80 && !/apply|pending|login|jamb|nin|fee|upkeep|repay/i.test(q)
  if (errorDump) {
    if (/login|password|otp|sign\s*in/i.test(q)) return { intent: 'portal-login', confidence: 0.62, topics: ['login', 'error-dump'], problem: 'Portal login error paste', stage: 'applying', entities, isTroubleshooting: true }
    if (/pending|status|review/i.test(q) || alreadyApplied) return { intent: 'pending-application', confidence: 0.6, topics: ['pending', 'error-dump'], problem: 'Portal status / error paste', stage: 'waiting', entities, isTroubleshooting: true }
    return { intent: 'contact-support', confidence: 0.55, topics: ['error-dump'], problem: 'Portal error paste', stage: 'applying', entities, isTroubleshooting: true }
  }
  if (wantContact) return { intent: 'contact-support', confidence: 0.62, topics: ['contact'], problem: 'Contact official support', stage: 'unknown', entities, isTroubleshooting: false }
  if (alreadyApplied) return { intent: 'pending-application', confidence: 0.58, topics: ['pending'], problem: 'Already applied — status', stage: 'waiting', entities, isTroubleshooting: true }
  if (schoolOnly) return { intent: 'missing-information', confidence: 0.5, topics: ['institution'], problem: 'School named without extra keywords', stage: 'applying', entities, isTroubleshooting: true }
  if (vagueHelp || (pidginHelp && compact.length < 90)) {
    if (/apply|register|sign\s*up/i.test(q)) return { intent: 'how-to-apply', confidence: 0.52, topics: ['apply', 'pidgin'], problem: 'Pidgin / vague apply help', stage: 'preparing', entities, isTroubleshooting: false }
    return { intent: 'current-information', confidence: 0.5, topics: ['guidance', 'vague-help'], problem: 'Vague or Pidgin help request', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (multiIssue) {
    if (entities.includes('status') || /pending|how\s*far/i.test(q)) return { intent: 'pending-application', confidence: 0.52, topics: ['pending', 'multi'], problem: 'Multi-issue paste — status first', stage: 'waiting', entities, isTroubleshooting: true }
    if (entities.includes('apply')) return { intent: 'how-to-apply', confidence: 0.5, topics: ['apply', 'multi'], problem: 'Multi-issue paste — apply first', stage: 'preparing', entities, isTroubleshooting: false }
    return { intent: 'current-information', confidence: 0.48, topics: ['guidance', 'multi'], problem: 'Multi-issue paste', stage: 'exploring', entities, isTroubleshooting: false }
  }
  return null
}

export type { IntentId, IntentResult, StudentStage }
