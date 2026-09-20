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
 * Hour-58 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Target leftover other: level/year, loan amount, hostel, apply button, no-JAMB, portal submit fail.
 */
export function residualOtherHourly58(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /(100|200|300|400|500)\s*(l|level|lvl)|i\s*(dey|am)\s*(in\s*)?(year|level)\s*(one|two|three|four|1|2|3|4)|fresh(er|man)?\s*(fit|can|eligible)|final\s*year\s*(fit|can|apply)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Level / year leftover 58', 'exploring', entities)
  }

  if (
    /how\s*much.{0,20}(dem|they|una|nelfund|loan|give|pay)|wetin\s*(dem|they)\s*(go\s*)?(give|pay)|loan\s*amount|maximum\s*(loan|amount)|cap\s*(of\s*)?(the\s*)?loan/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'How much loan leftover 58', 'exploring', entities)
  }

  if (/hostel|accommodation|school\s*housing|lodge\s*money/i.test(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'other'], 'Hostel leftover 58', 'exploring', entities)
  }

  if (
    /(apply|request)\s*(button|btn)\s*(no|not|never|grey|gray|dey)|i\s*(no|not)\s*see\s*(apply|request)|request\s*for\s*student\s*loan.{0,20}(grey|gray|disabled|no\s*dey)|cannot\s*submit|submit\s*(button\s*)?(no|not|never)\s*(work|gree|click)|portal\s*(no|not|never)\s*(load|open|gree)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['how-to-apply', 'other'], 'Apply button / submit leftover 58', 'applying', entities, true)
  }

  if (
    /(no|without|never\s*get)\s*jamb|i\s*(no|not)\s*get\s*jamb|apply\s*without\s*jamb|jamb\s*(no|not)\s*dey/i.test(q) &&
    !/invalid\s*jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.9, ['jamb', 'other'], 'No JAMB leftover 58', 'applying', entities, true)
  }

  if (/session\s*registration|i\s*don\s*register\s*(for\s*)?(this\s*)?session|register\s*session/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'other'], 'Session registration leftover 58', 'waiting', entities, true)
  }

  if (/foreign\s*student|international\s*student|i\s*no\s*be\s*nigerian|not\s*a\s*nigerian/i.test(q)) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Foreign student leftover 58', 'exploring', entities)
  }

  if (/vocational|skills\s*acquisition|nbtvet|innovation\s*enterprise/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'Vocational leftover 58', 'exploring', entities)
  }

  if (/i\s*don\s*graduate|i\s*don\s*finish\s*school|after\s*i\s*graduate.{0,12}apply/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'Already graduated leftover 58', 'exploring', entities)
  }

  return null
}
