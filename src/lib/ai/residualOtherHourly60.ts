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
 * Hour-60 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Target: pending wait variants, JAMB fail variants, is-it-open shorthand, empty/vague.
 */
export function residualOtherHourly60(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /still\s*(dey|on)\s*pending|pending\s*(since|for)\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d)|no\s*(pay|payment)\s*yet|dem\s*never\s*pay|una\s*never\s*pay|i\s*never\s*(collect|receive|see)\s*(upkeep|money|alert)|when\s*(go|will)\s*(my\s*)?(own|money|upkeep)\s*(enter|drop|come)|status\s*(still\s*)?(pending|same)|nothing\s*has\s*(changed|moved)|application\s*stuck|loan\s*stuck/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'other'], 'Pending wait leftover 60', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(no|not|never)\s*(work|gree|verify|accept)|portal\s*(say|says)\s*invalid\s*jamb|wrong\s*jamb|jamb\s*wahala|utme\s*(number\s*)?(no|not)\s*(work|gree)|cannot\s*verify\s*jamb|jamb\s*verification\s*(fail|failed|error)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB fail leftover 60', 'applying', entities, true)
  }

  if (
    /^(is\s*(it|nelfund|loan|portal)\s*(open|close|closed)\??)$|dem\s*open\s*(am|loan|upkeep)\s*(yet)?|una\s*open\s*(am|loan)\s*(yet)?|loan\s*window\s*(open|close)|when\s*is\s*(the\s*)?(deadline|closing)|has\s*(nelfund|loan)\s*(opened|started)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'other'], 'Open-status leftover 60', 'exploring', entities)
  }

  if (
    /wetin\s*be\s*(nelfund|dis|this)|na\s*wetin\s*nelfund|explain\s*nelfund\s*(to\s*me)?|tell\s*me\s*about\s*(the\s*)?loan/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Purpose leftover 60', 'exploring', entities)
  }

  if (/^\s*(hi+|hello|hey+|abeg|pls|please)\s*(help)?\s*$/i.test(q)) {
    return hit('official-sources', 0.55, ['greeting-vague', 'empty', 'other'], 'Greeting leftover 60', 'exploring', entities)
  }

  return null
}
