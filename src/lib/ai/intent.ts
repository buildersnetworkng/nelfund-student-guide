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
    [/school|institution|university/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|allowance/i, 'upkeep'],
    [/pending|status/i, 'status'],
    [/bank|account/i, 'bank'],
    [/portal|nelfund/i, 'portal'],
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
  if (question.trim().length < 48 && recentUser) return `${recentUser} ${question}`
  return question
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
  {
    intent: 'email-draft',
    re: /draft|write\s*(me\s*)?(an?\s*)?(email|mail|message|letter)|compose\s*(an?\s*)?(email|mail)|abeg\s*draft/i,
    problem: 'Draft a support email',
    stage: 'applying',
    troubleshooting: false,
    topics: ['email'],
    weight: 20,
  },
  {
    intent: 'what-is-nelfund',
    re: /what\s*is\s*(this\s+)?nelfund(?!\s*support)|what'?s\s*(this\s+)?nelfund(\s+\w+){0,4}|what'?s\s*nelfund(\s+all)?\s*about|nelfund\s*(all\s*)?about|all\s*about\s*(this\s+)?nelfund|explain(\s+\w+){0,6}\s+(this\s+)?nelfund|tell\s*me\s*(about|everything).{0,40}nelfund|everything\s+about\s+(this\s+)?nelfund|about\s+(this\s+)?nelfund|help\s*me\s*understand\s*nelfund|understand\s*nelfund|what\s*does\s*nelfund\s*(mean|do|stand)|meaning\s*of\s*nelfund|break\s*down\s*nelfund|overview\s*of\s*nelfund|describe\s+(this\s+)?nelfund|teach\s*me\s*(about\s*)?(this\s+)?nelfund|i\s*want\s*to\s*know\s*(about\s*)?(this\s+)?nelfund|know\s*(more\s*)?about\s*(this\s+)?nelfund|wetin\s*(be\s*)?(this\s+)?nelfund|^nelfund\??$|tell\s*me\s*about\s*nelfund/i,
    problem: 'What NELFUND is',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['what is'],
    weight: 22,
  },
  {
    intent: 'school-fees',
    re: /school\s*fees|institutional\s*charges?|will\s*nelfund\s*pay|pay\s*(my\s*)?fees|does\s*nelfund\s*pay\s*(school|fees)|apply\s*for\s*(school\s*)?fees|about\s*(school\s*)?fees|\bfees\b|how\s*much\s*(is\s*)?(institutional|school)/i,
    problem: 'School fees payment',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['fees'],
    weight: 19,
  },
  {
    intent: 'eligibility',
    re: /eligib|can\s*i\s*apply|am\s*i\s*(eligible|qualified)|who\s*can\s*apply|qualify\s*(for\s*)?(student\s*)?loan|cgpa|disqualif|100\s*-?\s*level|\d{2,3}\s*-?\s*level|year\s*(one|1|two|2)|fresher|freshman|polytechnic\s*students?|part\s*-?\s*time|full\s*-?\s*time|hnd\s*student|direct\s*entry|postgraduate|\bMSc\b|\bPhD\b|distance\s*learning/i,
    problem: 'Eligibility',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['eligibility'],
    weight: 19,
  },
  {
    intent: 'current-information',
    re: /as\s*of\s*today|current\s*(info|information|status|update)|latest\s*(update|news|info|nelfund)|still\s*accepting|is\s*nelfund\s*still|is\s*nelfund\s*(currently\s*)?open|accepting\s*applications|can\s*i\s*still\s*apply|dem\s*never\s*open|window\s*(still\s*)?(open|close)|when\s*(will|is|does).{0,40}(expire|close|end|open)|nelfund\s*still\s*open|application\s*still\s*open|showing\s*0\s*loans|has\s*(the\s*)?portal\s*opened/i,
    problem: 'Current or time-sensitive information',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['current'],
    weight: 18,
  },
  {
    intent: 'portal-login',
    re: /\blogin\b|log\s*in|sign\s*in|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|can.?t\s*(login|log\s*in)|portal\s*link|which\s*(website|site|link|url)|official\s*(website|site|portal|link)|how\s*(to|do\s*i)\s*(enter|access)\s*(the\s*)?portal|portal\s*stuck|stuck\s*on\s*(the\s*)?portal|account\s*suspend|page\s*keeps?\s*loading|blank\s*(white\s*)?screen|captcha|session\s*expired|portal\s*problem|^portal$|cannot\s*create\s*account|can.?t\s*create\s*(an?\s*)?account|sign\s*up\s*(not|no)\s*work/i,
    problem: 'Official link to login',
    stage: 'applying',
    troubleshooting: false,
    topics: ['login'],
    weight: 17,
  },
  {
    intent: 'institution-verification',
    re: /institutional\s*verif|school\s*verif|verif.*(institution|school)|data\s*(been\s*)?uploaded|uploaded\s*(to\s*)?(nelfund|portal)|school\s*(has\s*)?uploaded|my\s*school\s*(never|no)\s*upload|data\s*no\s*upload|school\s*(has\s*)?not\s*confirm/i,
    problem: 'Institution upload status',
    stage: 'waiting',
    troubleshooting: true,
    topics: ['upload'],
    weight: 16,
  },
  {
    intent: 'bank-information',
    re: /bank.*(detail|account|info|fail|reject|not)|my\s*bank\s*details|bvn.*(fail|reject|not|verif)|\bbvn\b.*work|BVN not working|changed?\s*(my\s*)?bank|i\s*no\s*get\s*bvn|don'?t\s*have\s*(a\s*)?bvn/i,
    problem: 'Bank details or BVN',
    stage: 'applying',
    troubleshooting: true,
    topics: ['bank'],
    weight: 14,
  },
  {
    intent: 'jamb-verification',
    re: /jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|verif|profile|format)|(not|isn'?t|no|keep|reject|invalid|fail).*jamb|invalid\s*jamb|verify\s*(my\s*)?jamb|jamb\s*profile|e\s*no\s*gree\s*verify|profile\s*verif(ication)?\s*(fail|error|issue)|verif(y|ication)\s*fail/i,
    problem: 'JAMB verification',
    stage: 'applying',
    troubleshooting: true,
    topics: ['jamb'],
    weight: 13,
  },
  {
    intent: 'nin-verification',
    re: /\bnin\b.*(not|isn'?t|no|keep|reject|invalid|fail|verify|work)|(not|isn'?t|no|keep|reject|invalid|fail).*?\bnin\b|verify\s*(my\s*)?\bnin\b/i,
    problem: 'NIN verification',
    stage: 'applying',
    troubleshooting: true,
    topics: ['nin'],
    weight: 12,
  },
  {
    intent: 'missing-information',
    re: /missing\s*(info|information|data|school)|no\s*school\s*(info|information)|showing\s*missing|information\s*not\s*found|record\s*not\s*found|e\s*dey\s*show\s*missing|e\s*no\s*gree(\s*me)?/i,
    problem: 'Missing information on portal',
    stage: 'applying',
    troubleshooting: true,
    topics: ['missing'],
    weight: 12,
  },
  {
    intent: 'school-not-found',
    re: /school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)|(not|isn'?t|no\s*dey).*(show|appear).*school|my\s*school\s*(no\s*dey|not\s*showing)|can'?t\s*find\s*(my\s*)?school|institution\s*not\s*found|wrong\s*school\s*selected|not\s*on\s*(the\s*)?list/i,
    problem: 'School not showing',
    stage: 'applying',
    troubleshooting: true,
    topics: ['school'],
    weight: 12,
  },
  {
    intent: 'scam-safety',
    re: /scam|fraud|\botp\b|(pay|send(\s*money)?|transfer).{0,40}(agent|them|whatsapp|approval)|(agent|whatsapp).{0,40}(pay|money|otp|password)|make\s*i\s*pay|whatsapp\s*man|someone\s*say\s*(pay|transfer)/i,
    problem: 'Scam or safety concern',
    stage: 'unknown',
    troubleshooting: true,
    topics: ['scam'],
    weight: 11,
  },
  {
    intent: 'pending-application',
    re: /(?<!pending\s)(?<!total\s)(?<!approved\s)\bpending\b(?!\s*loans)|application\s*(is\s*)?pending|status\s*(is\s*)?pending|under\s*review|still\s*(waiting|processing)|nothing\s*(is\s*)?happening|check\s*(my\s*)?(application\s*)?status|my\s*application\s*status|how\s*far\s*(with\s*)?(my\s*)?(application|loan)|submitted\s*but|on\s*hold|loan\s*status|wahala\s*(with\s*)?(my\s*)?(loan|application|nelfund)?|plenty\s*wahala|nothing\s*dey\s*move|e\s*no\s*dey\s*move/i,
    problem: 'Application still pending',
    stage: 'waiting',
    troubleshooting: true,
    topics: ['pending'],
    weight: 11,
  },
  {
    intent: 'upkeep',
    re: /\bupkeep\b|how\s*much.*(allowance|monthly|upkeep|20k)|20,?000|monthly\s*allowance|when\s*will\s*(i\s*)?(get|receive).*(money|upkeep|allowance)|disburse|money\s*(never|no)\s*(enter|come)|dem\s*never\s*pay|wetin\s*be\s*upkeep|accommodation|hostel/i,
    problem: 'Upkeep allowance',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['upkeep'],
    weight: 10,
  },
  {
    intent: 'repayment',
    re: /repay|pay\s*(this\s*)?(money\s*)?back|do\s*i\s*(have\s*to|must)\s*pay|when\s*do\s*i\s*(start\s*)?pay|loan\s*repayment|how\s*(do\s*i|to)\s*repay|repayment\s*(plan|schedule|start)/i,
    problem: 'Repayment',
    stage: 'repaying',
    troubleshooting: false,
    topics: ['repayment'],
    weight: 10,
  },
  {
    intent: 'gsi',
    re: /\bgsi\b|global\s*standing\s*instruction/i,
    problem: 'What GSI means',
    stage: 'repaying',
    troubleshooting: false,
    topics: ['gsi'],
    weight: 10,
  },
  {
    intent: 'loan-or-scholarship',
    re: /scholarship|free\s*money|is\s*(it|nelfund|this)\s*(a\s*)?loan|loan\s*or\s*scholarship|is\s*(it|this)\s*free/i,
    problem: 'Loan or scholarship',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['loan'],
    weight: 10,
  },
  {
    intent: 'profile-update',
    re: /edit\s*(my\s*)?(profile|account|information)|update\s*(my\s*)?(profile|account|details)|change\s*(my\s*)?(name|details|information|bank|course)|change\s*of\s*course|profile\s*verif|verif(y|ication)\s*(my\s*)?profile|profile\s*(not|no)\s*(verif|update)/i,
    problem: 'Update profile',
    stage: 'applying',
    troubleshooting: true,
    topics: ['profile'],
    weight: 12,
  },
  {
    intent: 'documents-needed',
    re: /what\s*(documents?|do\s*i\s*need)|documents?\s*need|requirements?|what\s*do\s*i\s*(need\s*)?(to\s*)?(apply|upload|submit)|checklist|matric(ulation)?\s*number|birth\s*certificate|statement\s*of\s*result|waec|neco/i,
    problem: 'Documents required',
    stage: 'preparing',
    troubleshooting: false,
    topics: ['documents'],
    weight: 9,
  },
  {
    intent: 'how-to-apply',
    re: /how\s*(do\s*i|to)\s*apply|application\s*steps?|start\s*(my\s*)?application|register\s*(for|on)\s*nelfund|how\s*to\s*register|steps?\s*to\s*apply|create\s*(an?\s*)?account|sign\s*up|i\s*want\s*to\s*apply|help\s*me\s*apply|abeg\s*how\s*(i\s*)?(go|to)\s*apply|next\s*step|i\s*wan\s*apply|wan\s*apply/i,
    problem: 'How to apply',
    stage: 'preparing',
    troubleshooting: false,
    topics: ['apply'],
    weight: 9,
  },
  {
    intent: 'guarantor',
    re: /guarantor|surety/i,
    problem: 'Guarantor requirement',
    stage: 'preparing',
    troubleshooting: false,
    topics: ['guarantor'],
    weight: 9,
  },
  {
    intent: 'contact-support',
    re: /official\s*email|nelfund\s*(support\s*)?email|support\s*email|nelfund\s*support|contact\s*(nelfund|support)|customer\s*(care|service)|helpline|esupport|open\s*(a\s*)?ticket|ticket\s*(no|not)\s*(reply|respond)|how\s*long\s*(does\s*)?support/i,
    problem: 'Contact NELFUND support',
    stage: 'unknown',
    troubleshooting: false,
    topics: ['contact'],
    weight: 14,
  },
  {
    intent: 'contact-lookup',
    re: /(school|institution|lasu|unilag|oou|futa).{0,50}(email|contact|phone)|(email|contact|phone).{0,50}(school|institution)|who\s*(do\s*i|should\s*i)\s*contact|how\s*(do\s*i|to)\s*contact\s*(my\s*)?(school|institution)/i,
    problem: 'Find official contact',
    stage: 'applying',
    troubleshooting: false,
    topics: ['contact'],
    weight: 19,
  },
  {
    intent: 'deadline',
    re: /deadline|closing\s*date|expire|when\s*will.{0,20}close/i,
    problem: 'Application deadline',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['deadline'],
    weight: 12,
  },
  {
    intent: 'official-sources',
    re: /official\s*(link|site|portal|website)|nelf\.gov|where\s*(do\s*i|to)\s*(apply|go)|which\s*(link|url|website)/i,
    problem: 'Official links',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['official'],
    weight: 8,
  },
  {
    intent: 'rejected-application',
    re: /\bapplication\s*(was\s*)?reject(?:ed|ion)?\b|\breject(?:ed|ion)?\s*(my\s*)?application\b|(?<!declined\s)\bdeclined\b(?!\s*loans)|nelfund\s*rejected|i\s*got\s*rejected\b/i,
    problem: 'Application rejected',
    stage: 'rejected',
    troubleshooting: true,
    topics: ['rejected'],
    weight: 11,
  },
  {
    intent: 'reapplication',
    re: /re-?apply|apply\s*again/i,
    problem: 'Reapplying',
    stage: 'applying',
    troubleshooting: true,
    topics: ['reapplication'],
    weight: 9,
  },
]

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const expanded = expandWithContext(question, history)
  const q = expanded.trim()
  if (!q) {
    return {
      intent: 'unknown',
      confidence: 0.2,
      topics: [],
      problem: null,
      stage: 'unknown',
      entities: [],
      isTroubleshooting: false,
    }
  }

  if (isLoanCounterNoise(q) && q.length < 220) {
    return {
      intent: 'current-information',
      confidence: 0.75,
      topics: ['current'],
      problem: 'Portal dashboard counters',
      stage: 'waiting',
      entities: detectEntities(q),
      isTroubleshooting: false,
    }
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

  const prior = lastUserIntent(history)
  if (prior && prior !== 'unknown' && q.length < 60) {
    return {
      intent: prior,
      confidence: 0.55,
      topics: [],
      problem: null,
      stage: 'unknown',
      entities: detectEntities(q),
      isTroubleshooting: false,
    }
  }

  return {
    intent: 'unknown',
    confidence: 0.35,
    topics: [],
    problem: null,
    stage: 'unknown',
    entities: detectEntities(q),
    isTroubleshooting: false,
  }
}
