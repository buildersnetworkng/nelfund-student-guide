import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

interface IntentRule {
  intent: IntentId
  patterns: RegExp[]
  topics: string[]
  problem: string
  stage: StudentStage
  entities: string[]
  troubleshooting: boolean
  weight: number
}

const RULES: IntentRule[] = [
  { intent: 'jamb-verification', patterns: [/jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|go)/i, /(not|isn'?t|no|keep|reject|invalid|fail).*jamb/i, /jamb.*(number|reg|registration).*(wrong|reject|invalid|not|fail)/i, /(reject|invalid|not\s*accept).*(jamb|registration\s*number)/i, /my\s*jamb.*(correct|right).*(but|still|keep)/i, /portal.*(no\s*dey|not|isn'?t).*accept.*jamb/i, /no\s*dey\s*accept\s*my\s*jamb/i, /jamb.*(no\s*dey|won'?t|wont)\s*(enter|work|go)/i, /can'?t\s*(enter|use|input).*jamb/i], topics: ['jamb', 'verification'], problem: 'JAMB registration number rejected or not verifying', stage: 'applying', entities: ['jamb'], troubleshooting: true, weight: 12 },
  { intent: 'nin-verification', patterns: [/nin.*(not|isn'?t|no|keep|reject|invalid|fail|verify|work|mismatch|match)/i, /(not|isn'?t|no|keep|reject|invalid|fail|mismatch).*nin/i, /nin.*(verif|fail|reject|mismatch)/i, /fix\s*(my\s*)?nin/i], topics: ['nin', 'verification'], problem: 'NIN is not verifying', stage: 'applying', entities: ['nin'], troubleshooting: true, weight: 12 },
  { intent: 'missing-information', patterns: [/missing\s*(info|information|data)/i, /no\s*school\s*(info|information)/i, /school\s*(info|information)\s*(not\s*found|missing)/i, /showing\s*missing/i, /it\s*(is\s*)?showing\s*missing/i, /nelfund.*showing\s*missing/i, /trying\s*to\s*open.*missing/i, /information\s*not\s*found/i, /no\s*information\s*found/i, /keeps?\s*saying\s*(no|missing)\s*(info|information)/i, /e\s*dey\s*show\s*missing/i, /dey\s*show\s*missing/i, /my\s*nelfund.*(missing|no\s*info)/i, /student\s*record.*(missing|not\s*found)/i, /record\s*not\s*found/i], topics: ['missing information'], problem: 'Portal shows missing or no school information', stage: 'applying', entities: ['school', 'portal'], troubleshooting: true, weight: 12 },
  { intent: 'school-not-found', patterns: [/school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)/i, /(not|isn'?t|no\s*dey|no).*(show|appear|come).*school/i, /my\s*school\s*(no\s*dey|not\s*showing|isn'?t\s*showing)/i, /institution\s*(not|isn'?t).*(on|in|show|list|found)/i, /school\s*no\s*dey\s*show/i, /can'?t\s*find\s*(my\s*)?school/i], topics: ['school not showing'], problem: 'School or institution is not appearing on the portal', stage: 'applying', entities: ['school'], troubleshooting: true, weight: 12 },
  { intent: 'pending-application', patterns: [/\bpending\b/i, /still\s*(waiting|processing|pending)/i, /status\s*(is\s*)?pending/i, /submitted.*(still|nothing|pending)/i, /nothing\s*is\s*happening/i, /i'?ve\s*submitted.*(since|and|but)/i, /this\s*thing\s*is\s*still\s*pending/i], topics: ['pending', 'status'], problem: 'Application is still pending', stage: 'waiting', entities: ['application'], troubleshooting: true, weight: 11 },
  { intent: 'rejected-application', patterns: [/reject/i, /declin/i, /not\s*approv/i, /failed\s*(verification|application)/i, /nelfund\s*rejected\s*me/i, /my\s*application\s*was\s*rejected/i], topics: ['rejected'], problem: 'Application was rejected', stage: 'rejected', entities: ['application'], troubleshooting: true, weight: 11 },
  { intent: 'bank-information', patterns: [/bank.*(detail|account|info|fail|reject|not)/i, /bvn.*(fail|reject|not|verif)/i], topics: ['bank', 'bvn'], problem: 'Bank details failed verification', stage: 'applying', entities: ['bank'], troubleshooting: true, weight: 11 },
  { intent: 'refund', patterns: [/already\s*paid/i, /paid\s*(my\s*)?(school\s*)?fees/i, /i\s*paid\s*before/i, /refund/i, /paid\s*before\s*(this\s*)?(loan|nelfund)/i], topics: ['already paid', 'refund'], problem: 'Already paid school fees before NELFUND', stage: 'applying', entities: ['fees'], troubleshooting: true, weight: 11 },
  { intent: 'profile-update', patterns: [/edit\s*(my\s*)?(profile|account|information)/i, /update\s*(my\s*)?(profile|account|details)/i, /change\s*(my\s*)?(name|details|information|bank)/i], topics: ['profile'], problem: 'Need to update profile or account information', stage: 'applying', entities: ['profile'], troubleshooting: true, weight: 10 },
  { intent: 'upkeep', patterns: [/\bupkeep\b/i, /how\s*much.*(allowance|monthly|upkeep|20k|20000)/i, /20,?000|₦\s*20|20k/i, /monthly\s*allowance/i, /how\s*(do\s*i|to)\s*get\s*(the\s*)?(20k|upkeep|allowance)/i, /get\s*(the\s*)?20k/i], topics: ['upkeep', '20k'], problem: 'Upkeep allowance amount or access', stage: 'exploring', entities: ['upkeep'], troubleshooting: false, weight: 10 },
  { intent: 'school-fees', patterns: [/school\s*fees/i, /institutional\s*charges/i, /will\s*nelfund\s*pay/i, /pay\s*(my\s*)?fees/i, /does\s*nelfund\s*pay\s*(school|fees)/i, /school\s*fees\s*and\s*upkeep/i, /fees\s*and\s*(upkeep|allowance)/i, /apply\s*for\s*(school\s*)?fees/i], topics: ['fees'], problem: 'How school fees / institutional charges are paid', stage: 'exploring', entities: ['fees'], troubleshooting: false, weight: 11 },
  { intent: 'institutional-charges', patterns: [/institutional\s*charges/i], topics: ['institutional charges'], problem: 'Institutional charges payment', stage: 'exploring', entities: ['fees'], troubleshooting: false, weight: 9 },
  { intent: 'repayment', patterns: [/repay/i, /pay\s*(this\s*)?(money\s*)?back/i, /do\s*i\s*(have\s*to|must)\s*pay/i, /when\s*do\s*i\s*(start\s*)?pay/i, /after\s*school.*(pay|repay)/i, /loan\s*repayment/i, /have\s*to\s*pay\s*(this\s*)?(money\s*)?back/i], topics: ['repayment'], problem: 'Repayment obligations after school', stage: 'repaying', entities: ['repayment'], troubleshooting: false, weight: 10 },
  { intent: 'gsi', patterns: [/\bgsi\b/i, /global\s*standing\s*instruction/i], topics: ['gsi'], problem: 'What GSI means for repayment', stage: 'repaying', entities: ['gsi'], troubleshooting: false, weight: 10 },
  { intent: 'loan-or-scholarship', patterns: [/scholarship/i, /free\s*money/i, /is\s*(it|nelfund|this)\s*(a\s*)?loan/i, /loan\s*or\s*scholarship/i, /is\s*(it|this)\s*free/i], topics: ['loan', 'scholarship'], problem: 'Whether NELFUND is a loan or scholarship', stage: 'exploring', entities: ['loan'], troubleshooting: false, weight: 10 },
  { intent: 'documents-needed', patterns: [/what\s*(documents?|do\s*i\s*need)/i, /documents?\s*need/i, /requirements?/i, /what\s*do\s*i\s*need\s*(to\s*)?(apply|upload|submit)/i], topics: ['documents'], problem: 'Documents required to apply', stage: 'preparing', entities: ['documents'], troubleshooting: false, weight: 9 },
  { intent: 'how-to-apply', patterns: [/how\s*(do\s*i|to)\s*apply/i, /application\s*steps?/i, /start\s*(my\s*)?application/i, /register\s*(for|on)\s*nelfund/i], topics: ['apply'], problem: 'How to apply for NELFUND', stage: 'preparing', entities: ['application'], troubleshooting: false, weight: 9 },
  { intent: 'eligibility', patterns: [/eligib/i, /can\s*i\s*apply/i, /am\s*i\s*(eligible|qualified)/i, /who\s*can\s*apply/i, /cgpa/i], topics: ['eligibility'], problem: 'Eligibility to apply', stage: 'exploring', entities: ['eligibility'], troubleshooting: false, weight: 8 },
  { intent: 'guarantor', patterns: [/guarantor/i, /surety/i], topics: ['guarantor'], problem: 'Whether a guarantor is required', stage: 'preparing', entities: ['guarantor'], troubleshooting: false, weight: 9 },
  { intent: 'academic-session', patterns: [/2026\s*\/?\s*27|2025\s*\/?\s*26|session/i, /can\s*i\s*still\s*apply/i, /is\s*(application|portal)\s*(still\s*)?open/i], topics: ['session'], problem: 'Current application session or window', stage: 'exploring', entities: ['session'], troubleshooting: false, weight: 8 },
  { intent: 'deadline', patterns: [/deadline/i, /closing\s*date/i], topics: ['deadline'], problem: 'Application deadline', stage: 'exploring', entities: ['deadline'], troubleshooting: false, weight: 8 },
  { intent: 'institution-verification', patterns: [/institutional\s*verif/i, /school\s*verif/i, /verif.*(institution|school)/i], topics: ['institution verification'], problem: 'Institutional verification process', stage: 'waiting', entities: ['verification'], troubleshooting: true, weight: 9 },
  { intent: 'scam-safety', patterns: [/scam/i, /fraud/i, /otp/i, /agent.*(pay|money)/i], topics: ['scam'], problem: 'Scam or safety concern', stage: 'unknown', entities: ['scam'], troubleshooting: true, weight: 11 },
  { intent: 'readiness', patterns: [/am\s*i\s*ready/i, /checklist/i, /prepared/i], topics: ['readiness'], problem: 'Application readiness checklist', stage: 'preparing', entities: ['checklist'], troubleshooting: false, weight: 8 },
  { intent: 'official-sources', patterns: [/official\s*(link|site|portal|website)/i, /nelf\.gov/i, /where\s*(do\s*i|to)\s*(apply|go)/i], topics: ['official'], problem: 'Official NELFUND links', stage: 'exploring', entities: ['portal'], troubleshooting: false, weight: 8 },
  { intent: 'contact-support', patterns: [/contact\s*(nelfund|support)/i, /customer\s*(care|service)/i, /helpline/i], topics: ['contact'], problem: 'How to contact NELFUND support', stage: 'unknown', entities: ['support'], troubleshooting: false, weight: 8 },
  { intent: 'reapplication', patterns: [/re-?apply/i, /apply\s*again/i], topics: ['reapplication'], problem: 'Reapplying after a previous attempt', stage: 'applying', entities: ['application'], troubleshooting: true, weight: 9 },
  { intent: 'what-is-nelfund', patterns: [/what\s*is\s*nelfund/i, /explain\s*nelfund/i, /about\s*nelfund/i, /tell\s*me\s*about\s*nelfund/i, /^nelfund\??$/i], topics: ['what is', 'nelfund'], problem: 'What NELFUND is', stage: 'exploring', entities: ['nelfund'], troubleshooting: false, weight: 7 },
]

export const QUERY_SYNONYMS: Record<string, string[]> = {
  school: ['institution', 'university', 'poly', 'polytechnic', 'college'],
  show: ['appear', 'come up', 'list', 'found', 'dey'],
  missing: ['no information', 'not found', 'empty'],
  jamb: ['jamb number', 'jamb reg', 'registration number'],
  nin: ['national identity', 'nin number'],
  pending: ['waiting', 'processing', 'still pending'],
  rejected: ['declined', 'not approved', 'failed'],
  upkeep: ['20k', '20000', 'allowance', 'monthly allowance'],
  fees: ['school fees', 'institutional charges', 'tuition'],
  repay: ['pay back', 'repayment'],
  apply: ['application', 'register', 'registration'],
}

function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b/i, 'jamb'], [/\bnin\b/i, 'nin'], [/\bbvn\b/i, 'bvn'],
    [/school|institution|university/i, 'school'], [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|allowance/i, 'upkeep'], [/pending|status/i, 'status'],
    [/reject/i, 'rejection'], [/bank|account/i, 'bank'], [/portal|nelfund/i, 'portal'],
  ]
  for (const [re, name] of map) {
    if (re.test(q) && !entities.includes(name)) entities.push(name)
  }
  return entities
}

