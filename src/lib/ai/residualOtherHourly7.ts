import type { IntentId, IntentResult } from './types'

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

/** 16 Sep 13:00 WAT hourly: admin topUnknownTopics.other still 324. */
export function residualOtherHourly7(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/how\s*many\s*(students?|beneficiar)|how\s*much\s*(don|has)\s*(dem|they|una)\s*(pay|disburse)|\b355|billion\s*(loan|disburse)|total\s*(loan|disburse)/i.test(q)) {
    return hit('official-sources', 0.84, ['other', 'disbursement-totals'], 'Disbursement totals leftover', 'exploring', entities)
  }

  if (/\b(200|300|400|500)\s*level\b|\b(200|300|400|500)l\b|final\s*year|penultimate/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'level'], '200L+ leftover', 'exploring', entities)
  }

  if (/direct\s*entry|\bde\s*(student|applicant)|i\s*(be|am)\s*de\b/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'direct-entry'], 'Direct entry leftover', 'exploring', entities)
  }

  if (/school\s*(never|no|not)\s*(upload|send|submit)\s*(the\s*)?(list|data|record)|institution\s*(never|no)\s*(send|upload)\s*list|verified\s*student\s*list/i.test(q)) {
    return hit('institution-verification', 0.86, ['missing', 'other', 'school-list'], 'School list not uploaded leftover', 'applying', entities, true)
  }

  if (/\btin\b|tax\s*identification|firs\s*tin/i.test(q)) {
    return hit('documents-needed', 0.82, ['documents', 'other', 'tin'], 'TIN leftover', 'preparing', entities)
  }

  if (/passport\s*(photo|photograph)|passport\s*size|upload\s*(my\s*)?(picture|photo)/i.test(q)) {
    return hit('documents-needed', 0.82, ['documents', 'other', 'photo'], 'Passport photo leftover', 'preparing', entities)
  }

  if (/pos\s*account|agent\s*account|use\s*(pos|agent)\s*(account|number)/i.test(q)) {
    return hit('bank-information', 0.84, ['bank', 'other', 'pos'], 'POS / agent account leftover', 'preparing', entities, true)
  }

  if (/na\s*(grant|free\s*money)|is\s*it\s*(a\s*)?grant|dem\s*go\s*collect\s*am\s*back/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('loan-or-scholarship', 0.86, ['scholarship', 'other'], 'Grant vs loan leftover', 'exploring', entities)
  }

  if (/who\s*(go|will|dey)\s*(sign|approve)|who\s*approve\s*(the\s*)?(loan|application)/i.test(q)) {
    return hit('pending-application', 0.8, ['pending-status', 'other', 'who-approves'], 'Who approves leftover', 'waiting', entities, true)
  }

  if (/can\s*(i|we)\s*apply\s*(for\s*)?(only\s*)?(upkeep|school\s*fees)|upkeep\s*only|fees\s*only/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.82, ['how-to-apply', 'other', 'upkeep-only'], 'Upkeep or fees only leftover', 'preparing', entities)
  }

  return null
}
