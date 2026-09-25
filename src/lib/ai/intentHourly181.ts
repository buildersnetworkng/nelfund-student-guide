import type { IntentResult } from './types'
import { earlyIntent182 } from './intentHourly182'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} }
}

/** Hourly 181 early routes. */
export function earlyIntent181(text: string): IntentResult | null {
  const from182 = earlyIntent182(text)
  if (from182) return from182
  const raw = text || ''
  if (/jamb\s*caps|caps\s*(no|not|never)\s*(show|dey)|jamb\s*(no|not)\s*verify/i.test(raw)) {
    return hit('jamb-verification', 'JAMB CAPS')
  }
  if (
    /how\s*long.{0,24}(pending|approval)|e\s*still\s*dey\s*pending|pending\s*(since|for)\s*(weeks?|months?|days?)/i.test(
      raw,
    )
  ) {
    return hit('pending-application', 'Long pending')
  }
  if (/raise\s*a?\s*dispute|wrong\s*(fee|charge|amount)|fee\s*(no|not)\s*(correct|match)/i.test(raw)) {
    return hit('school-fees', 'Wrong fee / dispute')
  }
  if (
    /which\s*(site|website|link)\s*(na|is)\s*(original|official|correct|real)|fake\s*(nelfund\s*)?(site|link)/i.test(
      raw,
    )
  ) {
    return hit('official-sources', 'Official site')
  }
  if (/passport\s*(photograph|photo)|nin\s*slip\s*(and|&)\s*(bvn|jamb)/i.test(raw)) {
    return hit('documents-needed', 'Passport / slips')
  }
  if (/una\s*go\s*add\s*interest|hidden\s*interest|dem\s*go\s*add\s*interest/i.test(raw)) {
    return hit('repayment', 'Interest later')
  }
  if (/na\s*(gift|free\s*money|grant)\??|scholarship\s*abi\s*loan/i.test(raw)) {
    return hit('loan-or-scholarship', 'Gift vs loan')
  }
  return null
}
