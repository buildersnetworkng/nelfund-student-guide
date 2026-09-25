import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], problem: string): IntentResult {
  return {
    intent,
    confidence: 0.95,
    topics: ['hourly-174'],
    problem,
    stage: 'exploring',
    entities: [],
    isTroubleshooting: false,
  }
}

export function earlyIntent174(text: string): IntentResult | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (/gsi\s*(mandate|consent)|accept\s*(the\s*)?(terms|gsi)|what\s*(is|be)\s*gsi/i.test(raw)) {
    return hit('gsi', 'GSI mandate / terms')
  }
  if (/change\s*(my\s*)?email|new\s*email\s*(address|for)/i.test(raw)) {
    return hit('email-already-used', 'Change email')
  }
  if (/forget\s*(my\s*)?password|forgot\s*(my\s*)?password|i\s*no\s*remember\s*(my\s*)?password/i.test(raw)) {
    return hit('password-reset', 'Forgot password')
  }
  if (/vocational|college\s*of\s*education|\bnce\s*student|monotechnic/i.test(raw)) {
    return hit('eligibility', 'Vocational / COE eligibility')
  }
  if (/how\s*much.{0,20}(repay|pay\s*back)|percentage.{0,16}(salary|repay)/i.test(raw)) {
    return hit('repayment', 'Repayment amount')
  }
  return null
}
