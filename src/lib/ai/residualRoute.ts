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
  if (/\botp\b|one[\s-]*time/.test(q)) out.push('otp')
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

function liveish(q: string): boolean {
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
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

  if (/^(help(\s*me)?|abeg(\s*help)?|una\s*dey(\s*there)?|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['guidance', 'how-to-apply'], 'Vague help / start ask', 'preparing', entities)
  }

  if (
    /^(i\s*)?(need|wan(t)?|wan\s*collect|dey\s*need)\s*(the\s*)?(nelfund\s*)?(loan|upkeep)?[.!? ]*$/i.test(q) ||
    /i\s*(need|wan(t)?)\s*(the\s*)?(student\s*)?loan|i\s*wan\s*collect(\s*(nelfund|loan|am))?|how\s*i\s*go\s*start|first\s*time\s*(apply|applicant)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.8, ['how-to-apply', 'start'], 'Need loan / how I start', 'preparing', entities)
  }

  if (/^(my\s*money|check|check\s*(am|status|loan)|wetin\s*dey\s*happen)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.72, ['pending-status'], 'Short money / check status', 'waiting', entities, true)
  }

  if (/^(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|noun|nou|futo|futa|abu|ui)[.!? ]*$/i.test(q)) {
    return hit('missing-information', 0.7, ['school-list', 'institution'], 'School name only', 'preparing', entities, true)
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
    /part[\s-]*time|sandwich|evening\s*(programme|program|student)|distance\s*learn|open\s*and\s*distance|\bodl\b|weekend\s*(programme|program|student)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'study-mode'], 'Part-time / sandwich / distance mode', 'exploring', entities)
  }

  if (
    /post\s*grad|postgraduate|\bmasters?\b|\bmsc\b|\bm\.a\b|\bphd\b|doctorate|pgd/i.test(q) &&
    !/\bpending\b|how\s*far|money\s*never/i.test(q)
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'postgrad'], 'Postgraduate eligibility', 'exploring', entities)
  }

  if (
    /direct\s*entry|\bde\s*student\b|\bde\s*applicant\b|transfer\s*student|inter[\s-]*university\s*transfer/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.82, ['eligibility', 'entry-path'], 'Direct entry / transfer eligibility', 'exploring', entities)
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

  if (/hostel|accommodation|accomodation|house\s*rent|off[\s-]*campus\s*rent/i.test(q)) {
    return hit('upkeep', 0.76, ['upkeep', 'hostel'], 'Hostel / living cost vs upkeep', 'exploring', entities)
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
    /\b(bvn|nin)\b.{0,40}(invalid|mismatch|not\s*match|no\s*(gree|work|dey)|fail|verif|reject)|invalid\s*(bvn|nin)|(bvn|nin)\s*(no|not|never)\s*(gree|work|match)|verify\s*(my\s*)?(bvn|nin)/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.84, ['documents', 'bvn-nin'], 'BVN / NIN mismatch leftover', 'preparing', entities, true)
  }

  if (
    /\botp\b.{0,30}(no|not|never|no\s*dey)|otp\s*(no|not|never)\s*(enter|come|drop|gree)|no\s*otp|didn'?t\s*get\s*(the\s*)?otp|one[\s-]*time\s*(password|code)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.84, ['login', 'otp'], 'OTP not arriving leftover', 'applying', entities, true)
  }

  if (
    /already\s*used\s*by\s*another|used\s*by\s*another\s*student|email\s*(already|don)\s*(exist|dey|register)|two\s*accounts?|second\s*account|duplicate\s*account|account\s*already\s*(exist|dey)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.84, ['login', 'duplicate'], 'Account already exists / dual account', 'applying', entities, true)
  }

  if (
    /change\s*(my\s*)?(phone|email|number|profile)|edit\s*(my\s*)?(profile|phone|email)|update\s*(my\s*)?(phone|email|profile)|wrong\s*(phone|email|number)/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.82, ['documents', 'profile'], 'Change phone / email / profile', 'preparing', entities, true)
  }

  if (/session\s*registration|register\s*(this|the)\s*session|new\s*session\s*(loan|apply|application)/i.test(q) && !liveish(q)) {
    return hit('how-to-apply', 0.78, ['how-to-apply', 'session'], 'Session registration leftover', 'preparing', entities)
  }

  if (
    /how\s*far|money\s*(never|no)\s*(enter|drop|show)|una\s*never\s*pay|still\s*pending|under\s*review|dem\s*never\s*(pay|approve)|i\s*don\s*apply/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.84, ['pending-status'], 'Residual pending / payout wait', 'waiting', entities, true)
  }

  if (
    /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|go\s*open(\s*again)?|open\s*again|next\s*(window|cycle|session)/i.test(
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

  if (
    /\b(declin(ed|e)|reject(ed)?|unsuccessful|not\s*approv(ed)?|disapprov)/i.test(q) &&
    !liveish(q)
  ) {
    return hit('pending-application', 0.8, ['pending-status', 'declined'], 'Declined / unsuccessful file', 'waiting', entities, true)
  }

  if (
    /(no|never|not|no\s*dey|e\s*no)\s*(see|show|find|dey)\s*(my\s*)?(application|loan|file|dashboard)|application\s*(disappear|missing|no\s*dey|no\s*show)|loan\s*(no|never)\s*(show|dey)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.78, ['pending-status', 'missing-file'], 'Application not showing', 'waiting', entities, true)
  }

  if (
    /credit\s*alert|no\s*credit|account\s*(no|never)\s*(credit|alert)|alert\s*(no|never)\s*(enter|drop|come)|bank\s*(no|never)\s*(show|enter)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.82, ['pending-status', 'no-alert'], 'No credit alert yet', 'waiting', entities, true)
  }

  if (/\b(e\s*no\s*dey\s*move|nothing\s*dey\s*happen|status\s*still\s*the\s*same|e\s*never\s*change)\b/i.test(q)) {
    return hit('pending-application', 0.8, ['pending-status'], 'Status stuck / no movement', 'waiting', entities, true)
  }

  if (/\b(check\s*my\s*(loan|application|dashboard)|look\s*my\s*(loan|application)|i\s*check\s*(am|my\s*loan))\b/i.test(q)) {
    return hit('pending-application', 0.74, ['pending-status'], 'Check my loan / dashboard', 'waiting', entities, true)
  }

  if (entities.includes('jamb')) {
    return hit('jamb-verification', 0.62, ['jamb'], 'Entity jamb fallback', 'applying', entities, true)
  }
  if (entities.includes('bvn') || entities.includes('nin')) {
    return hit('documents-needed', 0.64, ['documents', 'bvn-nin'], 'Entity BVN/NIN fallback', 'preparing', entities, true)
  }
  if (entities.includes('otp')) {
    return hit('portal-login', 0.64, ['login', 'otp'], 'Entity OTP fallback', 'applying', entities, true)
  }
  if (entities.includes('status') || (entities.includes('upkeep') && /never|pending|wait/.test(compact))) {
    return hit('pending-application', 0.6, ['pending-status'], 'Entity status fallback', 'waiting', entities, true)
  }
  if (entities.includes('missing')) {
    return hit('missing-information', 0.62, ['missing'], 'Entity missing fallback', 'applying', entities, true)
  }

  return null
}
