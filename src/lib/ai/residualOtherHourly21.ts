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

/** 17 Sep 10:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly21(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/name\s*(no|not|never)\s*(match|correct|the\s*same)|surname\s*(change|changed)|my\s*name\s*(different|wrong)|maiden\s*name|name\s*mismatch/i.test(q)) {
    return hit('nin-verification', 0.88, ['nin', 'other', 'name-mismatch'], 'Name mismatch leftover', 'applying', entities, true)
  }

  if (/date\s*of\s*birth|\bdob\b|birthday\s*(no|not|never)\s*(match|correct)|age\s*(no|not)\s*match/i.test(q)) {
    return hit('nin-verification', 0.86, ['nin', 'other', 'dob'], 'DOB mismatch leftover', 'applying', entities, true)
  }

  if (/matric\s*(no|number|num)\s*(invalid|wrong|no|not)|invalid\s*matric|matriculation\s*(no|not)\s*(dey|work)/i.test(q)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'matric'], 'Matric leftover', 'applying', entities, true)
  }

  if (/session\s*(no|not|never)\s*(dey|show|appear)|2025\s*\/?\s*2026\s*(no|not)\s*(dey|show)|no\s*session\s*(for|on)\s*(the\s*)?(portal|list)/i.test(q)) {
    return hit('academic-session', 0.88, ['missing', 'other', 'session'], 'Session missing leftover', 'applying', entities, true)
  }

  if (/i\s*(don|have)\s*(already\s*)?pay\s*(my\s*)?(school\s*)?fees|already\s*paid\s*(school\s*)?fees|can\s*i\s*(still\s*)?apply\s*after\s*(i\s*)?pay/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('refund', 0.86, ['fees', 'other', 'already-paid'], 'Already paid fees leftover', 'exploring', entities)
  }

  if (/two\s*application|double\s*application|i\s*apply\s*two\s*times|duplicate\s*application|second\s*application/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('reapplication', 0.84, ['how-to-apply', 'other', 'duplicate'], 'Duplicate application leftover', 'preparing', entities)
  }

  if (/change\s*(my\s*)?(phone|number|gsm)|new\s*phone\s*number|old\s*number\s*(no|not)\s*(dey|work)/i.test(q)) {
    return hit('profile-update', 0.86, ['login', 'other', 'phone'], 'Phone change leftover', 'applying', entities, true)
  }

  if (/i\s*(don|have)\s*graduate|i\s*be\s*graduate|final\s*year\s*(don|has)\s*finish|i\s*don\s*finish\s*school/i.test(q) && !/pending|how\s*far|repay|nysc/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'graduate'], 'Already graduated leftover', 'exploring', entities)
  }

  if (/\bsiwes\b|\bit\s*attachment\b|industrial\s*training|i\s*dey\s*siwes/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'siwes'], 'SIWES leftover', 'exploring', entities)
  }

  if (/law\s*school|nls\b|medical\s*school|housemanship|i\s*dey\s*law\s*school/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'professional-school'], 'Law/med school leftover', 'exploring', entities)
  }

  if (/change\s*(my\s*)?bank|new\s*account\s*number|wrong\s*account|account\s*(no|not)\s*(correct|match)/i.test(q)) {
    return hit('bank-information', 0.88, ['bank', 'other'], 'Bank change leftover', 'preparing', entities, true)
  }

  if (/declin|reject|they\s*refuse|application\s*(no|not)\s*(gree|approve)/i.test(q) && !/pending|under\s*review/.test(low)) {
    return hit('rejected-application', 0.86, ['other', 'declined'], 'Declined leftover', 'waiting', entities, true)
  }

  if (/guarantor|surety|who\s*go\s*stand\s*for\s*me/i.test(q)) {
    return hit('guarantor', 0.88, ['other', 'guarantor'], 'Guarantor leftover', 'preparing', entities)
  }

  if (/which\s*session|what\s*session|2024\s*\/?\s*2025|academic\s*year/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('academic-session', 0.82, ['other', 'session'], 'Which session leftover', 'exploring', entities)
  }

  return null
}
