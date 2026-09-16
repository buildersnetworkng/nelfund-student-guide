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

/** 16 Sep 16:00 WAT hourly: admin topUnknownTopics.other still 324 lifetime. */
export function residualOtherHourly9(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/\basuu\b|school\s*(dey|is)\s*(on\s*)?strike|strike\s*(dey|now)|lecture\s*(no|not)\s*(dey|hold)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'strike'], 'ASUU / strike leftover', 'exploring', entities)
  }

  if (/(increase|raise|review)\s*(the\s*)?(upkeep|allowance|20\s*,?\s*000|20k)|20\s*,?\s*000\s*(too\s*)?(small|low)|upkeep\s*(too\s*)?(small|low)|dem\s*(go|will)\s*increase\s*(upkeep|20k)/i.test(q)) {
    return hit('upkeep', 0.86, ['upkeep', 'other', 'amount-review'], 'Upkeep increase leftover', 'exploring', entities)
  }

  if (/i\s*(dey|am)\s*(work|working)|working\s*student|i\s*(get|have)\s*(job|work)|employed\s*(student|while)|part[\s-]*time\s*job/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'working-student'], 'Working student leftover', 'exploring', entities)
  }

  if (/apply\s*from\s*(abroad|outside|uk|usa|canada|diaspora)|i\s*dey\s*(abroad|outside)|i\s*(be|am)\s*(in\s*)?(uk|usa|canada|abroad)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'diaspora'], 'Apply from abroad leftover', 'exploring', entities)
  }

  if (/my\s*(brother|sister|sibling)\s*(fit|can)\s*apply|two\s*(siblings|brothers|sisters)\s*apply|family\s*members?\s*apply/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.82, ['how-to-apply', 'other', 'sibling'], 'Sibling apply leftover', 'preparing', entities)
  }

  if (/disabled|disability|physically\s*challenged|special\s*need|wheelchair|blind\s*student/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'disability'], 'Disability leftover', 'exploring', entities)
  }

  if (/nelfund\s*(na|is)\s*(scam|fake)|is\s*nelfund\s*(a\s*)?(scam|fake)|una\s*dey\s*collect\s*money|pay\s*before\s*(apply|approval)/i.test(q)) {
    return hit('scam-safety', 0.9, ['scam', 'other'], 'Scam rumour leftover', 'exploring', entities)
  }

  if (/next\s*(application\s*)?(window|cycle|round)|when\s*(dem|they)\s*(go|will)\s*open\s*again|open\s*again/i.test(q)) {
    return hit('current-information', 0.86, ['open-status', 'other', 'next-window'], 'Next window leftover', 'exploring', entities)
  }

  if (/i\s*(get|have)\s*(a\s*)?(scholarship|bursary)|already\s*(on|get)\s*scholarship|combine\s*(loan|scholarship)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('loan-or-scholarship', 0.86, ['scholarship', 'other', 'combine'], 'Existing scholarship leftover', 'exploring', entities)
  }

  if (/how\s*many\s*times\s*(can\s*i|i\s*(fit|can))\s*apply|apply\s*(every|each)\s*(session|year)|one\s*session\s*one\s*loan/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('reapplication', 0.84, ['how-to-apply', 'other', 'how-many-times'], 'How many times leftover', 'preparing', entities)
  }

  return null
}
