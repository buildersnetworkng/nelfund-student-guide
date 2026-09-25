import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 179 early routes. */
export function earlyIntent179(text: string): IntentResult | null {
  const raw = text || ''
  if (
    /loan\s*(or|vs|versus|and)\s*(scholarship|grant|gift)|scholarship\s*(or|vs|versus)\s*loan|is\s*(e|it|nelfund)\s*(a\s*)?(loan|scholarship|grant)|free\s*money|dem\s*go\s*collect\s*(am|back)/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (
    /wetin\s*(i|dem)\s*(go\s*)?(carry|need|upload)|which\s*document|documents?\s*(do\s*i|i\s*need|needed|required)|wetin\s*dem\s*need/i.test(
      raw,
    )
  ) {
    return hit('documents-needed', 'Documents')
  }
  if (
    /school\s*(no|not|never)\s*(dey|show|list|found)|not\s*on\s*(the\s*)?list|no\s*result\s*found|my\s*school\s*no\s*dey/i.test(
      raw,
    )
  ) {
    return hit('school-not-found', 'School not listed')
  }
  if (
    /change\s*(my\s*)?(bank|bvn)|bvn\s*(no|not|never)\s*(match|correct|dey)|wrong\s*bank|account\s*(number\s*)?(wrong|reject)/i.test(
      raw,
    )
  ) {
    return hit('missing-information', 'BVN / bank')
  }
  if (
    /una\s*still\s*dey\s*(open|collect|take)|fit\s*i\s*still\s*apply|window\s*(still\s*)?open/i.test(
      raw,
    )
  ) {
    return hit('current-information', 'Application open')
  }
  return null
}
