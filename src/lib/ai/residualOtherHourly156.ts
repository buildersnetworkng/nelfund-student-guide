import type { IntentId, IntentResult } from './types'
import { residualOtherHourly155 } from './residualOtherHourly155'

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
 * Hourly 156 2026-09-24: digital bank stall, no matric yet,
 * GSI / collect-from-account Pidgin, apply+upkeep follow-up.
 */
export function residualOtherHourly156(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty residual 156', 'unknown', entities)

  try {
    const newer = residualOtherHourly155(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }

  if (/whatsapp\s*(man|guy|agent)|pay\s*\d+\s*k|make\s*i\s*pay/i.test(q)) {
    return hit('scam-safety', 0.95, ['scam'], 'Hourly 156 agent pay scam', 'applying', entities, true)
  }

  if (/official\s*email|email\s*of\s*nelfund|how\s*(i|to)\s*(go\s*)?contact/i.test(q)) {
    return hit('contact-support', 0.92, ['contact'], 'Hourly 156 official email / contact', 'applying', entities)
  }

  if (/draft\s*email/i.test(q)) {
    return hit('email-draft', 0.92, ['email-draft'], 'Hourly 156 draft email', 'applying', entities)
  }

  if (/(meant|i\s*mean|also).*(loan|upkeep)|loan\s*and\s*upkeep|apply\s*for\s*(loan\s*)?and\s*upkeep/i.test(q)) {
    return hit('how-to-apply', 0.92, ['apply', 'upkeep'], 'Hourly 156 apply + upkeep follow-up', 'applying', entities)
  }

  if (/opay|palmpay|kuda|digital[- ]only|fintech\s*bank|wallet\s*account/i.test(q)) {
    return hit('bank-information', 0.9, ['bank'], 'Hourly 156 digital bank stall', 'applying', entities, true)
  }

  if (/no\s*(get|have)\s*matric|matric(ulation)?\s*(number\s*)?(never|not|no)\s*(ready|dey|come|out)/i.test(q)) {
    return hit('missing-information', 0.9, ['matric'], 'Hourly 156 no matric yet', 'preparing', entities, true)
  }

  if (/\bgsi\b|global\s*standing|dem\s*go\s*collect\s*from\s*(my\s*)?account/i.test(q)) {
    return hit('gsi', 0.88, ['gsi'], 'Hourly 156 GSI mandate', 'applying', entities)
  }

  return null
}
