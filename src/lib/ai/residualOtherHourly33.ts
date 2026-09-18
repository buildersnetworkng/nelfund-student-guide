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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*(window|application)\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hour-33 leftover catcher for admin topic `other` (largest unknown bucket).
 * Maps Pidgin / short student phrasing that still missed earlier hourly files.
 */
export function residualOtherHourly33(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(dis|this|nelfund)|why\s*(dem|they)\s*(create|start|bring)\s*nelfund|purpose\s*of\s*(the\s*)?(loan|nelfund)|nelfund\s*(na|is)\s*(wetin|what)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Purpose / wetin be leftover', 'exploring', entities)
  }

  if (liveish(q) || /apply\s*now\s*(post|poster|flyer)|instagram\s*(say|said)\s*apply|dem\s*say\s*apply\s*now/i.test(q)) {
    return hit('current-information', 0.88, ['open-status', 'other'], 'Apply-now rumour leftover', 'applying', entities)
  }

  if (
    /otp\s*(no|not|never)|password\s*(forget|lost|reset)|i\s*no\s*fit\s*(login|enter)|portal\s*(no|not)\s*(dey\s*)?(open|load)|cannot\s*sign\s*in/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.86, ['login', 'other'], 'OTP / password / cannot login leftover', 'applying', entities, true)
  }

  if (
    /name\s*(no|not|never)\s*match|dob\s*(no|not)\s*match|date\s*of\s*birth\s*(wrong|mismatch)|nin\s*(and|vs)\s*jamb|bvn\s*(no|not)\s*match/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.86,
      ['missing-info', 'other'],
      'Name / DOB / NIN mismatch leftover',
      'applying',
      entities,
      true,
    )
  }

  if (
    /can\s*i\s*apply\s*without\s*jamb|no\s*jamb\s*(number|reg)|hnd\s*(student|i\s*be)|nd\s*1\b|100\s*level|fresh(er)?\s*student|returning\s*student/i.test(
      q,
    ) &&
    !/pending|how\s*far/.test(q)
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Level / no-JAMB leftover', 'exploring', entities)
  }

  if (
    /i\s*(don|have)\s*graduate|after\s*nysc|when\s*(do|to)\s*(i\s*)?pay\s*(back|am)|repay(ment)?\s*(start|begin)|interest\s*(rate|free)|how\s*(to|do\s*i)\s*pay\s*back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.86, ['repayment', 'other'], 'When to repay leftover', 'repaying', entities)
  }

  if (
    /i\s*(need|wan|want)\s*(dis\s*)?(loan|money)\s*(for\s*)?(school|fees)|help\s*me\s*(apply|get)\s*(the\s*)?loan|how\s*i\s*(go|fit)\s*apply/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.82, ['how-to-apply', 'other'], 'I want the loan leftover', 'applying', entities)
  }

  if (
    /my\s*school\s*(na|is)\s*(federal|state|poly)|polytechnic\s*(fit|can)\s*apply|coe\s*(fit|can)\s*apply|college\s*of\s*education/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'School type leftover', 'exploring', entities)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?list|my\s*school\s*(no|not)\s*show|institution\s*missing\s*for\s*portal/i.test(q)
  ) {
    return hit('school-not-found', 0.88, ['school-list', 'other'], 'School no dey list leftover', 'applying', entities, true)
  }

  if (
    /nelfund\s*(na|is)\s*(scam|legit)|is\s*(this|dis)\s*(page|site|loan)\s*(scam|real)|una\s*dey\s*collect\s*money/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.86, ['official-sources', 'other'], 'Is it legit leftover', 'exploring', entities)
  }

  if (
    /when\s*(dem|they)\s*(go|will)\s*pay|batch\s*(list|payment)|who\s*dem\s*pay|people\s*(don|have)\s*collect/i.test(q) &&
    !liveish(q)
  ) {
    return hit(
      'pending-application',
      0.84,
      ['pending-status', 'other'],
      'When dem go pay leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /account\s*(don|has)\s*(create|created)|i\s*don\s*sign\s*up\s*wetin\s*next|what\s*next\s*after\s*(account|profile|bvn)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other'], 'Account created what next leftover', 'applying', entities)
  }

  if (
    /change\s*of\s*course|i\s*change\s*(school|course)|transfer\s*(student|to)\s*(another|new)\s*school/i.test(q)
  ) {
    return hit(
      'missing-information',
      0.82,
      ['missing-info', 'other'],
      'Change of course leftover',
      'applying',
      entities,
      true,
    )
  }

  if (/masters?\s*(student|degree)|phd\s*student|post\s*graduate\s*(loan|apply)/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Postgraduate leftover', 'exploring', entities)
  }

  return null
}
