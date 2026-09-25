import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], problem: string): IntentResult {
  return {
    intent,
    confidence: 0.95,
    topics: ['hourly-175'],
    problem,
    stage: 'exploring',
    entities: [],
    isTroubleshooting: true,
  }
}

export function earlyIntent175(text: string): IntentResult | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (
    /email\s*(don|already|has)\s*(use|used|exist|dey)|mail\s*(already|don)\s*(use|used|exist)|this\s*email\s*(is\s*)?(already|don)\s*(in\s*use|used)/i.test(
      raw,
    )
  ) {
    return hit('email-already-used', 'Email already used')
  }
  if (
    /missing\s*(info|information|details)|information\s*(no|not|never)\s*(complete|dey|show)|incomplete\s*(profile|information)/i.test(
      raw,
    )
  ) {
    return hit('missing-information', 'Missing information')
  }
  if (
    /dem\s*don\s*close|window\s*(don|has)\s*close|can\s*i\s*still\s*apply|still\s*(dey\s*)?open|deadline\s*(pass|don\s*pass)/i.test(
      raw,
    )
  ) {
    return hit('current-information', 'Window open / closed')
  }
  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(e|it)\s*(scholarship|grant)/i.test(
      raw,
    )
  ) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (
    /pay\s*(me\s*)?(5k|5000|ten\s*k|10k|agent)|agent\s*(say|said|wan).{0,30}(pay|otp)|whatsapp.{0,20}(pay|otp)|make\s*i\s*pay\s*(before|first)/i.test(
      raw,
    )
  ) {
    return hit('scam-safety', 'Paid agent / OTP scam')
  }
  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry|bring)|which\s*(file|document|paper)\s*(to\s*)?upload/i.test(
      raw,
    )
  ) {
    return hit('documents-needed', 'What to upload')
  }
  return null
}
