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

/** 17 Sep 12:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly22(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/how\s*much(\s*(na|is|be|dem|they))?(\s*(the\s*)?(loan|upkeep|allowance|money|nelfund))?|wetin\s*(dem|they)\s*dey\s*pay|interest\s*rate|is\s*it\s*interest\s*free|\b20,?000\b|\b25,?000\b/i.test(q) && !/pending|how\s*far|never\s*enter/.test(low)) {
    if (/upkeep|allowance|20,?000|25,?000/.test(low)) {
      return hit('upkeep', 0.86, ['upkeep', 'other', 'amount'], 'How much upkeep leftover', 'exploring', entities)
    }
    return hit('school-fees', 0.8, ['fees', 'other', 'amount'], 'How much loan leftover', 'exploring', entities)
  }

  if (/hostel|accommodation|school\s*housing|rent\s*(for\s*)?(hostel|lodge)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.84, ['upkeep', 'other', 'hostel'], 'Hostel / rent leftover', 'exploring', entities)
  }

  if (/\bpoly(technic)?\b|\bnce\b|college\s*of\s*education|\bcoe\b|vocational|monotechnic/i.test(q) && !/pending|how\s*far|list/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'poly-coe'], 'Poly / COE leftover', 'exploring', entities)
  }

  if (/(100|200|300|400|500)\s*level|fresher|freshman|100l|i\s*just\s*(gain|got)\s*admission|newly\s*admitted/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'level'], 'Level / fresher leftover', 'exploring', entities)
  }

  if (/international\s*student|foreign\s*student|i\s*no\s*be\s*nigerian|non[\s-]*nigerian/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other', 'nationality'], 'Nationality leftover', 'exploring', entities)
  }

  if (/change\s*of\s*course|i\s*change\s*(my\s*)?course|new\s*department|transfer\s*(student|to\s*another)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.84, ['missing', 'other', 'course-change'], 'Course change leftover', 'applying', entities, true)
  }

  if (/institution\s*(verification|verify).{0,20}(long|slow|pending|taking)|school\s*(never|no|not)\s*(verify|confirm)|waiting\s*for\s*(my\s*)?school\s*to\s*(upload|verify)/i.test(q)) {
    return hit('institution-verification', 0.88, ['missing', 'other', 'school-verify'], 'School verification wait leftover', 'waiting', entities, true)
  }

  if (/next\s*of\s*kin|parent\s*(consent|sign|guarantee)|guardian\s*(form|details)/i.test(q)) {
    return hit('guarantor', 0.84, ['other', 'nok'], 'Next of kin leftover', 'preparing', entities)
  }

  if (/agent|pay\s*(them|am|person)\s*to\s*(process|apply)|middle\s*man|whatsapp\s*(group|link).{0,12}(pay|fee)/i.test(q)) {
    return hit('scam-safety', 0.9, ['other', 'scam'], 'Agent / pay-to-process leftover', 'exploring', entities, true)
  }

  if (/successful.{0,20}(but|no|never|not).{0,16}(money|alert|upkeep|pay)|approved.{0,16}(but|no|never).{0,12}(enter|drop)/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'other'], 'Approved but no money leftover', 'waiting', entities, true)
  }

  if (/first\s*(payment|pay|upkeep)|when\s*(i\s*)?(go|will)\s*see\s*(the\s*)?(first\s*)?(alert|money)/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'first-pay'], 'First payment leftover', 'waiting', entities, true)
  }

  if (/nd\s*(1|2|i|ii)|hnd\s*(1|2|i|ii)|conversion\s*programme|top[\s-]*up/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'nd-hnd'], 'ND/HND leftover', 'exploring', entities)
  }

  if (/pwd|disability|physically\s*challenged|special\s*need/i.test(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'pwd'], 'Disability leftover', 'exploring', entities)
  }

  return null
}
