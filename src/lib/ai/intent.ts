import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

function isLoanCounterNoise(q: string): boolean {
  return (
    /total\s*loans/i.test(q) ||
    /approved\s*loans/i.test(q) ||
    /pending\s*loans/i.test(q) ||
    /declined\s*loans/i.test(q) ||
    /welcome\s+to\s+student\s+loan\s+portal/i.test(q)
  )
}

function detectEntities(q: string): string[] {
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
    [/repay|gsi|pay\s*back/i, 'repayment'],
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

function expandWithContext(question: string, history?: ConversationTurn[]): string {
  if (!history || history.length === 0) return question
  const recentUser = history
    .filter((t) => t.role === 'user')
    .slice(-2)
    .map((t) => t.text)
    .join(' ')
  const q = question.trim()
  if (q.length < 48 && recentUser) return `${recentUser} ${question}`
  if (q.length < 160 && recentUser && recentUser.length < 400) {
    return `${recentUser.slice(-200)} ${question}`
  }
  return question
}

/** Long portal screenshot/OCR dumps often contain status counters + school names */
function isPortalDump(q: string): boolean {
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
  ].filter((re) => re.test(q)).length
  return q.length > 180 && hits >= 2
}

function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history) return null
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].intent) return history[i].intent as IntentId
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].intent) return history[i].intent as IntentId
  }
  return null
}

type Rule = {
  intent: IntentId
  re: RegExp
  problem: string
  stage: StudentStage
  troubleshooting: boolean
  topics: string[]
  weight: number
}

