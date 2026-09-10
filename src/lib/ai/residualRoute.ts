import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|jamb\s*(reg|no|number|id)|direct\s*entry/i, 'jamb'],
    [/\bnin\b/i, 'nin'],
    [/\bbvn\b/i, 'bvn'],
    [/school|institution|university|poly|college|unilag|lasu|oou|yabatech|unilorin|uniben|unizik|unn|unical|uniport|futa|fuoye|tasued|lautech|noun?|futo|abu|oau|unijos|unimaid|delsu|eksu|ui\b|uniosun|mouau|funaab|aaua|\baau\b|ksu|buk|udus|rivers\s*state|lagos\s*state|university\s*of\s*lagos|obafemi\s*awolowo|campus|faculty|matric/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|20,?000|allowance|stipend|hostel\s*money/i, 'upkeep'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter)|nothing\s*dey\s*happen|wetin\s*dey\s*happen|application\s*(id|number)/i, 'status'],
    [/bank|account/i, 'bank'],
    [/portal|nelfund|nelfun[dt]?|nel\s*fund|nelf\.gov|dashboard|total\s*loans/i, 'portal'],
    [/login|sign\s*in|password|otp|session\s*expir/i, 'login'],
    [/repay|gsi|pay\s*back|imprison|jail|prison|scholarship/i, 'repayment'],
    [/eligib|qualify|cgpa|level|fresher|part.?time|\bnd\b|\bhnd\b|100l|200l|300l|400l|undergraduate|postgraduate/i, 'eligibility'],
    [/apply|register|sign\s*up|i\s*wan\s*apply|start\s*(the\s*)?(loan|application)/i, 'apply'],
    [/reject|declined|not\s*approv/i, 'rejected'],
    [/disburse|payment|money\s*(enter|come)|dem\s*never\s*pay|when\s*will\s*(they|i)\s*(pay|get)/i, 'disbursement'],
    [/help|abeg|assist|stuck|confused|wahala|please|pls+|guide\s*me|wetin|una\s*fit|i\s*need|problem|issue/i, 'help'],
    [/ticket|esupport|customer\s*care|helpline|contact|complain|hotline|phone\s*number/i, 'contact'],
    [/error|try\s*again|something\s*went\s*wrong|unable\s*to|timed?\s*out|blank\s*page|keep\s*loading|err_/i, 'error'],
    [/money|disburse|paid|payment|enter\s*account|how\s*much/i, 'money'],
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
  if (!recentUser) return question
  if (q.length < 80) return `${recentUser} ${question}`
  if (q.length < 400 && recentUser.length < 1200) return `${recentUser.slice(-400)} ${question}`
  const last = history.filter((t) => t.role === 'user').slice(-1)[0]?.text || ''
  if (q.length >= 400 && last && last !== question) {
    return `${last.slice(0, 80)} ${question}`
  }
  return question
}

