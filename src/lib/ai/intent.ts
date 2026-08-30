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
    intent: 'refund',
    re: /already\s*paid|paid\s*(my\s*)?(school\s*)?fees|i\s*paid\s*before|\brefund\b|paid\s*before\s*(this\s*)?(loan|nelfund)/i,
    problem: 'Already paid fees',
    stage: 'applying',
    troubleshooting: true,
    topics: ['refund'],
    weight: 20,
  },
  {
    intent: 'school-fees',
    re: /school\s*fees|institutional\s*charges|will\s*nelfund\s*pay|pay\s*(my\s*)?fees|does\s*nelfund\s*pay\s*(school|fees)|apply\s*for\s*(school\s*)?fees|fees\s*and\s*(upkeep|allowance)/i,
    problem: 'School fees payment',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['fees'],
    weight: 19,
  },
  {
    intent: 'contact-lookup',
    re: /(school|institution|lasu|unilag|oou|futa).{0,50}(email|contact|phone)|(email|contact|phone).{0,50}(school|institution)|who\s*(do\s*i|should\s*i)\s*contact|how\s*(do\s*i|to)\s*contact\s*(my\s*)?(school|institution)|find\s*(the\s*)?(official\s*)?(contact|email)|How I fit contact/i,
    problem: 'Find official contact',
    stage: 'applying',
    troubleshooting: false,
    topics: ['contact'],
    weight: 19,
  },
  {
    intent: 'eligibility',
    re: /eligib|can\s*i\s*apply|am\s*i\s*(eligible|qualified)|who\s*can\s*apply|cgpa|disqualif|who\s*(cannot|can'?t)\s*apply|ineligib|100\s*-?\s*level|\d{2,3}\s*-?\s*level|year\s*(one|1|two|2)|fresher|freshman|as\s*(an?\s*)?(\d{2,3}\s*-?\s*level|new\s*student|undergraduate)|new\s*student\s*(can|apply)|can\s*(a\s*)?(100|new)|apply\s*as\s*(a\s*)?(100|fresher|new)/i,
    problem: 'Eligibility',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['eligibility'],
    weight: 19,
  },
  {
    intent: 'current-information',
    re: /as\s*of\s*today|current\s*(info|information|status|update)|latest\s*(update|news|info|nelfund)|still\s*accepting|is\s*nelfund\s*still|is\s*nelfund\s*(currently\s*)?open|is\s*(the\s*)?nelfund\s*(loan|application|portal)?\s*(currently\s*)?(still\s*)?open|accepting\s*applications|has\s*2026|is\s*(the\s*)?(application|portal|loan\s*portal)\s*(still\s*)?open|can\s*i\s*still\s*apply|still\s*can\s*(i\s*)?apply|don'?t\s*have\s*(a\s*)?bvn|no\s*bvn\s*yet|them\s*never\s*open|dem\s*never\s*open|window\s*(still\s*)?(open|close)|portal\s*(no|not|never)\s*(dey\s*)?(open|work)|when\s*dem\s*(go|will)\s*open|when\s*(will|is|does).{0,40}(expire|close|end|open)|what.?s\s*the\s*latest|any\s*latest\s*update|nelfund\s*still\s*open|application\s*still\s*open|dem\s*open|loan\s*window|registration\s*(still\s*)?open|still\s*accepting/i,
    problem: 'Current or time-sensitive information',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['current'],
    weight: 18,
  },
  {
    intent: 'portal-login',
    re: /\blogin\b|log\s*in|sign\s*in|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(not\s*work|reset|issue)|can.?t\s*(login|log\s*in)|portal\s*link|where\s*(i\s*)?(go|enter|open)\s*(the\s*)?(portal|site)|existing\s*(account|application)|already\s*(have|created)\s*(an?\s*)?account|which\s*(website|site|link|url)|official\s*(website|site|portal|link)|how\s*(to|do\s*i)\s*(enter|access)\s*(the\s*)?portal|link\s*to\s*apply|where\s*to\s*register|continue\s*(my\s*)?application/i,
    problem: 'Official link to login',
    stage: 'applying',
    troubleshooting: false,
    topics: ['login'],
    weight: 17,
  },
  {
    intent: 'institution-verification',
    re: /institutional\s*verif|school\s*verif|verif.*(institution|school)|data\s*(been\s*)?uploaded|uploaded\s*(to\s*)?(nelfund|portal)|school\s*(has\s*)?uploaded|know\s*if\s*(my\s*)?(data|record|school).{0,40}upload|my\s*school\s*(never|no)\s*upload|school\s*data\s*no\s*upload/i,
    problem: 'Institution upload status',
    stage: 'waiting',
    troubleshooting: true,
    topics: ['upload'],
    weight: 16,
  },
  {
    intent: 'bank-information',
    re: /bank.*(detail|account|info|fail|reject|not)|my\s*bank\s*details|bvn.*(fail|reject|not|verif)|\bbvn\b.*work|BVN not working/i,
    problem: 'Bank details or BVN',
    stage: 'applying',
    troubleshooting: true,
    topics: ['bank'],
    weight: 14,
  },
  {
    intent: 'jamb-verification',
    re: /jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|go)|(not|isn'?t|no|keep|reject|invalid|fail).*jamb|no\s*dey\s*accept\s*my\s*jamb|jamb.*(no\s*dey|won'?t)|problem\s*with\s*(my\s*)?jamb|jamb\s*issue/i,
    problem: 'JAMB verification',
    stage: 'applying',
    troubleshooting: true,
    topics: ['jamb'],
    weight: 12,
  },
  {
    intent: 'nin-verification',
    re: /\bnin\b.*(not|isn'?t|no|keep|reject|invalid|fail|verify|work|mismatch)|(not|isn'?t|no|keep|reject|invalid|fail|mismatch).*\bnin\b|fix\s*(my\s*)?\bnin\b|\bnin\b\s*issue/i,
    problem: 'NIN verification',
    stage: 'applying',
    troubleshooting: true,
    topics: ['nin'],
    weight: 12,
  },
  {
    intent: 'missing-information',
    re: /missing\s*(info|information|data)|no\s*school\s*(info|information)|showing\s*missing|information\s*not\s*found|no\s*information\s*found|keeps?\s*saying\s*(no|missing)|e\s*dey\s*show\s*missing|record\s*not\s*found|no\s*dey\s*show\s*(my\s*)?(info|information)|portal\s*no\s*dey\s*work|e\s*no\s*dey\s*work|wahala\s*(with\s*)?(missing|info)/i,
    problem: 'Missing information on portal',
    stage: 'applying',
    troubleshooting: true,
    topics: ['missing'],
    weight: 12,
  },
  {
    intent: 'school-not-found',
    re: /school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)|(not|isn'?t|no\s*dey).*(show|appear).*school|my\s*school\s*(no\s*dey|not\s*showing)|can'?t\s*find\s*(my\s*)?school|school\s*not\s*on\s*(the\s*)?(list|portal)|institution\s*not\s*found|institution\s*(not|isn'?t)\s*(on|in|show|list|found)/i,
    problem: 'School not showing',
    stage: 'applying',
    troubleshooting: true,
    topics: ['school'],
    weight: 12,
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
    intent: 'scam-safety',
    re: /scam|fraud|\botp\b|(pay|send(\s*money)?|transfer|give).{0,40}(agent|them|him|her|am|whatsapp)|(agent|whatsapp).{0,30}(pay|money|otp)|make\s*i\s*pay|pay\s*\d+\s*k|pay\s*\d{3,}|whatsapp\s*man|someone\s*say\s*pay|pay\s*to\s*(get|process|approve)/i,
    problem: 'Scam or safety concern',
    stage: 'unknown',
    troubleshooting: true,
    topics: ['scam'],
    weight: 11,
  },
  {
    intent: 'pending-application',
    re: /(?<!pending\s)(?<!total\s)(?<!approved\s)\bpending\b(?!\s*loans)|application\s*(is\s*)?pending|status\s*(is\s*)?pending|under\s*review|still\s*under\s*review|not\s*yet\s*approv|approval\s*status|e\s*still\s*dey\s*pending|still\s*(waiting|processing)|nothing\s*is\s*happening|nothing\s*dey\s*happen|status\s*no\s*dey\s*change|after\s*i\s*submitted/i,
    problem: 'Application still pending',
    stage: 'waiting',
    troubleshooting: true,
    topics: ['pending'],
    weight: 11,
  },
  {
    intent: 'rejected-application',
    re: /\bapplication\s*(was\s*)?reject(?:ed|ion)?\b|\breject(?:ed|ion)?\s*(my\s*)?application\b|(?<!declined\s)\bdeclined\b(?!\s*loans)|not\s*approv|failed\s*(verification|application)|nelfund\s*rejected|i\s*got\s*rejected\b/i,
    problem: 'Application rejected',
    stage: 'rejected',
    troubleshooting: true,
    topics: ['rejected'],
    weight: 11,
  },
  {
    intent: 'upkeep',
    re: /\bupkeep\b|how\s*much.*(allowance|monthly|upkeep|20k|20000)|20,?000|monthly\s*allowance|get\s*(the\s*)?20k|when\s*will\s*(i\s*)?(get|receive|the\s*money).*(money|upkeep|allowance|20k|enter|account)?|when\s*will\s*the\s*money\s*enter|disburse|money\s*(never|no)\s*(enter|come)|dem\s*never\s*pay|have\s*(they|dem)\s*pay|wetin\s*be\s*upkeep/i,
    problem: 'Upkeep allowance',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['upkeep'],
    weight: 10,
  },
  {
    intent: 'repayment',
    re: /repay|pay\s*(this\s*)?(money\s*)?back|do\s*i\s*(have\s*to|must)\s*pay|when\s*do\s*i\s*(start\s*)?pay|after\s*school.*(pay|repay)|loan\s*repayment|do I need to repay/i,
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
    re: /edit\s*(my\s*)?(profile|account|information)|update\s*(my\s*)?(profile|account|details)|change\s*(my\s*)?(name|details|information|bank)/i,
    problem: 'Update profile',
    stage: 'applying',
    troubleshooting: true,
    topics: ['profile'],
    weight: 10,
  },
  {
    intent: 'documents-needed',
    re: /what\s*(documents?|do\s*i\s*need)|documents?\s*need|requirements?|what\s*do\s*i\s*need\s*(to\s*)?(apply|upload|submit)|checklist|matric(ulation)?\s*number|i\s*(don'?t|do\s*not|no)\s*have\s*matric|no\s*matric|papers?\s*(do\s*i\s*)?need/i,
    problem: 'Documents required',
    stage: 'preparing',
    troubleshooting: false,
    topics: ['documents'],
    weight: 9,
  },
  {
    intent: 'how-to-apply',
    re: /how\s*(do\s*i|to)\s*apply|application\s*steps?|start\s*(my\s*)?application|register\s*(for|on)\s*nelfund|fill\s*(my\s*)?(information|application|form)|new\s*application|how\s*(does|do)\s*(nelfund|it)\s*work|how\s*to\s*register|steps?\s*to\s*apply|create\s*(an?\s*)?account|create\s*(?:[\w']+\s+){0,3}account|account\s*creation|sign\s*up|i\s*want\s*to\s*apply|help\s*me\s*apply|abeg\s*how\s*(i\s*)?(go|to)\s*apply/i,
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
    intent: 'reapplication',
    re: /re-?apply|apply\s*again/i,
    problem: 'Reapplying',
    stage: 'applying',
    troubleshooting: true,
    topics: ['reapplication'],
    weight: 9,
  },
  {
    intent: 'official-sources',
    re: /official\s*(link|site|portal|website)|nelf\.gov|where\s*(do\s*i|to)\s*(apply|go)|which\s*(link|url|website)|abeg\s*(which|wetin)\s*(site|link)/i,
    problem: 'Official links',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['official'],
    weight: 8,
  },
  {
    intent: 'contact-support',
    re: /official\s*email|nelfund\s*email|email\s*of\s*nelfund|support\s*email|contact\s*(nelfund|support)|customer\s*(care|service)|helpline|esupport|open\s*(a\s*)?ticket/i,
    problem: 'Contact NELFUND support',
    stage: 'unknown',
    troubleshooting: false,
    topics: ['contact'],
    weight: 10,
  },
  {
    intent: 'readiness',
    re: /am\s*i\s*ready|checklist|prepared/i,
    problem: 'Readiness checklist',
    stage: 'preparing',
    troubleshooting: false,
    topics: ['readiness'],
    weight: 8,
  },
  {
    intent: 'what-is-nelfund',
    re: /what\s*is\s*nelfund|explain\s*nelfund|about\s*nelfund|tell\s*me\s*about\s*nelfund|help\s*me\s*understand\s*nelfund|understand\s*nelfund|what\s*does\s*nelfund\s*(mean|do|stand)|meaning\s*of\s*nelfund|^nelfund\??$/i,
    problem: 'What NELFUND is',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['what is'],
    weight: 12,
  },
  {
    intent: 'what-is-nelfund',
    re: /wetin\s*be\s*nelfund|how\s*did\s*nelfund\s*(start|begin|come)|history\s*of\s*nelfund|when\s*was\s*nelfund\s*(created|established|started)/i,
    problem: 'What NELFUND is',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['what is'],
    weight: 12,
  },
  {
    intent: 'academic-session',
    re: /2026\s*\/?\s*27|2025\s*\/?\s*26|session/i,
    problem: 'Application session',
    stage: 'exploring',
    troubleshooting: false,
    topics: ['session'],
    weight: 8,
  },
]

export const QUERY_SYNONYMS: Record<string, string[]> = {
  school: ['institution', 'university', 'poly', 'polytechnic', 'college'],
  apply: ['application', 'register', 'registration'],
  upkeep: ['20k', '20000', 'allowance'],
}

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const raw = question.trim()
  if (!raw) {
    return {
      intent: 'unknown',
      confidence: 0,
      topics: [],
      problem: null,
      stage: 'unknown',
      entities: [],
      isTroubleshooting: false,
    }
  }
  const q = expandWithContext(raw, history)
  const entities = detectEntities(q)

  if (isLoanCounterNoise(q)) {
    return {
      intent: 'current-information',
      confidence: 0.8,
      topics: ['dashboard'],
      problem: 'Portal dashboard',
      stage: 'applying',
      entities: Array.from(new Set([...entities, 'portal'])),
      isTroubleshooting: false,
    }
  }

  let best: { rule: Rule; score: number } | null = null
  for (const rule of RULES) {
    if (rule.re.test(q)) {
      const score = rule.weight
      if (!best || score > best.score) best = { rule, score }
    }
  }
  if (best) {
    return {
      intent: best.rule.intent,
      confidence: Math.min(0.95, 0.7 + best.rule.weight * 0.01),
      topics: best.rule.topics,
      problem: best.rule.problem,
      stage: best.rule.stage,
      entities,
      isTroubleshooting: best.rule.troubleshooting,
    }
  }

  const prev = lastUserIntent(history)
  if (prev && prev !== 'unknown' && raw.length < 48) {
    return {
      intent: prev,
      confidence: 0.55,
      topics: ['follow-up'],
      problem: null,
      stage: 'unknown',
      entities,
      isTroubleshooting: false,
    }
  }

  const t = q.toLowerCase()
  if (
    /^(ok|okay|yes|yeah|yep|thanks|thank\s*you|ty|alright|fine)[!.?]*$/i.test(t.trim()) ||
    (/^(ok|okay|yes|thanks)\b/i.test(t.trim()) && t.trim().length < 24)
  ) {
    return {
      intent: 'official-sources',
      confidence: 0.45,
      topics: ['ack'],
      problem: 'Official links',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (
    /hello|hi\b|good\s*(morning|afternoon|evening)|abeg|please\s*help/i.test(t) &&
    t.length < 48 &&
    !/understand|explain|about\s*nelfund|what\s*is/i.test(t)
  ) {
    return {
      intent: 'how-to-apply',
      confidence: 0.55,
      topics: ['greeting'],
      problem: 'How to apply for NELFUND',
      stage: 'preparing',
      entities,
      isTroubleshooting: false,
    }
  }

  return {
    intent: 'unknown',
    confidence: 0.2,
    topics: t.split(/[^a-z0-9]+/).filter((x) => x.length > 2).slice(0, 8),
    problem: null,
    stage: 'unknown',
    entities,
    isTroubleshooting: false,
  }
}
