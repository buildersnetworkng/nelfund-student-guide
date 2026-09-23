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
 * Hourly 131 2026-09-23: pending-status leftovers with new sentence shapes.
 * Do not steal purpose or live-open questions.
 */
export function residualOtherHourly131(text: string, entities: string[]): IntentResult | null {
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
    /dem\s*never\s*credit\s*(my\s*)?(account|bank)|never\s*credit\s*(my\s*)?(account|wallet)|institutional\s*charges?\s*(never|no|not)\s*(show|enter|drop)|upkeep\s*(approved|ok)\s*but\s*(no|never)\s*(credit|alert|money)|file\s*(still\s*)?(dey|is)\s*(under\s*)?review|e\s*never\s*move\s*since|processing\s*(for|since)\s*(weeks|days|months)|no\s*movement\s*on\s*(my\s*)?(application|file|loan)|application\s*no\s*update|status\s*dey\s*(review|process)|una\s*pay\s*(my\s*)?(course\s*)?mates|course\s*mates?\s*(don|have)\s*(collect|receive|collect\s*am)|disbursement\s*(still\s*)?(pending|processing)|they\s*have\s*not\s*(paid|credited)\s*me|has\s*not\s*been\s*disbursed|waiting\s*on\s*(the\s*)?(school|bursary)\s*(to\s*)?(confirm|upload)|my\s*application\s*is\s*still\s*(on|at)\s*(pending|processing)|nothing\s*has\s*happened\s*(to\s*)?(my\s*)?(loan|file)|loan\s*still\s*on\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 131', 'waiting', entities, true)
  }

  if (
    /how\s*i\s*go\s*start\s*(the\s*)?(application|apply)|first\s*thing\s*(to|i\s*go)\s*apply|guide\s*me\s*(make\s*i|to)\s*apply|walk\s*me\s*through\s*(sign\s*up|application)|i\s*wan\s*start\s*(nelfund|application)|where\s*i\s*go\s*begin\s*(apply|application)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.92, ['how-to-apply'], 'Apply start leftover 131', 'preparing', entities)
  }

  return null
}