function expandWithContext(question: string, history?: ConversationTurn[]): string {
  if (!history || history.length === 0) return question
  const recentUser = history.filter((t) => t.role === 'user').slice(-2).map((t) => t.text).join(' ')
  if (question.trim().length < 40 && recentUser) return `${recentUser} ${question}`
  return question
}

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const raw = question.trim()
  if (!raw) {
    return { intent: 'unknown', confidence: 0, topics: [], problem: null, stage: 'unknown', entities: [], isTroubleshooting: false }
  }
  const q = expandWithContext(raw, history)
  const entities = detectEntities(q)
  let best: { rule: IntentRule; hits: number } | null = null
  for (const rule of RULES) {
    let hits = 0
    for (const pattern of rule.patterns) {
      if (pattern.test(q)) hits += 1
    }
    if (hits === 0) continue
    const score = hits * rule.weight
    if (!best || score > best.hits * best.rule.weight) best = { rule, hits }
  }
  if (best) {
    const conf = Math.min(0.95, 0.55 + best.hits * 0.12 + best.rule.weight * 0.02)
    return {
      intent: best.rule.intent,
      confidence: conf,
      topics: best.rule.topics,
      problem: best.rule.problem,
      stage: best.rule.stage,
      entities: Array.from(new Set([...entities, ...best.rule.entities])),
      isTroubleshooting: best.rule.troubleshooting,
    }
  }
  const lower = q.toLowerCase()
  if (lower.includes('nelfund') && (lower.includes('what') || lower.includes('mean'))) {
    return { intent: 'what-is-nelfund', confidence: 0.55, topics: ['what is', 'nelfund'], problem: 'What NELFUND is', stage: 'exploring', entities, isTroubleshooting: false }
  }
  return {
    intent: 'unknown',
    confidence: 0.2,
    topics: q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2).slice(0, 8),
    problem: null,
    stage: 'unknown',
    entities,
    isTroubleshooting: false,
  }
}
