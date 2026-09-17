import type { IntentId, IntentResult } from './types'

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** 17 Sep 22:17 WAT: other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly25(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /my\s*(own\s*)?(money|upkeep|alert)|una\s*pay\s*(people|others)|dem\s*don\s*pay\s*(my\s*)?(mate|friends?)|everybody\s*(don|has)\s*(collect|receive)|i\s*never\s*collect|collect\s*(my\s*)?(own|money)|when\s*na\s*(my\s*)?turn/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.87,
      ['pending-status', 'other', 'peer-paid'],
      'Others paid / my turn leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/otp|one\s*time\s*password|verification\s*code\s*(no|not|never)|code\s*(no|not)\s*(dey|come|enter)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'otp'], 'OTP leftover', 'applying', entities, true)
  }

  if (/forgot\s*(my\s*)?(password|pass|pin)|reset\s*(my\s*)?password|change\s*(my\s*)?password|account\s*(lock|locked|disable)/i.test(q)) {
    return hit('portal-login', 0.88, ['login', 'other'], 'Password / lock leftover', 'applying', entities, true)
  }

  if (/cannot\s*(log\s*in|login|sign\s*in)|i\s*no\s*fit\s*(login|sign\s*in)|portal\s*(hang|hanging|no\s*load|not\s*loading|blank)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other'], 'Cannot login leftover', 'applying', entities, true)
  }

  if (/email\s*(already|don)\s*(use|used|register)|this\s*email\s*(is\s*)?(taken|exist)|registered\s*(last|previous)\s*(year|session)/i.test(q)) {
    return hit('portal-login', 0.9, ['login', 'other'], 'Email already used leftover', 'applying', entities, true)
  }

  if (/invalid\s*(jamb|utme)|jamb\s*(no|number)\s*(no|not|never)\s*(correct|work|dey)|jamb\s*wahala|utme\s*error/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb', 'other'], 'JAMB wahala leftover', 'applying', entities, true)
  }

  if (/matric\s*(no|number)|admission\s*letter\s*(no|not|never)|i\s*no\s*get\s*(admission\s*letter|jamb)/i.test(q)) {
    return hit('documents-needed', 0.84, ['documents', 'other'], 'Matric / admission leftover', 'preparing', entities)
  }

  if (/private\s*school|private\s*uni|not\s*federal|state\s*uni\s*eligible|poly\s*(fit|can)\s*apply/i.test(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'other'], 'Private / school type leftover', 'exploring', entities)
  }

  if (/part\s*time|sandwich|distance\s*learn|noun\s*(fit|can)|nd\s*(and|or)\s*hnd|100\s*level|fresher/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Mode / level leftover', 'exploring', entities)
  }

  if (/guarantor|surety|who\s*(go|will)\s*stand|need\s*parent/i.test(q)) {
    return hit('guarantor', 0.86, ['guarantor', 'other'], 'Guarantor leftover', 'preparing', entities)
  }

  if (/which\s*bank|wallet\s*(account|no\s*work)|opay|palmpay|moniepoint|bank\s*(reject|fail)/i.test(q)) {
    return hit('bank-information', 0.86, ['bank', 'other'], 'Bank / wallet leftover', 'applying', entities, true)
  }

  if (/refund|school\s*(go|will)\s*return|i\s*don\s*pay\s*school/i.test(q)) {
    return hit('refund', 0.84, ['refund', 'other'], 'Refund leftover', 'waiting', entities, true)
  }

  if (/agent|pay\s*(someone|person)\s*to\s*apply|dem\s*ask\s*me\s*for\s*money|otp\s*for\s*agent/i.test(q)) {
    return hit('scam-safety', 0.9, ['scam', 'other'], 'Agent / pay leftover', 'applying', entities, true)
  }

  if (/^(pls|please|abeg|help|help\s*me|sir|ma)[.!? ]*$/i.test(q) || q.length < 6) {
    return hit('official-sources', 0.42, ['empty', 'greeting-vague', 'other'], 'Too short leftover', 'unknown', entities)
  }

  return null
}
