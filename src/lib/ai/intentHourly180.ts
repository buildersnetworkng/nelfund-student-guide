import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 180 early routes. */
export function earlyIntent180(text: string): IntentResult | null {
  const raw = text || ''
  if (/name\s*(no|not|never)\s*(match|the\s*same)|mismatch|different\s*name\s*(on|for)\s*(nin|bvn|jamb)/i.test(raw)) {
    return hit('missing-information', 'Name mismatch')
  }
  if (/no\s*(admission|offer)\s*letter|admission\s*letter\s*(lost|missing|required)/i.test(raw)) {
    return hit('documents-needed', 'Admission letter')
  }
  if (/who\s*(go|will|does)\s*(dem\s*)?(pay|collect)|money\s*(go|enter)\s*(school|my\s*account)/i.test(raw)) {
    return hit('upkeep-vs-fees', 'Who gets paid')
  }
  if (/cancel.{0,20}(again|re-?apply)|reapply|i\s*(don|have)\s*cancel/i.test(raw)) {
    return hit('pending-application', 'Cancel / reapply')
  }
  if (/forgot\s*(my\s*)?(email|mail|username)/i.test(raw)) {
    return hit('portal-login', 'Forgot email')
  }
  if (/send\s*(me\s*)?(the\s*)?otp|give\s*(am|them|agent)\s*(the\s*)?otp|otp\s*(for|to)\s*agent/i.test(raw)) {
    return hit('scam-safety', 'OTP / agent')
  }
  if (/abeg\s*who\s*(i\s*)?go\s*call|una\s*number|how\s*(i|to)\s*(go\s*)?(reach|call)\s*(una|nelfund)/i.test(raw)) {
    return hit('contact-support', 'Contact')
  }
  return null
}
