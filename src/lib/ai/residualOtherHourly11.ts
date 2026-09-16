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

/** 16 Sep 20:00 WAT hourly: topUnknownTopics.other 324, pending-status 70. */
export function residualOtherHourly11(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/wrong\s*(bank|account)|account\s*(number\s*)?(wrong|incorrect)|i\s*(put|enter)\s*wrong\s*(account|bank)|change\s*(my\s*)?(bank|account)\s*(number|details)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'bank-change'], 'Wrong bank leftover', 'applying', entities, true)
  }

  if (/opal|opay|moniepoint|palmpay|wallet\s*(account|only)|fintech\s*account/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.84, ['profile', 'other', 'wallet'], 'Wallet bank leftover', 'applying', entities, true)
  }

  if (/transfer\s*(student|from)|i\s*(dey|am)\s*(a\s*)?transfer|inter[\s-]*university\s*transfer|i\s*change\s*school/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'transfer'], 'Transfer student leftover', 'exploring', entities)
  }

  if (/\bhnd\b|higher\s*national|nd\s*(to|and)\s*hnd|ordinary\s*national|national\s*diploma/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'hnd'], 'HND/ND leftover', 'exploring', entities)
  }

  if (/evening\s*(programme|program|student)|weekend\s*(programme|program|class)|part[\s-]*time\s*(class|student)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'part-time'], 'Evening/weekend leftover', 'exploring', entities)
  }

  if (/hostel|accommodation\s*fee|bed\s*space|school\s*hostel/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('school-fees', 0.8, ['fees', 'other', 'hostel'], 'Hostel fee leftover', 'exploring', entities)
  }

  if (/change\s*(of\s*)?course|i\s*(change|wan\s*change)\s*(my\s*)?course|new\s*department/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.82, ['profile', 'other', 'course-change'], 'Course change leftover', 'applying', entities, true)
  }

  if (/screenshot|i\s*(send|don\s*send)\s*(pic|picture|photo|image)|see\s*(the\s*)?(pic|photo|image)|look\s*(this|dis)\s*(pic|photo)/i.test(q)) {
    return hit('pending-application', 0.72, ['pending-status', 'other', 'screenshot'], 'Screenshot leftover', 'waiting', entities, true)
  }

  if (/una\s*don\s*pay\s*(my\s*)?school|dem\s*don\s*pay\s*(the\s*)?school|school\s*fees?\s*(don|has)\s*(enter|pay|paid)/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'school-paid'], 'School already paid leftover', 'waiting', entities, true)
  }

  if (/second\s*(degree|bachelor)|i\s*(dey|am)\s*(doing|reading)\s*(another|second)\s*(degree|course)|already\s*(get|got|have)\s*(bsc|degree)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'second-degree'], 'Second degree leftover', 'exploring', entities)
  }

  if (/foreign\s*(student|university)|i\s*(dey|am)\s*abroad|study\s*abroad|overseas\s*(uni|school)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'abroad'], 'Abroad leftover', 'exploring', entities)
  }

  if (/college\s*of\s*education|\bcoe\b|nce\s*student|i\s*(dey|am)\s*(doing|reading)\s*nce/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'nce'], 'NCE/COE leftover', 'exploring', entities)
  }

  if (/appeal|i\s*wan\s*appeal|contest\s*(the\s*)?(decision|decline)|review\s*(my\s*)?(decline|rejection)/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'other', 'appeal'], 'Appeal leftover', 'waiting', entities, true)
  }

  return null
}
