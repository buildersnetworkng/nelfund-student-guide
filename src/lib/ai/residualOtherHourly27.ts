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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(
    q,
  )
}

/** 18 Sep 06:07 WAT: other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly27(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /how\s*much\s*(is\s*)?(the\s*)?(upkeep|stipend|allowance)|upkeep\s*(amount|figure|how\s*much)|stipend\s*(na|is)\s*how\s*much|wetin\s*(be\s*)?(the\s*)?(upkeep|stipend)\s*(amount)?/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.9, ['upkeep', 'other'], 'How much upkeep leftover', 'exploring', entities)
  }

  if (
    /part[\s-]*time|sandwich\s*(student|programme)|post\s*graduate|postgraduate|masters?\s*(student|degree)|phd\s*student|private\s*(uni|university|poly|school)|who\s*(fit|can)\s*apply|nd\s*(or|and)\s*hnd|nce\s*student|vocational\s*(school|student)/i.test(
      q,
    )
  ) {
    return hit(
      'eligibility',
      0.88,
      ['eligibility', 'other'],
      'Who can apply leftover (mode / school type)',
      'exploring',
      entities,
    )
  }

  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|i\s*(don|have)\s*pay\s*(the\s*)?(school\s*)?fee|self[\s-]*pay|paid\s*from\s*pocket|refund\s*(my\s*)?(fee|money)/i.test(q)) {
    return hit('refund', 0.88, ['refund', 'other'], 'Already paid fees leftover', 'waiting', entities, true)
  }

  if (/change\s*(my\s*)?(bank|account\s*number)|wrong\s*bank|update\s*(my\s*)?account\s*number|wallet\s*(no|not)\s*(work|accept)/i.test(q)) {
    return hit('bank-information', 0.88, ['bank', 'other'], 'Change bank leftover', 'applying', entities, true)
  }

  if (/jamb\s*caps|direct\s*entry|\bde\s*(student|number)|utme\s*(reg|number)\s*(no|not|invalid)/i.test(q)) {
    return hit('jamb-verification', 0.88, ['jamb', 'other'], 'JAMB CAPS / DE leftover', 'applying', entities, true)
  }

  if (/apply\s*(again|last\s*year)|i\s*apply\s*last\s*(year|session)|old\s*account\s*(still|dey)|use\s*(the\s*)?same\s*email/i.test(q)) {
    return hit(
      'portal-login',
      0.86,
      ['login', 'other', 'returning'],
      'Returning applicant leftover',
      'applying',
      entities,
      true,
    )
  }

  if (/screenshot|see\s*(this|dis)\s*(pic|photo|image)|i\s*send\s*(pic|photo)/i.test(q) && /pending|review|approv|declin|invalid|status/.test(low)) {
    return hit('pending-application', 0.84, ['pending-status', 'other'], 'Screenshot with status leftover', 'waiting', entities, true)
  }

  if (/una\s*no\s*pay\s*me|dem\s*no\s*pay\s*me|nobody\s*pay\s*me|i\s*never\s*collect/i.test(q)) {
    return hit('pending-application', 0.87, ['pending-status', 'other'], 'Nobody pay me leftover', 'waiting', entities, true)
  }

  return null
}
