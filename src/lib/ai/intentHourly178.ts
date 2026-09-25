import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 178 early routes. */
export function earlyIntent178(text: string): IntentResult | null {
  const raw = text || ''
  if (
    /interest\s*(rate|free)?|any\s*interest|dem\s*dey\s*add\s*interest|how\s*much\s*interest|loan\s*(get|has)\s*interest/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Interest-free loan')
  }
  if (
    /jamb.{0,20}(no|not|never|wrong|reject|fail|invalid|issue|problem|error)|no\s*jamb|i\s*no\s*get\s*jamb/i.test(
      raw,
    )
  ) {
    return hit('jamb-verification', 'JAMB on the form')
  }
  if (
    /\bpending\b.{0,24}(long|since|still|dey)|still\s*(dey\s*)?pending|my\s*(loan|application|status)\s*(still\s*)?(pending|no\s*move)/i.test(
      raw,
    )
  ) {
    return hit('pending-application', 'Pending status')
  }
  if (
    /whatsapp|telegram|pay\s*(me|am|them|5k|10k)|agent\s*(say|ask|wan)|otp\s*(for|to)\s*(agent|am)|scam|fraud/i.test(
      raw,
    )
  ) {
    return hit('scam-safety', 'Scam / agent')
  }
  if (
    /how\s*(i|to)\s*(go\s*)?contact|official\s*(email|phone|number)|support\s*(ticket|desk)|esupport|customer\s*care|helpline/i.test(
      raw,
    )
  ) {
    return hit('contact-support', 'Official support')
  }
  if (
    /missing\s*information|incomplete\s*(record|data|info)|school\s*(never|no|not)\s*upload/i.test(
      raw,
    )
  ) {
    return hit('missing-information', 'Missing information')
  }
  if (
    /fees?\s*(vs|versus|or|and)\s*upkeep|upkeep\s*(vs|versus|or|and)\s*(fees?|charges)|difference\s*(between\s*)?(upkeep|fees|charges)/i.test(
      raw,
    )
  ) {
    return hit('upkeep-vs-fees', 'Fees vs upkeep')
  }
  return null
}
