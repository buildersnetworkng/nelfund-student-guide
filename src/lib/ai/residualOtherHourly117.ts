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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept/i.test(
    q,
  )
}

/**
 * Hour-117 leftover catcher. Live 2026-09-22: unknownAi 438, other 324.
 * Vague Pidgin help + leftover other that is apply, pending, jamb, login, school, repay.
 */
export function residualOtherHourly117(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /^(abeg|pls|please)?\s*(help(\s*me)?|i\s*need\s*help|una\s*fit\s*help|make\s*una\s*help|assist(\s*me)?|guide\s*me|i\s*dey\s*confused|i\s*no\s*sabi|i\s*no\s*know\s*wetin\s*to\s*do|wetin\s*i\s*go\s*do|talk\s*to\s*me|say\s*something)[.!?\s]*$/i.test(
      q,
    ) ||
    /^(help|assist|guide|confused|stuck|wahala)[.!?\s]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 117', 'exploring', entities)
  }

  if (
    /how\s*far\s*(my|dis|this|the)?\s*(loan|file|application|status)?|my\s*(own|loan|file)\s*(still\s*)?(dey|is)\s*(pending|there|under\s*review)|money\s*(never|no)\s*(enter|drop|show)|una\s*never\s*pay|nothing\s*don\s*drop|under\s*review\s*(since|still)|status\s*(still\s*)?(pending|dey)|i\s*don\s*apply\s*(since|long)|wetin\s*(dey\s*)?happen\s*to\s*my/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 117', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never|invalid|wahala|error|reject)|invalid\s*jamb|utme\s*(no|not)|jamb\s*number\s*(no|not|wrong)|cannot\s*verify\s*jamb|jamb\s*no\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 117', 'applying', entities, true)
  }

  if (
    /email\s*(i\s*)?(use[d]?|don\s*use)|last\s*year\s*(i\s*)?(register|sign|create)|already\s*(register|registered|sign\s*up)|cannot\s*(log\s*in|login|sign\s*in)|forgot\s*(password|otp)|otp\s*(no|not|never)\s*(come|gree|drop)|sign\s*in\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other'], 'Login leftover 117', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|not\s*on\s*(the\s*)?list|institution\s*(no|not)\s*(show|found)|my\s*school\s*(no|not)\s*(there|dey)|cannot\s*find\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 117', 'applying', entities, true)
  }

  if (
    /when\s*(do\s*i|to|we)\s*repay|repay(ment)?|pay\s*(am\s*)?back|after\s*nysc|gsi|salary\s*deduct|how\s*(i\s*)?(go|fit)\s*pay\s*(am\s*)?back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repay leftover 117', 'exploring', entities)
  }

  if (
    /abeg\s*(help|guide)\s*(me\s*)?(apply|register)|i\s*wan\s*collect\s*(the\s*)?loan|how\s*(person|man)\s*(go|fit)\s*apply|make\s*una\s*show\s*me\s*(how|step)|i\s*never\s*start\s*(am|application)|first\s*tin\s*(to\s*)?(do|apply)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.91, ['other'], 'Pidgin apply leftover 117', 'applying', entities)
  }

  if (
    /i\s*no\s*know\s*if\s*i\s*(qualify|fit)|do\s*i\s*qualify|who\s*(fit|can)\s*(apply|collect)|am\s*i\s*eligible|private\s*uni\s*(fit|can)|part\s*time\s*(fit|can)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['other'], 'Qualify leftover 117', 'exploring', entities)
  }

  return null
}
