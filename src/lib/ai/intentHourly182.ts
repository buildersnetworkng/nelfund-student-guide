import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], label: string): IntentResult {
  return { intent, confidence: 0.92, label, slots: {} } as unknown as IntentResult
}

/** Hourly 182 early routes. */
export function earlyIntent182(text: string): IntentResult | null {
  const raw = text || ''
  if (/wetin\s*(i|dem)\s*(go\s*)?(need|carry|gather)|documents?\s*(checklist|list)|what\s*(papers|docs)\s*(do\s*i|i\s*need)/i.test(raw)) {
    return hit('documents-needed', 'Docs checklist')
  }
  if (/i\s*(no|never|don.?t)\s*(do|finish|don)\s*nysc|before\s*nysc|repay.{0,20}nysc|when\s*(i\s*)?(go|will)\s*pay\s*back/i.test(raw)) {
    return hit('repayment', 'NYSC / repay')
  }
  if (/college\s*of\s*education|i\s*dey\s*(poly|coe|college)/i.test(raw)) {
    return hit('eligibility', 'Poly / COE')
  }
  if (/(send|give|share).{0,18}(nin|bvn|account).{0,18}(whatsapp|agent|them)|make\s*i\s*send\s*(my\s*)?(nin|bvn)/i.test(raw)) {
    return hit('scam-safety', 'WhatsApp NIN')
  }
  if (/ticket\s*(or|vs|abi)\s*(school|campus)|who\s*(i\s*)?go\s*ask\s*first/i.test(raw)) {
    return hit('contact-support', 'Desk vs ticket')
  }
  if (/how\s*(i\s*go|to|do\s*i)\s*apply\s*(for\s*)?(loan\s*)?(and|&|plus)\s*upkeep|upkeep\s*(and|&|plus)\s*(school\s*fees|institutional)/i.test(raw)) {
    return hit('upkeep-vs-fees', 'Apply + upkeep')
  }
  if (/gsi.{0,24}(now|today|debit|remove\s*money)|will\s*(dem|they)\s*(debit|remove\s*money)\s*now|mandate\s*(mean|be)\s*wetin/i.test(raw)) {
    return hit('gsi', 'GSI now')
  }
  return null
}
