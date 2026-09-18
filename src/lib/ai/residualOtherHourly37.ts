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

/**
 * Hour-37 leftover catcher: lifetime other=324, pending-status=70, jamb=40.
 * Screenshot-only dumps, matric, hostel, others-paid-me-not, admission-not-yet,
 * email-used-last-year leftovers, course not listed.
 */
export function residualOtherHourly37(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|nelfund\s*(na\s*)?wetin|why\s*(una|dem)\s*(create|form)\s*(nelfund|am)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Purpose leftover 37', 'exploring', entities)
  }

  if (
    /matric\s*(no|number|num)|admission\s*(no|not)\s*(yet|ready)|i\s*(never|no)\s*(get|collect)\s*admission|fresh\s*(student|man)|i\s*just\s*(gain|got)\s*admission/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.86, ['other', 'admission'], 'Admission / matric leftover 37', 'preparing', entities)
  }

  if (
    /hostel|accommodation\s*(loan|money)|feeding\s*(money|loan)|transport\s*(money|loan)/i.test(q) &&
    !/pending|how\s*far|never\s*enter/i.test(q)
  ) {
    return hit('upkeep', 0.86, ['other', 'upkeep'], 'Hostel / feeding leftover 37', 'exploring', entities)
  }

  if (
    /course\s*(no|not)\s*(on\s*)?(the\s*)?(list|showing)|programme\s*(no|not)\s*(show|on\s*list)|department\s*(no|not)\s*(show|on\s*list)|faculty\s*(no|not)\s*(show|on\s*list)/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.88, ['other', 'missing-info'], 'Course / faculty not listed leftover 37', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|registered\s*(last|this)\s*year|account\s*(already|don)\s*(dey|exist)|use\s*(the\s*)?same\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['login', 'other'], 'Email already used leftover 37', 'applying', entities, true)
  }

  if (
    /dem\s*don\s*pay\s*(others|my\s*mates|everybody)|others\s*(don|have)\s*(collect|receive)|my\s*mates\s*(don|have)\s*(collect|receive)|class\s*(don|have)\s*collect|una\s*pay\s*(my\s*)?friends/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.9, ['pending-status', 'other'], 'Others paid leftover 37', 'waiting', entities, true)
  }

  if (
    /i\s*(send|don\s*send|drop)\s*(screenshot|pic|picture|photo|image)|look\s*(this|dis)\s*(screenshot|pic)|see\s*(my\s*)?(screenshot|dashboard)|i\s*snap/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.84, ['pending-status', 'other'], 'Screenshot dump leftover 37', 'waiting', entities, true)
  }

  if (
    /help\s*me\s*(abeg|please)|abeg\s*help|i\s*need\s*help|wetin\s*i\s*go\s*do\s*now/i.test(q) &&
    /pending|money|loan|apply|portal|jamb|school/i.test(q)
  ) {
    if (/jamb/i.test(q)) return hit('jamb-verification', 0.86, ['jamb', 'other'], 'Help + JAMB leftover 37', 'applying', entities, true)
    if (/pending|money|how\s*far/i.test(q))
      return hit('pending-application', 0.86, ['pending-status', 'other'], 'Help + pending leftover 37', 'waiting', entities, true)
    if (/school\s*(no|not)\s*(show|list)/i.test(q))
      return hit('school-not-found', 0.86, ['school', 'other'], 'Help + school leftover 37', 'applying', entities, true)
  }

  if (
    /jamb\s*(caps|reg|registration)\s*(no|not|invalid)|utme\s*(no|not)\s*(correct|valid)|wrong\s*jamb|jamb\s*wahala|my\s*jamb\s*(no|not)\s*(work|gree)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.9, ['jamb', 'other'], 'JAMB leftover 37', 'applying', entities, true)
  }

  if (
    /vocational|innovation\s*enterprise|iet|nce\s*part|degree\s*holder\s*apply|hnd\s*holder/i.test(q)
  ) {
    return hit('eligibility', 0.86, ['other', 'eligibility'], 'Programme type leftover 37', 'exploring', entities)
  }

  return null
}
