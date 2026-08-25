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

function isLoanCounterNoise(q: string): boolean {
  return (
    /total\s*loans/i.test(q) ||
    /approved\s*loans/i.test(q) ||
    /pending\s*loans/i.test(q) ||
    /declined\s*loans/i.test(q) ||
    /welcome\s+to\s+student\s+loan\s+portal/i.test(q)
  )
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
  // Temporary minimal classifier while full file is restored via push
  const t = raw.toLowerCase()
  if (/create\s*(an?\s*)?account|how\s*(do\s*i|to)\s*apply|i\s*want\s*to\s*apply|abeg\s*how/i.test(t)) {
    return { intent: 'how-to-apply', confidence: 0.8, topics: ['apply'], problem: 'How to apply for NELFUND', stage: 'preparing', entities: [], isTroubleshooting: false }
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|\blogin\b|log\s*in|sign\s*in/i.test(t)) {
    return { intent: 'portal-login', confidence: 0.8, topics: ['login'], problem: 'Official link to login', stage: 'applying', entities: [], isTroubleshooting: false }
  }
  if (/under\s*review|pending|not\s*yet\s*approv/i.test(t)) {
    return { intent: 'pending-application', confidence: 0.8, topics: ['pending'], problem: 'Application is still pending', stage: 'waiting', entities: [], isTroubleshooting: true }
  }
  if (/upkeep|20k|dem\s*never\s*pay|money\s*(never|no)\s*(enter|come)|disburse/i.test(t)) {
    return { intent: 'upkeep', confidence: 0.8, topics: ['upkeep'], problem: 'Upkeep allowance', stage: 'exploring', entities: [], isTroubleshooting: false }
  }
  if (/portal\s*(no|not).*open|when\s*dem\s*(go|will)\s*open|still\s*accepting|is\s*(the\s*)?(portal|nelfund).*open|as\s*of\s*today|latest\s*(update|nelfund)/i.test(t)) {
    return { intent: 'current-information', confidence: 0.8, topics: ['current'], problem: 'Current information', stage: 'exploring', entities: [], isTroubleshooting: false }
  }
  if (/jamb/i.test(t)) {
    return { intent: 'jamb-verification', confidence: 0.8, topics: ['jamb'], problem: 'JAMB verification', stage: 'applying', entities: ['jamb'], isTroubleshooting: true }
  }
  if (/missing\s*(info|information)|no\s*information|record\s*not\s*found/i.test(t)) {
    return { intent: 'missing-information', confidence: 0.8, topics: ['missing'], problem: 'Missing information', stage: 'applying', entities: [], isTroubleshooting: true }
  }
  if (/school.*(not|no\s*dey).*(show|list)|school\s*no\s*dey/i.test(t)) {
    return { intent: 'school-not-found', confidence: 0.8, topics: ['school'], problem: 'School not showing', stage: 'applying', entities: ['school'], isTroubleshooting: true }
  }
  if (/scam|otp|pay\s*(an?\s*)?agent/i.test(t)) {
    return { intent: 'scam-safety', confidence: 0.9, topics: ['scam'], problem: 'Scam concern', stage: 'unknown', entities: ['scam'], isTroubleshooting: true }
  }
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund/i.test(t)) {
    return { intent: 'what-is-nelfund', confidence: 0.8, topics: ['what is'], problem: 'What NELFUND is', stage: 'exploring', entities: [], isTroubleshooting: false }
  }
  if (/^(ok|okay|yes|yeah|thanks|thank\s*you|ty)\.?$/i.test(t.trim())) {
    return { intent: 'official-sources', confidence: 0.45, topics: ['ack'], problem: 'Official links', stage: 'exploring', entities: [], isTroubleshooting: false }
  }
  if (/hello|hi\b|help\s*me|abeg/i.test(t) && t.length < 48) {
    return { intent: 'how-to-apply', confidence: 0.55, topics: ['greeting'], problem: 'How to apply for NELFUND', stage: 'preparing', entities: [], isTroubleshooting: false }
  }
  return {
    intent: 'unknown',
    confidence: 0.2,
    topics: t.split(/[^a-z0-9]+/).filter((x) => x.length > 2).slice(0, 8),
    problem: null,
    stage: 'unknown',
    entities: [],
    isTroubleshooting: false,
  }
}

export const QUERY_SYNONYMS: Record<string, string[]> = {
  school: ['institution', 'university'],
  apply: ['application', 'register'],
}
