import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], problem: string): IntentResult {
  return {
    intent,
    confidence: 0.95,
    topics: ['hourly-177'],
    problem,
    stage: 'exploring',
    entities: [],
    isTroubleshooting: true,
  }
}

export function earlyIntent177(text: string): IntentResult | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (
    /\bgsi\b|global\s*standing\s*instruction|salary\s*(deduct|cut)|pay\s*back\s*how|after\s*nysc.{0,12}(pay|repay)/i.test(
      raw,
    )
  ) {
    return hit('repayment', 'Repayment / GSI')
  }
  if (
    /forgot\s*(my\s*)?(password|pass)|reset\s*(my\s*)?password|password\s*(no|not|never)\s*(dey|work|gree)/i.test(
      raw,
    )
  ) {
    return hit('password-reset', 'Forgot password')
  }
  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry|bring)|which\s*(file|document|paper)\s*(to\s*)?upload/i.test(
      raw,
    )
  ) {
    return hit('documents-needed', 'Documents to upload')
  }
  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(e|it)\s*(scholarship|grant)/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (
    /\b(nd|hnd|nce)\b|college\s*of\s*education|poly(technic)?\s*(student|fit|apply)|vocational/i.test(raw) &&
    /eligib|apply|fit|cover/i.test(raw)
  ) {
    return hit('eligibility', 'Poly / COE / ND-HND eligibility')
  }
  return null
}
