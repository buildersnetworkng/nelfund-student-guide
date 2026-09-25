import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 182 early routes. */
export function earlyIntent182(text: string): IntentResult | null {
  const raw = text || ''
  if (
    /forgot\s*(my\s*)?(login\s*)?email|i\s*(no|not|never)\s*(remember|sabi|know)\s*(the\s*)?(email|mail)|which\s*email\s*(i\s*)?(use|used)/i.test(
      raw,
    )
  ) {
    return hit('portal-login', 'Forgot email')
  }
  if (
    /reset\s*(my\s*)?password|forgot\s*(my\s*)?password|change\s*(my\s*)?password|password\s*(no|not)\s*(dey|work|correct)/i.test(
      raw,
    )
  ) {
    return hit('portal-login', 'Password reset')
  }
  if (
    /after\s*nysc|when\s*(do|go)\s*i\s*repay|repay(ment)?\s*(start|begin)|how\s*(i\s*)?(go|to)\s*pay\s*(back|am)/i.test(
      raw,
    )
  ) {
    return hit('repayment', 'Repay after NYSC')
  }
  if (/what\s*(is|be)\s*(the\s*)?gsi|gsi\s*mandate|wetin\s*(be|mean)\s*gsi/i.test(raw)) {
    return hit('repayment', 'GSI meaning')
  }
  if (
    /school\s*fees?\s*(don|has|have)\s*(enter|pay|paid)|upkeep\s*(never|no|not)\s*(enter|show|drop)|institutional\s*(don|has)\s*(pay|paid)|fees?\s*don\s*enter\s*but\s*upkeep/i.test(
      raw,
    )
  ) {
    return hit('pending-application', 'Fees vs upkeep disbursed')
  }
  if (/change\s*(my\s*)?(bank|account)|wrong\s*account\s*number|update\s*(my\s*)?bvn/i.test(raw)) {
    return hit('missing-information', 'Change bank / BVN')
  }
  if (
    /how\s*to\s*apply\s*then\s*i\s*meant|meant\s*(for\s*)?(the\s*)?(loan|upkeep)|apply.{0,30}(loan|upkeep).{0,20}(and|&).{0,20}(loan|upkeep)/i.test(
      raw,
    )
  ) {
    return hit('how-to-apply', 'Apply loan and upkeep')
  }
  return null
}
