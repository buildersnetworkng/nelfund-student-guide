import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'
import {
  detectEntities,
  expandWithContext,
  isPortalDump,
  lastUserIntent,
  residualSoftRoute,
} from './residualRoute'

type Rule = { intent: IntentId; re: RegExp; problem: string; stage: StudentStage; troubleshooting: boolean; topics: string[]; weight: number }

const RULES: Rule[] = [
  { intent: 'email-draft', re: /draft|write\s*(me\s*)?(an?\s*)?(email|mail|message|letter)|abeg\s*draft/i, problem: 'Draft a support email', stage: 'applying', troubleshooting: false, topics: ['email'], weight: 20 },
  { intent: 'what-is-nelfund', re: /what\s*is\s*(this\s+)?nelfund|about\s+(this\s+)?nelfund|wetin\s*(be\s*)?(this\s+)?nelfund|tell\s*me\s*(about|everything).{0,40}nelfund|^nelfund\??$/i, problem: 'What NELFUND is', stage: 'exploring', troubleshooting: false, topics: ['what is'], weight: 22 },
  { intent: 'upkeep', re: /\bupkeep\b|monthly\s*allowance|20,?000|living\s*(allowance|support)|stipend|hostel\s*(money|allowance)|money\s*for\s*(feeding|rent|hostel)/i, problem: 'Upkeep allowance', stage: 'exploring', troubleshooting: false, topics: ['upkeep'], weight: 20 },
  { intent: 'school-fees', re: /school\s*fees|institutional\s*charges?|tuition|pay\s*(my\s*)?(school\s*)?fees|fees\s*(to\s*)?(the\s*)?school|will\s*nelfund\s*pay\s*(my\s*)?fees/i, problem: 'School fees / institutional charges', stage: 'exploring', troubleshooting: false, topics: ['fees'], weight: 19 },
  { intent: 'eligibility', re: /eligib|can\s*i\s*apply|who\s*can\s*apply|qualify|cgpa|100\s*-?\s*level|fresher|part\s*-?\s*time|full\s*-?\s*time|postgraduate/i, problem: 'Eligibility', stage: 'exploring', troubleshooting: false, topics: ['eligibility'], weight: 19 },
  { intent: 'current-information', re: /as\s*of\s*today|current\s*(info|information|status|update)|latest\s*(update|news|info)|still\s*accepting|is\s*nelfund\s*still|is\s*nelfund\s*(currently\s*)?open|can\s*i\s*still\s*apply|still\s*dey\s*open|portal\s*(still\s*)?open|is\s*it\s*open|dem\s*still\s*dey\s*collect|still\s*dey\s*accept/i, problem: 'Current or time-sensitive information', stage: 'exploring', troubleshooting: false, topics: ['current'], weight: 18 },
  { intent: 'portal-login', re: /\blogin\b|log\s*in|sign\s*in|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|session\s*expired|wrong\s*password|can.?t\s*(log\s*in|login|sign\s*in)|unable\s*to\s*(log\s*in|login|sign\s*in)/i, problem: 'Sign in / login to existing account', stage: 'applying', troubleshooting: false, topics: ['login'], weight: 18 },
  { intent: 'how-to-apply', re: /sign\s*up|create\s*(an?\s*)?account|register\s*(for|on)?\s*(nelfund)?|how\s*(do\s*i|to)\s*apply|application\s*steps?|i\s*want\s*to\s*apply|i\s*wan\s*apply|wan\s*apply|help\s*me\s*apply|how\s*i\s*go\s*apply|loan\s*application|submit\s*(my\s*)?application/i, problem: 'Sign up or loan application', stage: 'preparing', troubleshooting: false, topics: ['apply'], weight: 17 },
  { intent: 'institution-verification', re: /institutional\s*verif|school\s*verif|data\s*(been\s*)?uploaded|my\s*school\s*(never|no)\s*upload/i, problem: 'Institution upload status', stage: 'waiting', troubleshooting: true, topics: ['upload'], weight: 16 },
  { intent: 'bank-information', re: /bank.*(detail|account|info|fail|reject)|\bbvn\b|don'?t\s*have\s*(a\s*)?bvn/i, problem: 'Bank details or BVN', stage: 'applying', troubleshooting: true, topics: ['bank'], weight: 14 },
  { intent: 'jamb-verification', re: /jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|verif|profile|gree)|invalid\s*jamb|verify\s*(my\s*)?jamb|my\s*jamb|utme.*(fail|invalid|verif)/i, problem: 'JAMB verification', stage: 'applying', troubleshooting: true, topics: ['jamb'], weight: 13 },
  { intent: 'nin-verification', re: /\bnin\b.*(not|isn'?t|no|keep|reject|invalid|fail|verify)|verify\s*(my\s*)?\bnin\b/i, problem: 'NIN verification', stage: 'applying', troubleshooting: true, topics: ['nin'], weight: 12 },
  { intent: 'missing-information', re: /missing\s*(info|information|data|school)|record\s*not\s*found|e\s*dey\s*show\s*missing/i, problem: 'Missing information on portal', stage: 'applying', troubleshooting: true, topics: ['missing'], weight: 12 },
  { intent: 'school-not-found', re: /school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)|list\s*of\s*schools|which\s*schools|school\s*list|institution\s*not\s*found|not\s*on\s*(the\s*)?list/i, problem: 'School not showing', stage: 'applying', troubleshooting: true, topics: ['school'], weight: 12 },
  { intent: 'scam-safety', re: /scam|fraud|\botp\b|(pay|send(\s*money)?|transfer).{0,40}(agent|whatsapp)|whatsapp\s*man/i, problem: 'Scam or safety concern', stage: 'unknown', troubleshooting: true, topics: ['scam'], weight: 11 },
  { intent: 'pending-application', re: /(?<!pending\s)(?<!total\s)(?<!approved\s)\bpending\b(?!\s*loans)|under\s*review|still\s*(waiting|processing)|check\s*(my\s*)?(application\s*)?status|how\s*far\s*(with\s*)?(my\s*)?(application|loan|nelfund|money)?|e\s*no\s*dey(\s*move)?|no\s*gree|still\s*dey\s*(pending|process)|nothing\s*dey\s*happen|dem\s*never\s*(pay|disburse)|money\s*never\s*(come|enter)|never\s*see\s*(my\s*)?(august|july|june|september)?\s*(upkeep|money)|haven'?t\s*(got|gotten|received)/i, problem: 'Application still pending', stage: 'waiting', troubleshooting: true, topics: ['pending'], weight: 11 },
  { intent: 'repayment', re: /repay|pay\s*(this\s*)?(money\s*)?back|loan\s*repayment|life\s*imprison|go\s*jail|imprisonment|prison\s*for\s*(unpaid|loan)/i, problem: 'Repayment', stage: 'repaying', troubleshooting: false, topics: ['repayment'], weight: 10 },
  { intent: 'gsi', re: /\bgsi\b|global\s*standing\s*instruction/i, problem: 'What GSI means', stage: 'repaying', troubleshooting: false, topics: ['gsi'], weight: 10 },
  { intent: 'loan-or-scholarship', re: /scholarship|free\s*money|loan\s*or\s*scholarship|is\s*(it|this)\s*free/i, problem: 'Loan or scholarship', stage: 'exploring', troubleshooting: false, topics: ['loan'], weight: 10 },
  { intent: 'guarantor', re: /guarantor|surety/i, problem: 'Guarantor requirement', stage: 'preparing', troubleshooting: false, topics: ['guarantor'], weight: 9 },
  { intent: 'contact-support', re: /official\s*email|nelfund\s*support|contact\s*(nelfund|support)|esupport|helpline|customer\s*care|open\s*(a\s*)?ticket/i, problem: 'Contact NELFUND support', stage: 'unknown', troubleshooting: false, topics: ['contact'], weight: 14 },
  { intent: 'deadline', re: /deadline|closing\s*date|expire|when\s*will.{0,20}close/i, problem: 'Application deadline', stage: 'exploring', troubleshooting: false, topics: ['deadline'], weight: 12 },
  { intent: 'official-sources', re: /official\s*(link|site|portal|website)|nelf\.gov|which\s*(link|url|website)|portal\s*link/i, problem: 'Official links', stage: 'exploring', troubleshooting: false, topics: ['official'], weight: 8 },
  { intent: 'rejected-application', re: /reject(?:ed|ion)?\s*(my\s*)?application|nelfund\s*rejected|(?<!declined\s)\bdeclined\b(?!\s*loans)/i, problem: 'Application rejected', stage: 'rejected', troubleshooting: true, topics: ['rejected'], weight: 11 },
  { intent: 'reapplication', re: /re-?apply|apply\s*again/i, problem: 'Reapplying', stage: 'applying', troubleshooting: true, topics: ['reapplication'], weight: 9 },
  { intent: 'documents-needed', re: /what\s*(documents?|do\s*i\s*need)|requirements?|admission\s*letter/i, problem: 'Documents required', stage: 'preparing', troubleshooting: false, topics: ['documents'], weight: 9 },
  { intent: 'how-to-apply', re: /make\s*i\s*apply|how\s*i\s*go\s*take\s*apply|i\s*wan\s*start|begin\s*(loan|application)|account\s*(don|already)\s*(create|open)/i, problem: 'Start or continue application', stage: 'preparing', troubleshooting: false, topics: ['apply'], weight: 16 },
  { intent: 'school-fees', re: /i\s*(don|have|already)\s*pay.{0,30}(fee|tuition|school)|school\s*don\s*collect|already\s*paid\s*(my\s*)?fees/i, problem: 'Already paid school fees', stage: 'exploring', troubleshooting: false, topics: ['fees'], weight: 15 },
  { intent: 'contact-support', re: /who\s*(do\s*i|i\s*go)\s*(call|message|mail)|wetin\s*number|nelfund\s*(phone|mail)|open\s*ticket/i, problem: 'How to reach NELFUND', stage: 'unknown', troubleshooting: false, topics: ['contact'], weight: 13 },
  { intent: 'current-information', re: /help\s*me|i\s*need\s*(help|assistance)|this\s*(nelfund\s*)?thing|what\s*next|i\s*no\s*sabi|make\s*una\s*help|guide\s*me|una\s*fit\s*help|confused|i\s*don\s*know\s*wetin/i, problem: 'Vague help request', stage: 'exploring', troubleshooting: false, topics: ['guidance'], weight: 8 },
  { intent: 'contact-support', re: /something\s*went\s*wrong|try\s*again\s*later|internal\s*server|blank\s*page|keep\s*loading|network\s*error|page\s*not\s*working|failed\s*to\s*(load|fetch)/i, problem: 'Portal error dump', stage: 'unknown', troubleshooting: true, topics: ['error'], weight: 12 },
  { intent: 'how-to-apply', re: /i\s*just\s*wan(t)?(\s*to)?\s*(do|start)|how\s*this\s*thing\s*work|steps?\s*abeg|begin\s*now|i\s*wan\s*start/i, problem: 'Start application (vague)', stage: 'preparing', troubleshooting: false, topics: ['apply'], weight: 8 },
  { intent: 'official-sources', re: /send\s*(the\s*)?(link|url|website)|drop\s*(the\s*)?link|wetin\s*(be\s*)?(the\s*)?link|official\s*page/i, problem: 'Official links', stage: 'exploring', troubleshooting: false, topics: ['official'], weight: 10 },
  { intent: 'pending-application', re: /i\s*don\s*submit|i\s*have\s*submitted|submitted\s*(already|since)|no\s*update|nothing\s*change|still\s*the\s*same/i, problem: 'Submitted — waiting', stage: 'waiting', troubleshooting: true, topics: ['pending'], weight: 10 },
  { intent: 'current-information', re: /^(pls|please|abeg|sir|ma|boss|dear|reply|answer\s*me|are\s*you\s*there|you\s*there|hello\s*bot)[.!? ]*$/i, problem: 'Nudge / short ping', stage: 'exploring', troubleshooting: false, topics: ['guidance'], weight: 7 },
  { intent: 'how-to-apply', re: /first\s*time|i\s*never\s*apply|new\s*student|just\s*got\s*admission|fresh\s*admission|i\s*just\s*gain/i, problem: 'First-time applicant', stage: 'preparing', troubleshooting: false, topics: ['apply'], weight: 12 },
  { intent: 'portal-login', re: /no\s*fit\s*enter|cannot\s*enter\s*(the\s*)?portal|portal\s*no\s*gree|e\s*no\s*gree\s*open|locked\s*out|account\s*lock/i, problem: 'Cannot enter portal', stage: 'applying', troubleshooting: true, topics: ['login'], weight: 15 },
  { intent: 'contact-support', re: /cloudflare|access\s*denied|403|502|503|gateway\s*time|service\s*unavailable|site\s*down|portal\s*down/i, problem: 'Site or gateway error', stage: 'unknown', troubleshooting: true, topics: ['error'], weight: 13 },
  { intent: 'official-sources', re: /where\s*(i\s*)?(go|to)\s*(enter|open)|correct\s*(site|link|website)|genuine\s*(site|link)|real\s*nelfund\s*(site|link)/i, problem: 'Need official URL', stage: 'exploring', troubleshooting: false, topics: ['official'], weight: 12 },
]

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const expanded = expandWithContext(question, history)
  const q = expanded.trim()
  if (!q) {
    return { intent: 'current-information', confidence: 0.32, topics: ['empty'], problem: 'Empty message — offer guidance', stage: 'exploring', entities: [], isTroubleshooting: false }
  }

  if (/^(hi+|hello+|hey+|yo+|pls|please|good\s*(morning|afternoon|evening|day)|how\s*far|wetin\s*dey|how\s*una\s*dey|sup|wassup|ok|okay|thanks|thank\s*you|abeg|morning|afternoon|evening|kedu|bawo|sannu|salam|peace|e\s*kaaro|nno|da\s*zuwa|reply\s*me|are\s*you\s*there)(\s+(there|bro|sis|sir|ma|boss|dear))?\b[.!?\s]*$/i.test(q)) {
    const prior = lastUserIntent(history)
    if (prior && prior !== 'unknown') {
      return { intent: prior, confidence: 0.5, topics: ['greeting'], problem: null, stage: 'exploring', entities: [], isTroubleshooting: false }
    }
    return { intent: 'what-is-nelfund', confidence: 0.45, topics: ['greeting'], problem: 'Greeting — offer NELFUND help', stage: 'exploring', entities: [], isTroubleshooting: false }
  }

  if (/\bupkeep\b|monthly\s*allowance|20,?000/i.test(q) && !/school\s*fees|institutional\s*charges|tuition/i.test(q) && !/never\s*see|haven'?t\s*(got|gotten|received)|pending|how\s*far|dem\s*never/i.test(q)) {
    return { intent: 'upkeep', confidence: 0.9, topics: ['upkeep'], problem: 'Upkeep allowance', stage: 'exploring', entities: detectEntities(q), isTroubleshooting: false }
  }
  if (/school\s*fees|institutional\s*charges|tuition/i.test(q) && !/\bupkeep\b/i.test(q)) {
    return { intent: 'school-fees', confidence: 0.9, topics: ['fees'], problem: 'School fees / institutional charges', stage: 'exploring', entities: detectEntities(q), isTroubleshooting: false }
  }
  if (/sign\s*up|create\s*(an?\s*)?account|register(\s|$)/i.test(q) && !/sign\s*in|\blogin\b|log\s*in|password/i.test(q)) {
    return { intent: 'how-to-apply', confidence: 0.9, topics: ['apply', 'signup'], problem: 'Create account / sign up', stage: 'preparing', entities: detectEntities(q), isTroubleshooting: false }
  }
  if (/(\blogin\b|log\s*in|sign\s*in|password|session\s*expired)/i.test(q) && !/sign\s*up|create\s*(an?\s*)?account|how\s*to\s*apply/i.test(q)) {
    return { intent: 'portal-login', confidence: 0.9, topics: ['login'], problem: 'Sign in / login', stage: 'applying', entities: detectEntities(q), isTroubleshooting: false }
  }

  if ((/total\s*loans|approved\s*loans|pending\s*loans|welcome\s+to\s+student\s+loan\s*portal/i.test(q)) && q.length < 220) {
    return { intent: 'current-information', confidence: 0.75, topics: ['current'], problem: 'Portal dashboard counters', stage: 'waiting', entities: detectEntities(q), isTroubleshooting: false }
  }

  if (isPortalDump(q)) {
    const entities = detectEntities(q)
    if (/\bpending\b|under\s*review|how\s*far/i.test(q) || entities.includes('status')) {
      return { intent: 'pending-application', confidence: 0.72, topics: ['pending', 'portal-dump'], problem: 'Portal dump — pending status', stage: 'waiting', entities, isTroubleshooting: true }
    }
    if (entities.includes('jamb')) {
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
    return { intent: best.intent, confidence: Math.min(0.95, 0.55 + best.weight / 40), topics: best.topics, problem: best.problem, stage: best.stage, entities: detectEntities(q), isTroubleshooting: best.troubleshooting }
  }

  const prior = lastUserIntent(history)
  if (prior && prior !== 'unknown' && q.length < 60) {
    return { intent: prior, confidence: 0.55, topics: [], problem: null, stage: 'unknown', entities: detectEntities(q), isTroubleshooting: false }
  }

  const entities = detectEntities(q)
  const residual = residualSoftRoute(q, entities)
  if (residual) return residual

  if (entities.includes('status') || entities.includes('disbursement') || /\bpending\b|how\s*far|wahala/i.test(q)) {
    return { intent: 'pending-application', confidence: 0.5, topics: ['pending'], problem: 'Application or payment status', stage: 'waiting', entities, isTroubleshooting: true }
  }
  if (entities.includes('jamb')) return { intent: 'jamb-verification', confidence: 0.5, topics: ['jamb'], problem: 'JAMB verification', stage: 'applying', entities, isTroubleshooting: true }
  if (entities.includes('login')) return { intent: 'portal-login', confidence: 0.48, topics: ['login'], problem: 'Sign in / login', stage: 'applying', entities, isTroubleshooting: false }
  if (entities.includes('apply')) return { intent: 'how-to-apply', confidence: 0.48, topics: ['apply'], problem: 'How to apply', stage: 'preparing', entities, isTroubleshooting: false }
  if (entities.includes('eligibility')) return { intent: 'eligibility', confidence: 0.48, topics: ['eligibility'], problem: 'Eligibility', stage: 'exploring', entities, isTroubleshooting: false }
  if (entities.includes('upkeep')) return { intent: 'upkeep', confidence: 0.48, topics: ['upkeep'], problem: 'Upkeep allowance', stage: 'exploring', entities, isTroubleshooting: false }
  if (entities.includes('repayment')) return { intent: 'repayment', confidence: 0.48, topics: ['repayment'], problem: 'Repayment', stage: 'repaying', entities, isTroubleshooting: false }
  if (entities.includes('fees')) return { intent: 'school-fees', confidence: 0.48, topics: ['fees'], problem: 'School fees payment', stage: 'exploring', entities, isTroubleshooting: false }
  if (entities.includes('school')) return { intent: 'school-not-found', confidence: 0.45, topics: ['school'], problem: 'School or institution issue', stage: 'applying', entities, isTroubleshooting: true }
  if (entities.includes('contact')) return { intent: 'contact-support', confidence: 0.45, topics: ['contact'], problem: 'Contact support', stage: 'unknown', entities, isTroubleshooting: false }
  if (entities.includes('help')) return { intent: 'current-information', confidence: 0.42, topics: ['guidance'], problem: 'General help', stage: 'exploring', entities, isTroubleshooting: false }

  if (/nelfund|nelf\.gov|student\s*loan|portal|loan|apply|school|help|stuck|wahala|abeg|wetin|please|what|how|when|why|money|pay|guide|explain|una|dey|error|issue|problem|account|status|open|link|site|need|assist|check|see|show|try|fail|work|load|hang|sir|ma|boss|poly|uni|college|campus|matric|admission|ticket|support|login|password/i.test(q)) {
    return { intent: 'current-information', confidence: 0.4, topics: ['guidance'], problem: 'General NELFUND guidance', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (/[a-zA-Z]{2,}/.test(q)) {
    return { intent: 'current-information', confidence: 0.38, topics: ['guidance'], problem: 'Unclassified text — offer menu', stage: 'exploring', entities, isTroubleshooting: false }
  }
  return { intent: 'official-sources', confidence: 0.4, topics: ['official'], problem: 'Official NELFUND links', stage: 'exploring', entities, isTroubleshooting: false }
}
