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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|take)|is\s*the\s*loan\s*still\s*on/i.test(
    q,
  )
}

/**
 * Hourly 126 2026-09-22: pending-status 70 is the largest named unknown after other.
 * Angle-specific leftover payout phrasing. Never dump live open/closed.
 */
export function residualOtherHourly126(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(
      q,
    )
  )
    return null

  if (
    /cash\s*(never|no|not)\s*(drop|enter|land|show)|stipend\s*(never|no|not)\s*(land|enter|drop|come)|allowance\s*(never|no)\s*(enter|drop)|been\s*(processing|pending)\s*(for\s*)?(weeks?|months?|days?)|awaiting\s*(disbursement|payment|payout)|loan\s*(balance|total)\s*(still\s*)?(is\s*)?(0|zero)|when\s*(will|go)\s*i\s*(receive|collect|see)\s*(my\s*)?(money|upkeep|stipend|loan)|any\s*credit\s*yet|e\s*never\s*land|payment\s*(no|not|never)\s*(show|enter|drop)|upkeep\s*still\s*(coming|pending|dey\s*come)|my\s*account\s*(still\s*)?(empty|blank)|no\s*kobo\s*(don|has)\s*(enter|drop)|i\s*never\s*see\s*(my\s*)?(own|share|kobo)|status\s*na\s*(awaiting|processing|pending)|e\s*no\s*move\s*since|processing\s*for\s*(weeks?|months?)|payout\s*(never|no)\s*(reach|enter)|when\s*my\s*(own|money)\s*go\s*drop/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 126', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number|reg|regno)\s*(not|no)\s*(valid|correct)|verification\s*failed\s*(on\s*)?jamb|jamb\s*verification\s*(fail|failed|error)|portal\s*say\s*jamb\s*(invalid|wrong)|jamb\s*no\s*valid|utme\s*number\s*(reject|invalid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 126', 'applying', entities, true)
  }

  return null
}
