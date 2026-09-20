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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)/i.test(
    q,
  )
}

/**
 * Hour-74 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending / disbursement fragments that still fall into other.
 */
export function residualOtherHourly74(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop)|processing|under\s*review|approved/.test(low)) {
    return null
  }

  if (
    /how\s*far\s*(my\s*)?(own|application|file|loan)|status\s*(still\s*)?(na|is|dey)\s*(submitted|pending|processing|under\s*review)|e\s*never\s*(move|change|shift|update)|alert\s*never\s*(come|drop|show)|sms\s*never\s*(come|drop)|approved\s*(but|and)\s*(no|never)\s*(money|alert|credit)|dem\s*pay\s*(the\s*)?school\s*(but|and)\s*(me\s*)?(i\s*)?never\s*(see|collect)|disburse(ment)?\s*never\s*(drop|enter|show)|money\s*no\s*dey\s*(my\s*)?(account|acct|bank)|credit\s*never\s*(reflect|show|enter)|still\s*on\s*(submitted|pending|processing)|application\s*no\s*dey\s*move|file\s*stuck\s*(for|on)\s*(pending|submitted)|una\s*don\s*pay\s*(my\s*)?school\s*\??|when\s*(go|will)\s*(the\s*)?money\s*(enter|drop|land)|i\s*never\s*see\s*(the\s*)?(alert|credit|upkeep)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending / disbursement leftover 74', 'waiting', entities, true)
  }

  if (
    /email\s*(already|don)\s*(exist|dey|used)|this\s*mail\s*(is\s*)?(taken|used)|cannot\s*create\s*(new\s*)?account|sign\s*up\s*(no|not)\s*gree|registered?\s*last\s*(year|session)|old\s*email\s*(still\s*)?(dey|work)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['email-used'], 'Email used leftover 74', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number|no|numba)\s*(not|no)\s*(valid|correct)|verification\s*failed\s*(on\s*)?jamb|jamb\s*reject(ed)?|caps\s*no\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 74', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey)|my\s*school\s*no\s*dey(\s*list)?|institution\s*(missing|absent)|cannot\s*find\s*(my\s*)?(school|uni|poly)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list'], 'School list leftover 74', 'applying', entities, true)
  }

  if (
    /^(abeg|pls|please)\s*(wetin|what)\s*(now|next)|i\s*just\s*need\s*direction|point\s*me\s*(the\s*)?(way|direction)|start\s*from\s*where|where\s*i\s*(go|should)\s*begin/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.85, ['other', 'greeting-vague'], 'Vague next-step leftover 74', 'exploring', entities)
  }

  return null
}
