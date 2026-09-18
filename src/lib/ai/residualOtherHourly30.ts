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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s+(window|application)\s+(open|closed)/i.test(
    q,
  )
}

/** 18 Sep 09:10 WAT: unknownAi 438, other 324, pending-status 70, jamb 40, open-status 26. */
export function residualOtherHourly30(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null

  if (
    /name\s*(no|not|never)\s*(match|gree|correct)|date\s*of\s*birth\s*(wrong|no\s*match|mismatch)|dob\s*(wrong|mismatch)|profile\s*(incomplete|no\s*complete)|bio[\s-]*data\s*(wrong|no\s*match)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.88,
      ['missing-info', 'other'],
      'Name / DOB / profile mismatch leftover',
      'applying',
      entities,
      true,
    )
  }

  if (
    /portal\s*(no|not|never)\s*(dey\s*)?(work|load|open)|nelfund\s*(no|not)\s*(dey\s*)?work|site\s*(hang|down|blank)|error\s*(500|502|503|404)|keep\s*(refresh|loading)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.86, ['login', 'other'], 'Portal down / hang leftover', 'applying', entities, true)
  }

  if (
    /\b(nd|hnd|nce)\b.{0,20}(apply|eligib|fit)|can\s*(nd|hnd|nce|poly|polytechnic|college)\s*(student)?\s*(apply|fit)|100\s*level|fresher|fresh\s*student|direct\s*entry\s*(fit|apply)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.86, ['eligibility', 'other'], 'ND/HND/NCE/100L leftover', 'exploring', entities)
  }

  if (
    /check\s*am|look\s*(this|dis)\s*(matter|one|screenshot|picture)|see\s*(the\s*)?(picture|screenshot|photo)|wetin\s*(i\s*)?go\s*do\s*now|una\s*no\s*dey\s*reply|look\s*my\s*(own|matter)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.78,
      ['pending-status', 'other'],
      'Check am / screenshot leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /change\s*(my\s*)?(school|institution)|transfer\s*student|i\s*(don|have)\s*change\s*school|new\s*school\s*(no|not)\s*(show|dey)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.84, ['school-list', 'other'], 'Change school leftover', 'applying', entities, true)
  }

  if (
    /i\s*(just\s*)?wan(t)?\s*(to\s*)?(know|see)\s*if\s*i\s*(qualify|fit)|do\s*i\s*qualify|i\s*fit\s*apply\s*(abi|or\s*not)|who\s*qualify/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Do I qualify leftover', 'exploring', entities)
  }

  if (/when\s*(dem|they|una)\s*(go|will)\s*(start\s*)?(pay|credit|send)\s*(the\s*)?(money|upkeep|loan)/i.test(q)) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other'],
      'When will they pay leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/upload(ed)?\s*(my\s*)?(document|paper|file).{0,24}(still|yet).{0,16}(missing|pending|error)/i.test(q)) {
    return hit(
      'missing-information',
      0.86,
      ['missing-info', 'other'],
      'Uploaded still missing leftover',
      'applying',
      entities,
      true,
    )
  }

  return null
}
