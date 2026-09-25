import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} } as unknown as IntentResult
}

/** Hourly 183 early routes. */
export function earlyIntent183(text: string): IntentResult | null {
  const raw = text || ''
  if (/direct\s*entry|ijmb|jupeb|no\s*utme|i\s*(no|never|don.?t)\s*write\s*jamb|jamb\s*(number|reg).{0,20}(lost|forget|no\s*dey)/i.test(raw)) {
    return hit('jamb-verification', 'DE / JAMB number')
  }
  if (/forgot\s*(the\s*)?(email|gmail)|which\s*email\s*(i\s*)?(use|used)|email\s*(i\s*)?(use|used)\s*(don\s*)?(forget|lost)/i.test(raw)) {
    return hit('portal-login', 'Forgot email')
  }
  if (/passport\s*(photo|photograph)|upload\s*(my\s*)?(picture|photo|id\s*card)|student\s*id\s*(card)?\s*(upload|needed|compulsory)/i.test(raw)) {
    return hit('documents-needed', 'Photo / ID upload')
  }
  if (/change\s*of\s*institution|i\s*change\s*(school|uni)|transfer\s*(student|to\s*another)|i\s*leave\s*(the\s*)?(old\s*)?school/i.test(raw)) {
    return hit('missing-information', 'Change of institution')
  }
  if (/i\s*dey\s*(do|serve)\s*nysc|serving\s*(corps|nysc)|after\s*graduation\s*(fit|can)\s*i\s*still\s*apply/i.test(raw)) {
    return hit('eligibility', 'NYSC / after school')
  }
  if (/how\s*(i\s*go|to|do\s*i)\s*(open|raise|create)\s*(esupport|e-?support|ticket)|ticket\s*(no|not|never)\s*(reply|answer)/i.test(raw)) {
    return hit('contact-support', 'Open ticket')
  }
  if (/na\s*(loan|scholarship|grant)\s*(or|abi)\s*(loan|scholarship|grant)|dem\s*go\s*collect\s*(am\s*)?back|free\s*money\s*abi\s*loan/i.test(raw)) {
    return hit('loan-or-scholarship', 'Loan vs grant pidgin')
  }
  if (/interest\s*(rate|free)|does\s*(e|it)\s*get\s*interest|dem\s*go\s*add\s*interest|zero\s*interest/i.test(raw)) {
    return hit('repayment', 'Interest ask')
  }
  return null
}
