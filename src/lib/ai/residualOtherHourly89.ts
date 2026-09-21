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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-89 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Pending payout phrasing first. Never dump live status on greetings or purpose asks.
 */
export function residualOtherHourly89(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*own\s*(still|stil|dey|never)(\s*dey)?\s*(pending|processing|review)|still\s*dey\s*(institutional|school)\s*verif|institutional\s*verif.{0,20}(since|still)|file\s*(never|no)\s*(leave|move)\s*pending|dem\s*never\s*approve\s*(my\s*)?(file|own|loan)|status\s*dey\s*processing\s*since|upkeep\s*never\s*(drop|enter|show)|school\s*fees?\s*(don|has)\s*pay.{0,24}upkeep\s*(no|never)|how\s*far\s*(with\s*)?(my\s*)?disburse|they\s*never\s*credit\s*me|e\s*never\s*credit|application\s*(still|dey)\s*under\s*(consideration|review)|no\s*credit\s*(alert|enter)|wallet\s*never\s*(show|enter)\s*(upkeep|money)|batch\s*(pass|don\s*go)\s*(me|my\s*own)|mates\s*don\s*collect.{0,20}(i|me)\s*(never|no)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending payout leftover 89', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|correct)|verification\s*failed\s*(on\s*)?jamb|jamb\s*(no|not)\s*gree|utme\s*(no|not)\s*(valid|gree)|portal\s*say\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 89', 'applying', entities, true)
  }

  if (
    /cannot\s*create\s*account\s*with\s*(this\s*)?email|email\s*(is\s*)?already\s*(in\s*use|taken)|i\s*register(ed)?\s*last\s*year|last\s*session\s*(i\s*)?(use|used)\s*(this\s*)?mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 89', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?(drop\s*)?down|institution\s*missing\s*(on\s*)?(portal|list)|my\s*campus\s*(no|not)\s*(dey|show)|select\s*institution\s*(empty|blank)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 89', 'applying', entities, true)
  }

  if (
    /i\s*just\s*wan(t)?\s*(to\s*)?ask|una\s*dey\s*there|anybody\s*here|help\s*a\s*student|i\s*need\s*small\s*help|make\s*una\s*yarn|i\s*no\s*know\s*wetin\s*to\s*type|where\s*i\s*go\s*start\s*from|kindly\s*assist\s*me\s*(pls|please|abeg)?/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'vague-help'], 'Vague help leftover 89', 'exploring', entities, false)
  }

  if (/pending|under\s*review|money\s*(never|no)|how\s*far\s*(my|with)|jamb|utme|school\s*(not|no)\s*(show|dey)|email\s*(already|used)|repay/i.test(low)) {
    return null
  }

  return null
}