export function isPortalDump(q: string): boolean {
  const hits = [
    /total\s*loans/i,
    /approved\s*loans/i,
    /pending\s*loans/i,
    /declined\s*loans/i,
    /student\s*loan\s*portal/i,
    /institutional\s*charges/i,
    /application\s*status/i,
    /nelf\.gov/i,
    /portal\.nelf/i,
    /session\s*registration/i,
    /welcome\s+to\s+student\s*loan/i,
    /signed\s*in\s*as/i,
    /loan\s*application\s*(id|number)/i,
    /application\s*id\s*[:#]?\s*\d/i,
  ].filter((re) => re.test(q)).length
  return q.length > 140 && hits >= 2
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

const SCHOOL_ONLY =
  /\b(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|noun?|futo|abu|unizik|unn|unical|uniport|futa|lautech|tasued|ui\b|unimaid|fuoye|ksusta|delsu|aaua|aau|eksu|ksu|nasarawa|buk|udus|uniosun|mouau|funaab|rivers\s*state|yaba\s*tech|lagos\s*state\s*uni|university\s*of\s*lagos|obafemi\s*awolowo|university\s*of\s*ilorin|university\s*of\s*benin|university\s*of\s*nigeria|nnamdi\s*azikiwe|covenant|laspotech|mapoly|federal\s*poly|state\s*poly|college\s*of\s*education)\b/i

function result(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string,
  stage: StudentStage,
  entities: string[],
  troubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting: troubleshooting }
}

export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const compact = q.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return result('current-information', 0.35, ['empty'], 'Empty message', 'exploring', entities)
  }
  const lower = compact.toLowerCase()

  const pidginHelp =
    /abeg|wetin|wahala|e\s*no\s*(dey|gree|work|show|load)|i\s*wan|how\s*i\s*go|no\s*gree|don\s*apply|check\s*am|help\s*me|i\s*need\s*help|assist\s*me|dem\s*never|e\s*never\s*(come|enter|pay)|make\s*una\s*help|una\s*fit\s*help|i\s*dey\s*confused|e\s*no\s*clear|na\s*so|e\s*dey\s*hard|i\s*no\s*sabi|no\s*dey\s*work|portal\s*no\s*dey|e\s*keep\s*hang|una\s*fit\s*check|wetin\s*dey\s*happen|how\s*far\s*now|abeg\s*now|na\s*wahala|e\s*dey\s*slow|make\s*una\s*check/i.test(
      q,
    )
  const vagueHelp =
    /^(help|please\s*help|i\s*need\s*(help|assistance)|assist(\s*me)?|stuck|confused|please|pls+|what\s*next|how\s*far|nelfund(\s*help)?|this\s*nelfund|loan\s*help|guide\s*me|explain|i\s*don.?t\s*understand|can\s*you\s*help|need\s*assistance|i\s*have\s*(a\s*)?problem|issue|problem|hello\s*help|are\s*you\s*there|reply|answer\s*me)[.!?\s]*$/i.test(
      compact,
    ) ||
    (/\b(help|assist|stuck|confused|guide|explain|what\s*next|problem|issue|wahala)\b/i.test(compact) &&
      compact.length < 70 &&
      !/jail|scam|otp/i.test(compact))
  const multiIssue =
    ((compact.match(/\band\b|,|;|also|plus|then|after\s*that/gi) || []).length >= 2 && compact.length > 70) ||
    (entities.length >= 3 && compact.length > 90)
  const errorDump =
    /error\s*(code|500|400|403|404|502|503)?|bad\s*request|unable\s*to|try\s*again|session\s*(timed?\s*out|expired)|something\s*went\s*wrong|kindly\s*provide|invalid\s*(login|credentials|details|jamb|nin|email)|network\s*error|verification\s*fail|request\s*failed|internal\s*server|forbidden|unauthorized|gateway\s*timeout|page\s*isn.?t\s*working|this\s*site\s*can.?t\s*be\s*reached|err_connection|blank\s*page|spinner|keep\s*loading|not\s*secure|certificate|cors|429|too\s*many\s*requests/i.test(
      q,
    )
  const alreadyApplied =
    /i\s*(have\s*)?(already\s*)?(don\s*)?apply|submitted\s*(my\s*)?(application|form)|check\s*(my\s*)?(loan|application)|how\s*far\s*(with\s*)?(my\s*)?(loan|application|nelfund)|i\s*don\s*submit|i\s*applied|application\s*(id|number)/i.test(
      q,
    )
  const wantContact =
    /ticket|complain|esupport|customer\s*care|phone\s*number|hotline|who\s*do\s*i\s*(call|mail|contact)|how\s*(do\s*i|to)\s*reach|official\s*(mail|email)|helpline|complain/i.test(
      q,
    )
  const schoolOnly =
    (SCHOOL_ONLY.test(q) || /\b(my\s*school|our\s*school|polytechnic|university|college\s*of|campus|faculty)\b/i.test(q)) &&
    compact.length < 120 &&
    !/apply|pending|login|jamb|nin|fee|upkeep|repay|open|portal|password/i.test(q)
  const openAsk =
    /still\s*(open|accept|dey)|is\s*(it|nelfund|portal)\s*open|dem\s*still\s*dey\s*collect|closing\s*date|deadline|latest\s*(news|update|info)|as\s*of\s*today|have\s*they\s*start|has\s*(it|nelfund)\s*start|when\s*(is|will).{0,20}(open|start|close)/i.test(
      q,
    )
  const jambFail = /jamb|utme|direct\s*entry/.test(lower) && /invalid|fail|verif|no\s*gree|reject|not\s*work|can.?t/i.test(q)
  const repayAsk = /repay|pay\s*back|gsi|scholarship|imprison|jail|when\s*(do\s*i|to)\s*pay/i.test(q)
  const wantApply =
    /how\s*(do\s*i|to|i\s*go)\s*(apply|register)|i\s*(wan|want)\s*(to\s*)?apply|start\s*(my\s*)?application|create\s*(an?\s*)?account|sign\s*up|begin\s*(the\s*)?(loan|application)/i.test(
      q,
    )
  const loginAsk = /can.?t\s*(log|sign)\s*in|forgot\s*password|portal\s*(no|not)\s*(open|load|work)|blank\s*page|otp\s*(no|not)|wrong\s*password/i.test(q)
  const missingAsk = /missing|record\s*not|school\s*(no|not)\s*(show|appear|dey)|not\s*on\s*(the\s*)?list/i.test(q)
  const screenshotAsk = /see\s*(the\s*)?(picture|photo|screenshot|image)|what\s*does\s*this\s*mean|this\s*error|look\s*at\s*this|check\s*this\s*(pic|photo|screen)/i.test(q)
  const greetingish =
    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|how\s*far|wetin\s*dey|sup|yo|pls|please|kedu|bawo|sannu)[\s,!.]*([a-z].{0,40})?$/i.test(
      compact,
    ) && compact.length < 50
  const amountAsk = /how\s*much|wetin\s*be\s*(the\s*)?(amount|money)|20,?000|twenty\s*thousand|how\s*many\s*naira/i.test(q)
  const rumorAsk = /is\s*it\s*true|i\s*hear\s*say|dem\s*say|viral|life\s*imprison|whatsapp\s*(post|message)|rumour|rumor/i.test(q)
  const eligibilityAsk =
    /\b(100|200|300|400)\s*-?\s*(l|level)\b|\bnd\b|\bhnd\b|fresher|part\s*-?time|postgraduate|masters?|phd|nce|direct\s*entry|qualify|can\s*i\s*get/i.test(q)
  const documentsAsk = /matric|admission\s*letter|what\s*(paper|document)|requirements?/i.test(q)
  const tinyNoise = /^(ok+|okay+|hmm+|hmmm+|yes|no|yeah|yep|\?+|pls+|please|sir|ma|boss|bro|sis|\.+|idk|lol|lmao)$/i.test(compact)
  const nelfundTypo = /nelfun[dt]?|nel\s*fund|nelf\s*und|this\s*loan|student\s*loan/i.test(q) && compact.length < 80
  const idPaste = /application\s*(id|number)|loan\s*id|#\d{4,}|\b\d{8,}\b/i.test(q)

  if (tinyNoise) {
    return result('current-information', 0.42, ['empty', 'guidance'], 'Tiny or acknowledgement message', 'exploring', entities)
  }
  if (jambFail) {
    return result('jamb-verification', 0.64, ['jamb', 'residual'], 'JAMB verification residual', 'applying', entities, true)
  }
  if (openAsk && !alreadyApplied) {
    return result('current-information', 0.62, ['current', 'open-status'], 'Is NELFUND still open', 'exploring', entities)
  }
  if (repayAsk || (rumorAsk && /jail|imprison|scholarship|free/i.test(q))) {
    return result('repayment', 0.6, ['repayment', 'residual'], 'Repayment / loan vs scholarship residual', 'repaying', entities)
  }
  if (rumorAsk) {
    return result('official-sources', 0.55, ['official', 'rumor'], 'Rumor check — official sources only', 'exploring', entities)
  }
  if (loginAsk) {
    return result('portal-login', 0.6, ['login', 'residual'], 'Portal login residual', 'applying', entities, true)
  }
  if (wantApply && !alreadyApplied) {
    return result('how-to-apply', 0.58, ['apply', 'residual'], 'Apply / register residual', 'preparing', entities)
  }
  if (missingAsk) {
    return result('missing-information', 0.58, ['missing', 'residual'], 'Missing record / school list residual', 'applying', entities, true)
  }
  if (eligibilityAsk && !alreadyApplied && compact.length < 160) {
    return result('eligibility', 0.55, ['eligibility', 'residual'], 'Level / programme eligibility residual', 'exploring', entities)
  }
  if (amountAsk && /upkeep|allowance|stipend|20,?000/i.test(q)) {
    return result('upkeep', 0.58, ['upkeep', 'residual'], 'Upkeep amount residual', 'exploring', entities)
  }
  if (amountAsk && /fee|tuition|school/i.test(q)) {
    return result('school-fees', 0.56, ['fees', 'residual'], 'Fees amount residual', 'exploring', entities)
  }
  if (amountAsk) {
    return result('current-information', 0.5, ['guidance', 'amount'], 'How-much residual — do not invent figures', 'exploring', entities)
  }
  if (documentsAsk && compact.length < 140) {
    return result('documents-needed', 0.52, ['documents', 'residual'], 'Documents residual', 'preparing', entities)
  }
  if (errorDump) {
    if (/login|password|otp|sign\s*in/i.test(q))
      return result('portal-login', 0.62, ['login', 'error-dump'], 'Portal login error paste', 'applying', entities, true)
    if (/pending|status|review/i.test(q) || alreadyApplied)
      return result('pending-application', 0.6, ['pending', 'error-dump'], 'Portal status / error paste', 'waiting', entities, true)
    if (/jamb|utme/i.test(q))
      return result('jamb-verification', 0.6, ['jamb', 'error-dump'], 'JAMB error paste', 'applying', entities, true)
    if (/nin/i.test(q))
      return result('nin-verification', 0.58, ['nin', 'error-dump'], 'NIN error paste', 'applying', entities, true)
    return result('contact-support', 0.55, ['error-dump'], 'Portal error paste', 'applying', entities, true)
  }
  if (wantContact) return result('contact-support', 0.62, ['contact'], 'Contact official support', 'unknown', entities)
  if (alreadyApplied || idPaste)
    return result('pending-application', 0.58, ['pending'], 'Already applied — status', 'waiting', entities, true)
  if (schoolOnly)
    return result('missing-information', 0.5, ['institution'], 'School named without extra keywords', 'applying', entities, true)
  if (screenshotAsk)
    return result('current-information', 0.5, ['guidance', 'screenshot'], 'Screenshot / error meaning', 'exploring', entities, true)
  if (greetingish && (vagueHelp || pidginHelp || compact.length < 24)) {
    return result('what-is-nelfund', 0.48, ['greeting', 'vague-help'], 'Greeting / vague opener', 'exploring', entities)
  }
  if (vagueHelp || (pidginHelp && compact.length < 160)) {
    if (/apply|register|sign\s*up/i.test(q))
      return result('how-to-apply', 0.52, ['apply', 'pidgin'], 'Pidgin / vague apply help', 'preparing', entities)
    if (/loan|money|pay|status|pending|how\s*far/i.test(q))
      return result('pending-application', 0.52, ['pending', 'pidgin'], 'Pidgin status / how-far', 'waiting', entities, true)
    if (/school|missing|upload/i.test(q))
      return result('missing-information', 0.52, ['missing', 'pidgin'], 'Pidgin school / missing', 'applying', entities, true)
    if (/login|portal|password/i.test(q))
      return result('portal-login', 0.52, ['login', 'pidgin'], 'Pidgin login help', 'applying', entities)
    return result('current-information', 0.5, ['guidance', 'vague-help'], 'Vague or Pidgin help request', 'exploring', entities)
  }
  if (multiIssue || compact.length > 200) {
    if (entities.includes('status') || /pending|how\s*far|never\s*(come|pay)/i.test(q))
      return result('pending-application', 0.52, ['pending', 'multi'], 'Multi-issue paste — status first', 'waiting', entities, true)
    if (entities.includes('jamb'))
      return result('jamb-verification', 0.52, ['jamb', 'multi'], 'Long paste — JAMB first', 'applying', entities, true)
    if (entities.includes('apply'))
      return result('how-to-apply', 0.5, ['apply', 'multi'], 'Multi-issue paste — apply first', 'preparing', entities)
    if (entities.includes('school') || /missing/i.test(q))
      return result('missing-information', 0.5, ['missing', 'multi'], 'Long paste — school/missing', 'applying', entities, true)
    if (entities.includes('login') || entities.includes('portal'))
      return result('portal-login', 0.48, ['login', 'multi'], 'Long paste — portal/login', 'applying', entities)
    return result('current-information', 0.48, ['guidance', 'multi'], 'Multi-issue or long paste', 'exploring', entities)
  }
  if (entities.includes('help') && compact.length < 80) {
    return result('current-information', 0.46, ['guidance', 'vague-help'], 'Short help residual', 'exploring', entities)
  }
  if (entities.includes('error') || entities.includes('portal')) {
    return result('contact-support', 0.44, ['error-dump', 'residual'], 'Unclassified portal/error residual', 'applying', entities, true)
  }
  if (nelfundTypo) {
    return result('what-is-nelfund', 0.44, ['guidance', 'typo'], 'NELFUND typo / short loan mention', 'exploring', entities)
  }
  if (entities.includes('school') || entities.includes('money')) {
    return result('current-information', 0.44, ['guidance', 'residual'], 'School or money residual', 'exploring', entities)
  }
  if (compact.length <= 2) {
    return result('current-information', 0.35, ['empty'], 'Empty or tiny message', 'exploring', entities)
  }
  return result('official-sources', 0.4, ['official', 'residual'], 'Unmatched text — official links', 'exploring', entities)
}

export type { IntentId, IntentResult, StudentStage }