const RULES: Rule[] = [
  { intent: 'email-draft', re: /draft|write\s*(me\s*)?(an?\s*)?(email|mail|message|letter)|compose\s*(an?\s*)?(email|mail)|abeg\s*draft/i, problem: 'Draft a support email', stage: 'applying', troubleshooting: false, topics: ['email'], weight: 20 },
  { intent: 'what-is-nelfund', re: /what\s*is\s*(this\s+)?nelfund|what'?s\s*(this\s+)?nelfund|about\s+(this\s+)?nelfund|explain.{0,40}nelfund|wetin\s*(be\s*)?(this\s+)?nelfund|tell\s*me\s*(about|everything).{0,40}nelfund|understand\s*nelfund|^nelfund\??$/i, problem: 'What NELFUND is', stage: 'exploring', troubleshooting: false, topics: ['what is'], weight: 22 },
  { intent: 'school-fees', re: /school\s*fees|institutional\s*charges?|will\s*nelfund\s*pay|pay\s*(my\s*)?fees|\bfees\b|tuition/i, problem: 'School fees payment', stage: 'exploring', troubleshooting: false, topics: ['fees'], weight: 19 },
  { intent: 'eligibility', re: /eligib|can\s*i\s*apply|am\s*i\s*(eligible|qualified)|who\s*can\s*apply|qualify|cgpa|100\s*-?\s*level|\d{2,3}\s*-?\s*level|fresher|freshman|polytechnic\s*students?|part\s*-?\s*time|full\s*-?\s*time|postgraduate|\bMSc\b|\bPhD\b/i, problem: 'Eligibility', stage: 'exploring', troubleshooting: false, topics: ['eligibility'], weight: 19 },
  { intent: 'current-information', re: /as\s*of\s*today|current\s*(info|information|status|update)|latest\s*(update|news|info)|still\s*accepting|is\s*nelfund\s*still|is\s*nelfund\s*(currently\s*)?open|accepting\s*applications|can\s*i\s*still\s*apply|window\s*(still\s*)?(open|close)|when\s*(will|is|does).{0,40}(expire|close|end|open)|application\s*still\s*open|showing\s*0\s*loans|has\s*(the\s*)?portal\s*opened|still\s*dey\s*open|portal\s*(still\s*)?open|window\s*open|is\s*it\s*open|dem\s*still\s*dey\s*collect/i, problem: 'Current or time-sensitive information', stage: 'exploring', troubleshooting: false, topics: ['current'], weight: 18 },
  { intent: 'portal-login', re: /\blogin\b|log\s*in|sign\s*in|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|can.?t\s*(login|log\s*in)|portal\s*(link|stuck|problem)|official\s*(website|site|portal|link)|session\s*expired|blank\s*(white\s*)?screen|cannot\s*create\s*account|can.?t\s*create\s*(an?\s*)?account/i, problem: 'Official link to login', stage: 'applying', troubleshooting: false, topics: ['login'], weight: 17 },
  { intent: 'institution-verification', re: /institutional\s*verif|school\s*verif|data\s*(been\s*)?uploaded|school\s*(has\s*)?uploaded|my\s*school\s*(never|no)\s*upload|school\s*(has\s*)?not\s*confirm/i, problem: 'Institution upload status', stage: 'waiting', troubleshooting: true, topics: ['upload'], weight: 16 },
  { intent: 'bank-information', re: /bank.*(detail|account|info|fail|reject)|bvn.*(fail|reject|not|verif)|\bbvn\b|changed?\s*(my\s*)?bank|don'?t\s*have\s*(a\s*)?bvn/i, problem: 'Bank details or BVN', stage: 'applying', troubleshooting: true, topics: ['bank'], weight: 14 },
  { intent: 'jamb-verification', re: /jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|verif|profile|format)|(not|isn'?t|no|keep|reject|invalid|fail).*jamb|invalid\s*jamb|verify\s*(my\s*)?jamb|jamb\s*profile|profile\s*verif|jamb\s*(number|reg|registration)|my\s*jamb/i, problem: 'JAMB verification', stage: 'applying', troubleshooting: true, topics: ['jamb'], weight: 13 },
  { intent: 'nin-verification', re: /\bnin\b.*(not|isn'?t|no|keep|reject|invalid|fail|verify|work)|(not|isn'?t|no|keep|reject|invalid|fail).*?\bnin\b|verify\s*(my\s*)?\bnin\b/i, problem: 'NIN verification', stage: 'applying', troubleshooting: true, topics: ['nin'], weight: 12 },
  { intent: 'missing-information', re: /missing\s*(info|information|data|school)|no\s*school\s*(info|information)|showing\s*missing|information\s*not\s*found|record\s*not\s*found|e\s*dey\s*show\s*missing/i, problem: 'Missing information on portal', stage: 'applying', troubleshooting: true, topics: ['missing'], weight: 12 },
  { intent: 'school-not-found', re: /school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)|my\s*school\s*(no\s*dey|not\s*showing)|can'?t\s*find\s*(my\s*)?school|institution\s*not\s*found|not\s*on\s*(the\s*)?list/i, problem: 'School not showing', stage: 'applying', troubleshooting: true, topics: ['school'], weight: 12 },
  { intent: 'scam-safety', re: /scam|fraud|\botp\b|(pay|send(\s*money)?|transfer).{0,40}(agent|them|whatsapp|approval)|(agent|whatsapp).{0,40}(pay|money|otp|password)|make\s*i\s*pay|whatsapp\s*man/i, problem: 'Scam or safety concern', stage: 'unknown', troubleshooting: true, topics: ['scam'], weight: 11 },
  { intent: 'pending-application', re: /(?<!pending\s)(?<!total\s)(?<!approved\s)\bpending\b(?!\s*loans)|application\s*(is\s*)?pending|status\s*(is\s*)?pending|under\s*review|still\s*(waiting|processing)|nothing\s*(is\s*)?happening|check\s*(my\s*)?(application\s*)?status|my\s*application\s*status|how\s*far\s*(with\s*)?(my\s*)?(application|loan|nelfund)?|submitted\s*but|on\s*hold|loan\s*status|e\s*no\s*dey\s*move|e\s*no\s*dey|no\s*gree|still\s*dey\s*(pending|process)|nothing\s*dey\s*happen/i, problem: 'Application still pending', stage: 'waiting', troubleshooting: true, topics: ['pending'], weight: 11 },
  { intent: 'upkeep', re: /\bupkeep\b|how\s*much.*(allowance|monthly|upkeep|20k)|20,?000|monthly\s*allowance|when\s*will\s*(i\s*)?(get|receive).*(money|upkeep|allowance)|disburse|money\s*(never|no)\s*(enter|come)|hostel|accommodation/i, problem: 'Upkeep allowance', stage: 'exploring', troubleshooting: false, topics: ['upkeep'], weight: 10 },
  { intent: 'repayment', re: /repay|pay\s*(this\s*)?(money\s*)?back|do\s*i\s*(have\s*to|must)\s*pay|when\s*do\s*i\s*(start\s*)?pay|loan\s*repayment|how\s*(do\s*i|to)\s*repay|repayment\s*(plan|schedule|start)/i, problem: 'Repayment', stage: 'repaying', troubleshooting: false, topics: ['repayment'], weight: 10 },
  { intent: 'gsi', re: /\bgsi\b|global\s*standing\s*instruction/i, problem: 'What GSI means', stage: 'repaying', troubleshooting: false, topics: ['gsi'], weight: 10 },
  { intent: 'loan-or-scholarship', re: /scholarship|free\s*money|is\s*(it|nelfund|this)\s*(a\s*)?loan|loan\s*or\s*scholarship|is\s*(it|this)\s*free/i, problem: 'Loan or scholarship', stage: 'exploring', troubleshooting: false, topics: ['loan'], weight: 10 },
  { intent: 'profile-update', re: /edit\s*(my\s*)?(profile|account|information)|update\s*(my\s*)?(profile|account|details)|change\s*(my\s*)?(name|details|information|bank|course)|profile\s*verif/i, problem: 'Update profile', stage: 'applying', troubleshooting: true, topics: ['profile'], weight: 12 },
  { intent: 'documents-needed', re: /what\s*(documents?|do\s*i\s*need)|documents?\s*need|requirements?|checklist|admission\s*letter|birth\s*certificate|waec|neco/i, problem: 'Documents required', stage: 'preparing', troubleshooting: false, topics: ['documents'], weight: 9 },
  { intent: 'how-to-apply', re: /how\s*(do\s*i|to)\s*apply|application\s*steps?|start\s*(my\s*)?application|register\s*(for|on)\s*nelfund|how\s*to\s*register|steps?\s*to\s*apply|create\s*(an?\s*)?account|sign\s*up|i\s*want\s*to\s*apply|help\s*me\s*apply|i\s*wan\s*apply|wan\s*apply/i, problem: 'How to apply', stage: 'preparing', troubleshooting: false, topics: ['apply'], weight: 9 },
  { intent: 'guarantor', re: /guarantor|surety/i, problem: 'Guarantor requirement', stage: 'preparing', troubleshooting: false, topics: ['guarantor'], weight: 9 },
  { intent: 'contact-support', re: /official\s*email|nelfund\s*(support\s*)?email|support\s*email|nelfund\s*support|contact\s*(nelfund|support)|customer\s*(care|service)|helpline|esupport|open\s*(a\s*)?ticket/i, problem: 'Contact NELFUND support', stage: 'unknown', troubleshooting: false, topics: ['contact'], weight: 14 },
  { intent: 'contact-lookup', re: /(school|institution|lasu|unilag|oou|futa).{0,50}(email|contact|phone)|(email|contact|phone).{0,50}(school|institution)|who\s*(do\s*i|should\s*i)\s*contact|how\s*(do\s*i|to)\s*contact\s*(my\s*)?(school|institution)/i, problem: 'Find official contact', stage: 'applying', troubleshooting: false, topics: ['contact'], weight: 19 },
  { intent: 'deadline', re: /deadline|closing\s*date|expire|when\s*will.{0,20}close/i, problem: 'Application deadline', stage: 'exploring', troubleshooting: false, topics: ['deadline'], weight: 12 },
  { intent: 'official-sources', re: /official\s*(link|site|portal|website)|nelf\.gov|where\s*(do\s*i|to)\s*(apply|go)|which\s*(link|url|website)/i, problem: 'Official links', stage: 'exploring', troubleshooting: false, topics: ['official'], weight: 8 },
  { intent: 'rejected-application', re: /\bapplication\s*(was\s*)?reject(?:ed|ion)?\b|\breject(?:ed|ion)?\s*(my\s*)?application\b|(?<!declined\s)\bdeclined\b(?!\s*loans)|nelfund\s*rejected|i\s*got\s*rejected\b/i, problem: 'Application rejected', stage: 'rejected', troubleshooting: true, topics: ['rejected'], weight: 11 },
  { intent: 'reapplication', re: /re-?apply|apply\s*again/i, problem: 'Reapplying', stage: 'applying', troubleshooting: true, topics: ['reapplication'], weight: 9 },
]

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const expanded = expandWithContext(question, history)
  const q = expanded.trim()
  if (!q) {
    return { intent: 'unknown', confidence: 0.2, topics: [], problem: null, stage: 'unknown', entities: [], isTroubleshooting: false }
  }

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|how\s*far|wetin\s*dey|sup|ok|okay|thanks|thank\s*you|abeg)\b[.!?\s]*$/i.test(q)) {
    const prior = lastUserIntent(history)
    if (prior && prior !== 'unknown') {
      return { intent: prior, confidence: 0.5, topics: ['greeting'], problem: null, stage: 'exploring', entities: [], isTroubleshooting: false }
    }
    return { intent: 'what-is-nelfund', confidence: 0.45, topics: ['greeting'], problem: 'Greeting — offer NELFUND help', stage: 'exploring', entities: [], isTroubleshooting: false }
  }

  if (isLoanCounterNoise(q) && q.length < 220) {
    return { intent: 'current-information', confidence: 0.75, topics: ['current'], problem: 'Portal dashboard counters', stage: 'waiting', entities: detectEntities(q), isTroubleshooting: false }
  }

  if (isPortalDump(q)) {
    const entities = detectEntities(q)
    if (/\bpending\b|under\s*review|how\s*far/i.test(q) || entities.includes('status')) {
      return { intent: 'pending-application', confidence: 0.72, topics: ['pending', 'portal-dump'], problem: 'Portal dump — pending status', stage: 'waiting', entities, isTroubleshooting: true }
    }
    if (entities.includes('jamb') || /\bjamb\b/i.test(q)) {
      return { intent: 'jamb-verification', confidence: 0.7, topics: ['jamb', 'portal-dump'], problem: 'Portal dump — JAMB', stage: 'applying', entities, isTroubleshooting: true }
    }
    if (/missing|not\s*found|no\s*school/i.test(q)) {
      return { intent: 'missing-information', confidence: 0.7, topics: ['missing', 'portal-dump'], problem: 'Portal dump — missing info', stage: 'applying', entities, isTroubleshooting: true }
    }
    return { intent: 'current-information', confidence: 0.68, topics: ['current', 'portal-dump'], problem: 'Portal dashboard dump', stage: 'waiting', entities, isTroubleshooting: false }
  }

  let best: Rule | null = null
  let bestScore = 0
  for (const rule of RULES) {
    if (!rule.re.test(q)) continue
    const score = rule.weight + (rule.troubleshooting ? 0.5 : 0)
    if (score > bestScore) {
      bestScore = score
      best = rule
    }
  }

  if (best) {
    return {
      intent: best.intent,
      confidence: Math.min(0.95, 0.55 + best.weight / 40),
      topics: best.topics,
      problem: best.problem,
      stage: best.stage,
      entities: detectEntities(q),
      isTroubleshooting: best.troubleshooting,
    }
  }

  const keywordBuckets: Array<{ intent: IntentId; re: RegExp; weight: number; problem: string; stage: StudentStage; troubleshooting: boolean; topics: string[] }> = [
    { intent: 'pending-application', re: /\bpending\b|under\s*review|application\s*status|still\s*(waiting|processing)|how\s*far|e\s*no\s*dey|no\s*gree|still\s*dey\s*(pending|process)/i, weight: 14, problem: 'Application still pending', stage: 'waiting', troubleshooting: true, topics: ['pending'] },
    { intent: 'jamb-verification', re: /\bjamb\b|invalid\s*jamb/i, weight: 13, problem: 'JAMB verification', stage: 'applying', troubleshooting: true, topics: ['jamb'] },
    { intent: 'current-information', re: /still\s*open|still\s*accepting|latest\s*(update|news)|as\s*of\s*today|deadline|closing\s*date|total\s*loans|still\s*dey\s*open/i, weight: 13, problem: 'Current or time-sensitive information', stage: 'exploring', troubleshooting: false, topics: ['current'] },
    { intent: 'how-to-apply', re: /how\s*(do\s*i|to)\s*apply|i\s*want\s*to\s*apply|sign\s*up|create\s*(an?\s*)?account|register/i, weight: 12, problem: 'How to apply', stage: 'preparing', troubleshooting: false, topics: ['apply'] },
    { intent: 'eligibility', re: /eligib|can\s*i\s*apply|qualify|\bcgpa\b|100\s*-?\s*level|fresher/i, weight: 12, problem: 'Eligibility', stage: 'exploring', troubleshooting: false, topics: ['eligibility'] },
    { intent: 'missing-information', re: /missing\s*(info|information)|record\s*not\s*found|no\s*school\s*info/i, weight: 13, problem: 'Missing information on portal', stage: 'applying', troubleshooting: true, topics: ['missing'] },
    { intent: 'school-not-found', re: /school.*(not|no\s*dey).*(show|appear|list)|institution\s*not\s*found|not\s*on\s*(the\s*)?list/i, weight: 12, problem: 'School not showing', stage: 'applying', troubleshooting: true, topics: ['school'] },
    { intent: 'portal-login', re: /\blogin\b|log\s*in|sign\s*in|password|portal\s*(link|stuck)/i, weight: 12, problem: 'Official link to login', stage: 'applying', troubleshooting: false, topics: ['login'] },
    { intent: 'upkeep', re: /\bupkeep\b|monthly\s*allowance|20,?000|disburse/i, weight: 11, problem: 'Upkeep allowance', stage: 'exploring', troubleshooting: false, topics: ['upkeep'] },
    { intent: 'repayment', re: /repay|pay\s*(this\s*)?(money\s*)?back|\bgsi\b/i, weight: 11, problem: 'Repayment', stage: 'repaying', troubleshooting: false, topics: ['repayment'] },
    { intent: 'scam-safety', re: /\bscam\b|\bfraud\b|\botp\b|(pay|send|transfer).{0,40}(agent|whatsapp)/i, weight: 15, problem: 'Scam or safety concern', stage: 'unknown', troubleshooting: true, topics: ['scam'] },
    { intent: 'what-is-nelfund', re: /what\s*is\s*(this\s+)?nelfund|about\s+(this\s+)?nelfund|wetin\s*(be\s*)?(this\s+)?nelfund/i, weight: 14, problem: 'What NELFUND is', stage: 'exploring', troubleshooting: false, topics: ['what is'] },
    { intent: 'contact-support', re: /contact\s*(nelfund|support)|support\s*email|esupport|customer\s*(care|service)/i, weight: 12, problem: 'Contact NELFUND support', stage: 'unknown', troubleshooting: false, topics: ['contact'] },
    { intent: 'school-fees', re: /school\s*fees|institutional\s*charges?|tuition|\bfees\b/i, weight: 11, problem: 'School fees payment', stage: 'exploring', troubleshooting: false, topics: ['fees'] },
    { intent: 'email-draft', re: /draft|write\s*(me\s*)?(an?\s*)?(email|mail|message)/i, weight: 16, problem: 'Draft a support email', stage: 'applying', troubleshooting: false, topics: ['email'] },
  ]

  let kwBest: (typeof keywordBuckets)[0] | null = null
  let kwScore = 0
  for (const b of keywordBuckets) {
    if (!b.re.test(q)) continue
    if (b.weight > kwScore) {
      kwScore = b.weight
      kwBest = b
    }
  }
  if (kwBest && kwScore >= 10) {
    return {
      intent: kwBest.intent,
      confidence: Math.min(0.88, 0.5 + kwScore / 40),
      topics: kwBest.topics,
      problem: kwBest.problem,
      stage: kwBest.stage,
      entities: detectEntities(q),
      isTroubleshooting: kwBest.troubleshooting,
    }
  }

  const prior = lastUserIntent(history)
  if (prior && prior !== 'unknown' && q.length < 60) {
    return { intent: prior, confidence: 0.55, topics: [], problem: null, stage: 'unknown', entities: detectEntities(q), isTroubleshooting: false }
  }

  const entities = detectEntities(q)
  const hasSignal =
    /nelfund|nelf\.gov|student\s*loan|portal\.nelf|upkeep|jamb|nin|bvn|matric|gsi|esupport|school\s*fees?|guarantor|missing\s*info|loan|apply|eligibility|disburse|repay|school|institution|university|poly|portal|pending|status/i.test(
      q,
    ) || entities.length > 0

  if (hasSignal) {
    if (entities.includes('status') || entities.includes('disbursement') || /\bpending\b/i.test(q)) {
      return { intent: 'pending-application', confidence: 0.5, topics: ['pending'], problem: 'Application or payment status', stage: 'waiting', entities, isTroubleshooting: true }
    }
    if (entities.includes('jamb')) {
      return { intent: 'jamb-verification', confidence: 0.5, topics: ['jamb'], problem: 'JAMB verification', stage: 'applying', entities, isTroubleshooting: true }
    }
    if (entities.includes('login') || entities.includes('portal')) {
      return { intent: 'portal-login', confidence: 0.48, topics: ['login'], problem: 'Portal access', stage: 'applying', entities, isTroubleshooting: false }
    }
    if (entities.includes('apply')) {
      return { intent: 'how-to-apply', confidence: 0.48, topics: ['apply'], problem: 'How to apply', stage: 'preparing', entities, isTroubleshooting: false }
    }
    if (entities.includes('eligibility')) {
      return { intent: 'eligibility', confidence: 0.48, topics: ['eligibility'], problem: 'Eligibility', stage: 'exploring', entities, isTroubleshooting: false }
    }
    if (entities.includes('upkeep')) {
      return { intent: 'upkeep', confidence: 0.48, topics: ['upkeep'], problem: 'Upkeep allowance', stage: 'exploring', entities, isTroubleshooting: false }
    }
    if (entities.includes('repayment')) {
      return { intent: 'repayment', confidence: 0.48, topics: ['repayment'], problem: 'Repayment', stage: 'repaying', entities, isTroubleshooting: false }
    }
    if (entities.includes('fees')) {
      return { intent: 'school-fees', confidence: 0.48, topics: ['fees'], problem: 'School fees payment', stage: 'exploring', entities, isTroubleshooting: false }
    }
    if (entities.includes('school')) {
      return { intent: 'school-not-found', confidence: 0.45, topics: ['school'], problem: 'School or institution issue', stage: 'applying', entities, isTroubleshooting: true }
    }
    return { intent: 'current-information', confidence: 0.42, topics: ['current'], problem: 'NELFUND guidance', stage: 'exploring', entities, isTroubleshooting: false }
  }

  const lower = q.toLowerCase()
  if (/help|stuck|wahala|abeg|please|what|how|when|why|where|tell|explain|wetin|status|loan|school|student|portal|apply|money|pay/i.test(lower)) {
    return {
      intent: 'current-information',
      confidence: 0.4,
      topics: ['guidance'],
      problem: 'General NELFUND guidance',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  return {
    intent: 'official-sources',
    confidence: 0.38,
    topics: ['official'],
    problem: 'Official NELFUND links',
    stage: 'exploring',
    entities,
    isTroubleshooting: false,
  }
}
