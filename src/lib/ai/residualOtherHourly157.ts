import type { IntentId, IntentResult } from './types'
import { residualOtherHourly156 } from './residualOtherHourly156'

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
 * Hourly 157 2026-09-24: hostel vs upkeep Pidgin, hanging portal,
 * mates/batch paid, ND/HND eligibility, double apply.
 */
export function residualOtherHourly157(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty residual 157', 'unknown', entities)

  try {
    const newer = residualOtherHourly156(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }

  if (/hostel|accommodation|accomodation|rent\s*(money|fee)|feeding\s*money/i.test(q)) {
    return hit('upkeep', 0.9, ['upkeep', 'hostel'], 'Hourly 157 hostel vs upkeep', 'exploring', entities)
  }

  if (/portal\s*(hang|hanging|blank|no\s*load|not\s*loading)|page\s*(no|not)\s*(open|load)|site\s*no\s*dey\s*open/i.test(q)) {
    return hit('portal-login', 0.9, ['login', 'hang'], 'Hourly 157 portal hanging', 'applying', entities, true)
  }

  if (/mates?\s*(don|have)\s*(collect|receive)|batch|dem\s*don\s*pay\s*(my\s*)?(school|mates)/i.test(q)) {
    return hit('pending-application', 0.9, ['pending', 'batch'], 'Hourly 157 mates/batch paid', 'waiting', entities, true)
  }

  if (/\bnd\b|\bhnd\b|higher\s*national|national\s*diploma/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'poly'], 'Hourly 157 ND/HND', 'exploring', entities)
  }

  if (/apply\s*(two|2|twice)|second\s*application|double\s*apply|two\s*accounts/i.test(q)) {
    return hit('reapplication', 0.88, ['reapply'], 'Hourly 157 double apply', 'applying', entities, true)
  }

  return null
}
