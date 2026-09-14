import type { ConversationTurn, IntentId, IntentResult } from './types'

const SCHOOL_HINTS = [
  'unilag',
  'lasu',
  'oou',
  'yabatech',
  'unilorin',
  'uniben',
  'oau',
  'unijos',
  'noun',
  'nou',
  'futo',
  'futa',
  'abu',
  'ui',
  'university of lagos',
  'lagos state',
  'olabisi',
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
    const priorUsers = history
      .filter((h) => h.role === 'user')
      .map((h) => h.text.trim())
      .filter(Boolean)
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
  if (/\bpending\b|under\s*review|how\s*far/.test(q)) out.push('status')
  if (/upkeep|stipend|allowance|20,?000/.test(q)) out.push('upkeep')
  if (/school\s*fees|tuition|institutional/.test(q)) out.push('fees')
  if (/portal|dashboard|sign\s*in|login/.test(q)) out.push('portal')
  if (SCHOOL_HINTS.some((s) => q.includes(s))) out.push('school')
  if (/missing\s*information|not\s*(on\s*)?(the\s*)?list/.test(q)) out.push('missing')
  if (/repay|nysc|scholarship|grant/.test(q)) out.push('policy')
  return out
}

export function isPortalDump(text: string): boolean {
  const q = (text || '').toLowerCase()
  const hits = [
    /student\s*loan\s*portal/,
    /total\s*loans/,
    /pending\s*loans/,
    /approved\s*loans/,
    /session\s*registration/,
    /successfully\s*signed\s*in/,
    /welcome\s*to\s*student\s*loan/,
    /dashboard/,
    /application\s*id/,
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

/** Last-pass router for questions that missed the hard intent rules. */
export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)
  }
  const compact = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  if (/^(ok|okay|thanks|thank\s*you|alright|seen|noted|yes|no|pls|abeg)[.!? ]*$/i.test(q)) {
    return hit('official-sources', 0.5, ['ack'], 'Short acknowledgement', 'unknown', entities)
  }

  if (
    /scholarship|is\s*(it|nelfund|this)\s*(a\s*)?(grant|gift|free\s*money)|not\s*(a\s*)?loan|loan\s*or\s*scholarship|na\s*scholarship|dem\s*go\s*collect\s*am\s*back/i.test(
      q,
    )
  ) {
    return hit('loan-or-scholarship', 0.82, ['scholarship', 'loan'], 'Loan vs scholarship', 'exploring', entities)
  }

  if (/guarantor|surety|who\s*(go|will)\s*stand|need\s*(a\s*)?guarantor/i.test(q)) {
    return hit('guarantor', 0.8, ['guarantor'], 'Guarantor requirement', 'preparing', entities)
  }

  if (
    /private\s*(uni|university|poly|school)|covenant|babcock|bowen|landmark|aju|nile\s*university/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'private'], 'Private institution eligibility', 'exploring', entities)
  }

  if (
    /\b(fresher|100\s*l|100l|just\s*admitted|newly\s*admitted|year\s*one|100\s*level)\b/i.test(q) &&
    !/\bpending\b|how\s*far|money\s*never/i.test(q)
  ) {
    return hit('how-to-apply', 0.8, ['how-to-apply', 'fresher'], 'New student / fresher apply', 'preparing', entities)
  }

  if (
    /which\s*schools?|school\s*list|list\s*of\s*(schools?|institutions?)|participating\s*(schools?|institutions?)|my\s*school\s*(dey|on)\s*(the\s*)?list/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.78, ['school-list'], 'Which schools are on the list', 'preparing', entities, true)
  }

  if (
    /already\s*pay|i\s*don\s*pay\s*(school|fees)|paid\s*(my\s*)?(school\s*)?fees|refund/i.test(q) &&
    !/how\s*to\s*apply|sign\s*up/i.test(q)
  ) {
    return hit('pending-application', 0.78, ['pending-status', 'already-paid'], 'Already paid fees / waiting', 'waiting', entities, true)
  }

  if (
    /how\s*much|wetin\s*be\s*the\s*amount|amount\s*(for|of)\s*(upkeep|loan|fees)|20\s*k|twenty\s*thousand/i.test(
      q,
    ) &&
    /upkeep|allowance|stipend|20/.test(compact)
  ) {
    return hit('upkeep', 0.8, ['upkeep', 'amount'], 'Upkeep amount question', 'exploring', entities)
  }

  if (/how\s*much|amount|wetin\s*dem\s*go\s*pay|how\s*many\s*naira/i.test(q) && /fee|tuition|school/i.test(q)) {
    return hit('school-fees', 0.78, ['fees', 'amount'], 'School fee amount question', 'exploring', entities)
  }

  if (
    /interest[- ]?free|is\s*(there|e\s*get)\s*interest|interest\s*rate|dem\s*go\s*add\s*interest/i.test(q)
  ) {
    return hit('repayment', 0.8, ['repayment', 'interest'], 'Interest / payback terms', 'repaying', entities)
  }

  if (
    /\bnysc\b|i\s*don\s*graduate|already\s*graduate|i\s*dey\s*camp|after\s*graduation/i.test(q) &&
    !/repay|pay\s*back/i.test(q)
  ) {
    return hit('eligibility', 0.8, ['eligibility', 'graduate'], 'Graduate / NYSC eligibility', 'exploring', entities)
  }

  if (/invalid\s*jamb|jamb\s*(no|not|never)|jamb\s*(number|reg|profile)|utme/i.test(q)) {
    return hit('jamb-verification', 0.82, ['jamb'], 'JAMB leftover phrasing', 'applying', entities, true)
  }

  if (
    /how\s*far|money\s*(never|no)\s*(enter|drop|show)|una\s*never\s*pay|still\s*pending|under\s*review|dem\s*never\s*(pay|approve)|i\s*don\s*apply/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.84, ['pending-status'], 'Residual pending / payout wait', 'waiting', entities, true)
  }

  if (
    /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.84, ['open-status', 'current'], 'Residual open / deadline ask', 'exploring', entities)
  }

  if (
    /screenshot|i\s*send\s*(am|photo|pic)|look\s*this\s*(screen|page)|wetin\s*this\s*screen|explain\s*(this|the)\s*(page|dashboard)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.7, ['screenshot'], 'Screenshot / screen explanation', 'waiting', entities, true)
  }

  if (/ticket|esupport|who\s*(do\s*i|i\s*go)\s*contact|phone\s*number|customer\s*care|helpline/i.test(q)) {
    return hit('contact-support', 0.8, ['contact'], 'Contact / ticket', 'waiting', entities)
  }

  if (/draft\s*(an?\s*)?(email|mail)|write\s*(an?\s*)?(email|complaint)/i.test(q)) {
    return hit('email-draft', 0.8, ['email'], 'Draft support email', 'waiting', entities)
  }

  if (
    /create\s*(account|profile)|sign\s*up|register|how\s*(to|i\s*go)\s*apply|next\s*step|walk\s*me|step\s*by\s*step/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.78, ['how-to-apply'], 'Residual apply / create account', 'preparing', entities)
  }

  if (/login|sign\s*in|password|session\s*expired|forgot/i.test(q)) {
    return hit('portal-login', 0.78, ['login'], 'Residual login', 'applying', entities, true)
  }

  if (/scam|fake\s*agent|pay\s*(me|una)\s*before/i.test(q)) {
    return hit('scam-safety', 0.82, ['scam'], 'Residual scam check', 'exploring', entities, true)
  }

  if (/wetin\s*be|what\s*is\s*nelfund|purpose|why\s*(dem|they|una)\s*(create|form|bring)/i.test(q)) {
    return hit('what-is-nelfund', 0.8, ['what-is'], 'Residual purpose ask', 'exploring', entities)
  }

  if (entities.includes('jamb')) {
    return hit('jamb-verification', 0.62, ['jamb'], 'Entity jamb fallback', 'applying', entities, true)
  }
  if (entities.includes('status') || (entities.includes('upkeep') && /never|pending|wait/.test(compact))) {
    return hit('pending-application', 0.6, ['pending-status'], 'Entity status fallback', 'waiting', entities, true)
  }
  if (entities.includes('missing')) {
    return hit('missing-information', 0.62, ['missing'], 'Entity missing fallback', 'applying', entities, true)
  }

  return null
}
