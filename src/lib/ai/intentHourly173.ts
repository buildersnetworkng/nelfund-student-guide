import type { IntentResult } from './types'

function hit(
  intent: IntentResult['intent'],
  problem: string,
): IntentResult {
  return {
    intent,
    confidence: 0.95,
    topics: ['hourly-173'],
    problem,
    stage: 'exploring',
    entities: [],
    isTroubleshooting: false,
  }
}

/** Early student-language intents that used to fall through to official-sources. */
export function earlyIntent173(text: string): IntentResult | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (/whatsapp\s*(man|agent|guy)|pay\s*(me\s*)?\d|make\s*i\s*pay|agent.{0,20}(otp|pay|nelfund)|otp.{0,20}(agent|whatsapp)|never\s*share\s*(otp|pin)/i.test(raw)) {
    return hit('scam-safety', 'Scam / OTP / paid agent')
  }
  if (/draft\s*(an?\s*)?email|write\s*(an?\s*)?email|email\s*to\s*(lasu|unilag|school|ict|registry)/i.test(raw)) {
    return hit('email-draft', 'Draft support email')
  }
  if (/official\s*(email|phone|number|hotline)|what\s*(is|be)\s*(the\s*)?official\s*email|contact\s*(nelfund|support)/i.test(raw)) {
    return hit('contact-support', 'Official contact')
  }
  return null
}
