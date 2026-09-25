import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} } as unknown as IntentResult
}

/** Hourly 183 early routes: password, email-used, window, scholarship vs loan, interest, missing info, school list. */
export function earlyIntent183(text: string): IntentResult | null {
  const raw = text || ''
  if (/email\s*(already|don|has)\s*(been\s*)?(use[d]?|taken|exist)|dis\s*email\s*(don|already)\s*(dey|exist)|account\s*(already|don)\s*(dey|exist)/i.test(raw)) {
    return hit('email-already-used', 'Email already used')
  }
  if (/forget\s*(my\s*)?(pass|password)|forgot\s*(my\s*)?(pass|password)|reset\s*(my\s*)?(pass|password)|password\s*(no|not|never)\s*(dey|work|correct)|i\s*no\s*remember\s*(my\s*)?password/i.test(raw)) {
    return hit('password-reset', 'Forgot password')
  }
  if (/\b(na|is)\s*(dis|this|am)\s*(scholarship|grant|free\s*money)|loan\s*(or|vs|abi)\s*scholarship|scholarship\s*(or|vs|abi)\s*loan|dem\s*(go|will)\s*collect\s*(am\s*)?back|na\s*free\s*money/i.test(raw)) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (/interest\s*(rate|free|zero)|zero\s*interest|dem\s*(go|will)\s*add\s*interest|how\s*much\s*interest|e\s*get\s*interest/i.test(raw)) {
    return hit('repayment', 'Interest-free')
  }
  if (/school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)?\s*(the\s*)?list|my\s*school\s*(no|not)\s*(dey|on)\s*(the\s*)?list|una\s*no\s*put\s*my\s*school/i.test(raw)) {
    return hit('school-not-found', 'School not listed')
  }
  if (/missing\s*(info|information|details)|profile\s*(no|not)\s*complete|e\s*say\s*missing|portal\s*say\s*missing/i.test(raw)) {
    return hit('missing-information', 'Missing information')
  }
  if (/part[\s-]*time|sandwich|post\s*graduate|postgraduate|masters?\b|phd\b|i\s*dey\s*part\s*time/i.test(raw)) {
    return hit('eligibility', 'Mode of study')
  }
  if (/how\s*(to|i\s*go|do\s*i)\s*apply\s*(then\s*)?(i\s*meant\s*)?(for\s*)?(the\s*)?(loan|upkeep)|apply.{0,24}(loan|upkeep).{0,16}(and|&|plus).{0,16}(loan|upkeep)/i.test(raw)) {
    return hit('upkeep-vs-fees', 'Apply loan + upkeep')
  }
  return null
}
