import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 181 early routes: loan vs grant, interest, window, eligibility variants. */
export function earlyIntent181(text: string): IntentResult | null {
  const raw = text || ''
  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(it|nelfund|am)\s*(a\s*)?(scholarship|grant)|scholarship\s*or\s*loan/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (
    /interest\s*(dey|free|rate)|zero\s*interest|does\s*(e|it|am)\s*get\s*interest|interest[- ]?free|any\s*interest/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Interest-free loan')
  }
  if (
    /part[-\s]*time|sandwich|distance\s*learning|private\s*(uni|university|poly|school)|100\s*l(evel)?|nd1|hnd1|freshers?/i.test(
      raw,
    ) &&
    /eligib|fit\s*(i|to)\s*apply|can\s*(i|we)|who\s*can/i.test(raw)
  ) {
    return hit('eligibility', 'Eligibility variant')
  }
  if (/mail\s*don\s*(dey|exist)|email\s*already|account\s*already\s*(dey|exist)/i.test(raw)) {
    return hit('email-already-used', 'Email already used')
  }
  if (
    /dem\s*don\s*close|still\s*(dey\s*)?open|window\s*(open|close)|fit\s*i\s*still\s*apply/i.test(raw)
  ) {
    return hit('current-information', 'Application window')
  }
  return null
}
