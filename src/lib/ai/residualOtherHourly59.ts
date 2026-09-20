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
 * Hour-59 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Target leftover other + pending: money never enter, mates paid, email used, school list, NIN/BVN, part-time.
 */
export function residualOtherHourly59(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /money\s*(never|no|not)\s*(enter|drop|show|reach)|never\s*(see|get)\s*(alert|credit|money)|no\s*(credit\s*)?alert|account\s*(never|no)\s*(credit|alert)|mates?\s*(don|have)\s*(collect|receive|collect\s*theirs)|dem\s*don\s*pay\s*(my\s*)?(school|mates)|una\s*don\s*pay\s*(my\s*)?school|how\s*far\s*(my\s*)?(money|upkeep|loan|own)|wetin\s*dey\s*happen\s*(to\s*)?(my\s*)?(money|loan|upkeep)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status', 'other'], 'Money never enter leftover 59', 'waiting', entities, true)
  }

  if (
    /email\s*(already|don|has)\s*(been\s*)?(used|register|exist)|already\s*(used|registered)\s*(this\s*)?email|account\s*already\s*(exist|dey)|i\s*(don|already)\s*(register|create).{0,20}last\s*year|registered\s*last\s*year/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['portal-login', 'other'], 'Email already used leftover 59', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(show|dey|appear)|my\s*school\s*(is\s*)?(not|no)\s*(on\s*)?(the\s*)?list|institution\s*(not|no)\s*(found|showing)|cannot\s*find\s*(my\s*)?school|school\s*name\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list', 'other'], 'School not showing leftover 59', 'applying', entities, true)
  }

  if (
    /(nin|bvn)\s*(no|not|never)\s*(match|gree|verify|work)|invalid\s*(nin|bvn)|nin.{0,12}(mismatch|doesn'?t\s*match)|bvn.{0,12}(mismatch|doesn'?t\s*match)/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.9, ['missing-info', 'other'], 'NIN/BVN mismatch leftover 59', 'applying', entities, true)
  }

  if (/part[-\s]*time|sandwich\s*(student|programme|program)|weekend\s*programme|distance\s*learning\s*(student)?/i.test(q)) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Part-time leftover 59', 'exploring', entities)
  }

  if (
    /i\s*don\s*(already\s*)?pay\s*(my\s*)?(school\s*)?fees|already\s*paid\s*(school\s*)?fees|bursary\s*(don|has)\s*collect/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.88, ['how-to-apply', 'other'], 'Already paid fees leftover 59', 'applying', entities, true)
  }

  if (
    /dashboard|pending\s*loans|approved\s*loans|total\s*loans|welcome\s*to\s*student\s*loan/i.test(q) &&
    q.length > 50
  ) {
    return hit('pending-application', 0.86, ['pending-status', 'other'], 'Dashboard dump leftover 59', 'waiting', entities, true)
  }

  if (
    /^(abeg|please|pls)\s*(help|assist)|help\s*me\s*(abeg|now)|i\s*need\s*help\s*(with\s*)?(nelfund|loan|portal)?$/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.72, ['other', 'greeting-vague'], 'Vague help leftover 59', 'exploring', entities)
  }

  return null
}
