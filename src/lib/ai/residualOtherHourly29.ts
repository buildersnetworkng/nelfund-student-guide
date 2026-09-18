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

/** 18 Sep 08:06 WAT: unknownAi 438, other 324, pending-status 70, jamb 40, repayment 16. */
export function residualOtherHourly29(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null

  if (
    /when\s*(i|we|una)\s*(go|will|dey)\s*(start\s*)?(pay|repay)|how\s*(much|many)\s*(i\s*)?(go|will)\s*(pay|repay)|repay(ment)?\s*(start|begin|plan)|after\s*(nysc|service|graduation).{0,24}(pay|repay)|gsi\s*(mandate|deduct)|salary\s*(deduct|cut)|life\s*jail|loan\s*(interest|percentage)|when\s*repayment/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.88, ['repayment', 'other'], 'Repayment leftover', 'repaying', entities)
  }

  if (
    /private\s*(uni|university|poly|school)|part[\s-]*time|distance\s*learn|masters?\s*(student|degree)|phd|postgraduate|200\s*level|direct\s*entry|i\s*(no|not)\s*(be|dey)\s*(federal|state)|eligib/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.86, ['eligibility', 'other'], 'Eligibility leftover', 'exploring', entities)
  }

  if (
    /\bbvn\b.{0,24}(invalid|wrong|fail|no\s*gree|not\s*match|wahala)|invalid\s*bvn|bvn\s*(no|not|never)\s*(match|work)|nin\s*(invalid|wrong|fail|no\s*gree)|invalid\s*nin/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.88, ['missing-info', 'other'], 'BVN / NIN leftover', 'applying', entities, true)
  }

  if (
    /how\s*much\s*(be\s*)?(upkeep|stipend|allowance)|upkeep\s*(how\s*much|amount|figure)|monthly\s*(upkeep|stipend)|na\s*how\s*much\s*upkeep/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.88, ['upkeep', 'other'], 'Upkeep amount leftover', 'exploring', entities)
  }

  if (
    /na\s*(scholarship|grant)|loan\s*or\s*(scholarship|grant)|e\s*be\s*free\s*money|una\s*(go|dey)\s*give\s*(free|grant)/i.test(
      q,
    )
  ) {
    return hit('loan-or-scholarship', 0.88, ['scholarship', 'other'], 'Loan vs scholarship leftover', 'exploring', entities)
  }

  if (
    /wetin\s*(remain|left)|any\s*hope|hope\s*dey|i\s*don\s*tire|una\s*forget\s*me|nobody\s*remember|my\s*own\s*(never|no)\s*(come|enter)|since\s*\d+\s*(month|week|day)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other'],
      'Tired wait leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /help\s*me\s*(abeg|apply|check|fix)|abeg\s*(help|assist)|i\s*need\s*help|assist\s*me|una\s*fit\s*help/i.test(q) &&
    /loan|nelfund|portal|apply|status|pending|jamb|school/i.test(q)
  ) {
    return hit('how-to-apply', 0.72, ['apply', 'other'], 'Help me apply leftover', 'applying', entities)
  }

  if (/^(abeg|please\s*help|help|assist|una\s*dey|you\s*dey)[.!? ]*$/i.test(q)) {
    return hit('official-sources', 0.55, ['greeting-vague', 'other'], 'Bare help leftover', 'exploring', entities)
  }

  if (/nelfund\s*(na\s*)?(real|scam|fake)|una\s*(na\s*)?scam|agent\s*(fee|pay)|pay\s*(agent|middleman)/i.test(q)) {
    return hit('scam-safety', 0.9, ['scam', 'other'], 'Scam / is it real leftover', 'exploring', entities, true)
  }

  if (/forgot\s*(my\s*)?(mail|email|password)|otp\s*(no|not|never)\s*(come|enter|dey)|cannot\s*sign\s*in|i\s*no\s*fit\s*login/i.test(q)) {
    return hit('portal-login', 0.88, ['login', 'other'], 'OTP / login leftover', 'applying', entities, true)
  }

  return null
}
