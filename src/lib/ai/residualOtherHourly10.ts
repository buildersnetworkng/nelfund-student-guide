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

/** 16 Sep 18:00 WAT hourly: admin topUnknownTopics.other still 324 lifetime. */
export function residualOtherHourly10(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/extra\s*year|spill[\s-]*over|i\s*(dey|am)\s*(repeat|resit)|carry[\s-]*over\s*year|i\s*no\s*finish\s*(for|in)\s*time/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'extra-year'], 'Extra year / spillover leftover', 'exploring', entities)
  }

  if (/rusticat|suspend(ed|sion)|expel(led)?|i\s*(dey|am)\s*on\s*suspension/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'discipline'], 'Rustication / suspension leftover', 'exploring', entities)
  }

  if (/state\s*of\s*origin|indigene(\s*letter)?|certificate\s*of\s*origin|lga\s*(letter|certificate)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.84, ['documents', 'other', 'origin'], 'State of origin leftover', 'preparing', entities)
  }

  if (/affidavit|court\s*(paper|document)|change\s*of\s*name|i\s*change\s*name/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.84, ['profile', 'other', 'name-change'], 'Affidavit / name change leftover', 'applying', entities, true)
  }

  if (/apply\s*(from|with|on)\s*(my\s*)?(phone|mobile|android|iphone)|fit\s*apply\s*for\s*phone|phone\s*browser/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other', 'mobile'], 'Apply from phone leftover', 'preparing', entities)
  }

  if (/withdraw\s*(my\s*)?(application|loan|file)|cancel\s*(my\s*)?(application|loan)|i\s*no\s*wan\s*(the\s*)?loan\s*again|delete\s*(my\s*)?(application|account)/i.test(q)) {
    return hit('contact-support', 0.84, ['contact', 'other', 'withdraw'], 'Withdraw application leftover', 'waiting', entities)
  }

  if (/two\s*jamb|second\s*jamb|old\s*jamb\s*(and|&)\s*new|which\s*jamb\s*(number|i\s*go\s*use)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('jamb-verification', 0.86, ['jamb', 'other', 'two-jamb'], 'Two JAMB numbers leftover', 'applying', entities, true)
  }

  if (/portal\s*(down|no\s*load|not\s*loading|hang|freeze)|site\s*(no|not)\s*(open|load)|504|502|cannot\s*load\s*(the\s*)?(portal|page)|network\s*error/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'portal-down'], 'Portal down leftover', 'applying', entities, true)
  }

  if (/(final|last|400)\s*(year|level)|\b400l\b|i\s*(dey|am)\s*(final|last)\s*year|graduating\s*(this|dis)\s*(year|session)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'final-year'], 'Final year leftover', 'exploring', entities)
  }

  if (/nysc\s*exemption|exemption\s*certificate|i\s*no\s*(go|dey)\s*serve/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('repayment', 0.82, ['repayment', 'other', 'nysc-exemption'], 'NYSC exemption leftover', 'repaying', entities)
  }

  if (/school\s*(force|forced|compel|say\s*make\s*i)\s*apply|must\s*i\s*apply|compulsory\s*(loan|nelfund)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.82, ['how-to-apply', 'other', 'compulsory'], 'School forced apply leftover', 'preparing', entities)
  }

  if (/late\s*(school\s*)?registration|i\s*(late|never)\s*register\s*(for\s*)?(school|session)|school\s*registration\s*(no|not)\s*ready/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'late-reg'], 'Late school registration leftover', 'exploring', entities)
  }

  return null
}
