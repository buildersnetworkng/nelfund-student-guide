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
 * Hourly 134 2026-09-23: pending leftovers still landing in admin `other`.
 * Extra shapes: verified not disbursed, how far my own, status still processing,
 * school never upload, money never enter my account.
 */
export function residualOtherHourly134(text: string, entities: string[]): IntentResult | null {
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
    /status\s*(na|is|shows?|dey\s*show)\s*verified|verified\s*(but|and)\s*(no|never|not)\s*(disburse|pay|money|alert)|verified\s*(no|never)\s*disburse|final\s*approval\s*(never|no|not)\s*(come|show)|school\s*(never|no|not|don\s*never)\s*(upload|confirm)\s*(my\s*)?(data|record|file)|institution\s*(never|no)\s*upload|how\s*far\s*my\s*own|my\s*application\s*(is|dey)\s*pending|status\s*still\s*processing|money\s*never\s*enter\s*(my\s*)?(account|bank)|e\s*never\s*show\s*for\s*(my\s*)?(account|bank)|my\s*own\s*how\s*far|application\s*still\s*(dey|is)\s*pending|waiting\s*for\s*disburse/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending leftover 134', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(not|no)\s*valid|invalid\s*jamb|verification\s*failed\s*(on\s*)?jamb|jamb\s*verification\s*fail/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 134', 'applying', entities, true)
  }

  if (
    /email\s*already\s*used|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*with\s*this\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['login'], 'Email used leftover 134', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing|my\s*school\s*no\s*dey\s*list|institution\s*missing\s*on\s*portal/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.95, ['school-list'], 'School missing leftover 134', 'applying', entities, true)
  }

  return null
}
