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
 * Hour-57 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Residual other still swallowing NIN/BVN, matric, poly/ND, interest, unofficial chat apps.
 */
export function residualOtherHourly57(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /nin\s*(no|not|never|invalid|fail|reject|wahala)|bvn\s*(no|not|never|invalid|fail|reject|wahala)|nin.{0,20}(no|not)\s*(match|gree|verify)|bvn.{0,20}(no|not)\s*(match|gree|verify)|verify\s*(my\s*)?(nin|bvn)|nin\s*(and|&)\s*bvn/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.93, ['missing', 'other'], 'NIN / BVN leftover 57', 'applying', entities, true)
  }

  if (
    /matric(ulation)?\s*(no|number|num)?\s*(no|not|never|yet)|i\s*(no|not)\s*get\s*matric|no\s*matric|matric\s*(wahala|issue|problem)|upload\s*matric/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.92, ['missing', 'other'], 'Matric leftover 57', 'applying', entities, true)
  }

  if (
    /name\s*(no|not|never)\s*(dey|on)\s*(the\s*)?(list|pay\s*list)|not\s*on\s*(the\s*)?list|institution\s*(verification|verify)|school\s*(never|no)\s*verify|record\s*(no|not)\s*(dey|show|upload)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.92,
      ['missing', 'other'],
      'Not on list / institution verify leftover 57',
      'applying',
      entities,
      true,
    )
  }

  if (
    /\b(nd|hnd|nce|poly|polytechnic|college\s*of\s*education)\b.{0,24}(apply|eligible|fit)|can\s*(poly|nd|hnd|nce)\s*(student)?s?\s*(apply|fit)|i\s*dey\s*(poly|nd|hnd)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Poly / ND / HND leftover 57', 'exploring', entities)
  }

  if (
    /interest(\s*rate)?|how\s*(many|long).{0,16}(repay|pay\s*back)|when\s*(i|to)\s*(start\s*)?repay|after\s*(school|nysc).{0,16}pay|is\s*(it|nelfund)\s*(free|interest)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Interest / how long repay leftover 57', 'repaying', entities)
  }

  if (
    /whats?app|telegram|instagram\s*(page|handle)|official\s*(group|page)|nelfund\s*(group|whatsapp|telegram)/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other'], 'Unofficial chat leftover 57', 'exploring', entities)
  }

  if (
    /i\s*wan(t)?\s*(to\s*)?(register|create\s*account|sign\s*up)|how\s*(i\s*)?go\s*(register|open\s*account)|start\s*(my\s*)?(registration|account)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['how-to-apply', 'other'], 'Want register leftover 57', 'preparing', entities)
  }

  if (
    /account\s*creation\s*(open|close)|sign\s*up\s*(still\s*)?(open|dey)|loan\s*(and|&)?\s*upkeep\s*(open|close|confirm)|dem\s*don\s*open\s*(loan|upkeep)|upkeep\s*don\s*(open|start)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'other'], 'Account vs loan window leftover 57', 'exploring', entities)
  }

  if (
    /alert\s*(never|no|not)\s*(come|enter|drop)|my\s*own\s*never\s*(enter|drop|show)|money\s*no\s*dey\s*(enter|show)|payout\s*(never|no)\s*(show|enter)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Alert never come leftover 57',
      'waiting',
      entities,
      true,
    )
  }

  if (/change\s*(my\s*)?(phone|number|email)|update\s*(my\s*)?(phone|email|profile)/i.test(q)) {
    return hit('portal-login', 0.88, ['login', 'other'], 'Change phone/email leftover 57', 'applying', entities, true)
  }

  return null
}
