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
 * Hourly 133 2026-09-23: pending-status leftovers that still land in admin `other`.
 * Extra sentence shapes: processed yet, kobo never drop, remit, stuck submitted.
 */
export function residualOtherHourly133(text: string, entities: string[]): IntentResult | null {
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
    /has\s*(my\s*)?(loan|application|file)\s*been\s*(processed|approved|paid)|any\s*movement\s*on\s*(my\s*)?(application|loan|file)|processed\s*yet|nelfund\s*matter\s*still\s*dey|my\s*(file|matter|own)\s*still\s*dey\s*(one\s*place|the\s*same)|kobo\s*(never|no)\s*(drop|enter|show)|portal\s*still\s*(say|shows?|dey\s*show)\s*(submitted|pending|processing)|never\s*leave\s*submitted|wetin\s*dey\s*delay\s*(my\s*)?(own|loan|file)|why\s*(my\s*)?(payment|payout|upkeep|money)\s*(dey\s*)?delay|have\s*(they|dem|una)\s*remitted\s*(my\s*)?(school\s*)?fees?|pending\s*loans?\s*(is\s*)?(0|zero)|na\s*only\s*pending\s*i\s*dey\s*see|loan\s*still\s*dey\s*(the\s*)?same\s*place|zero\s*kobo|stuck\s*(on|at)\s*submitted/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 133', 'waiting', entities, true)
  }

  if (
    /^(bros|sis|oga)?\s*(abeg|pls)?\s*(help|guide)\s*(me)?\s*(small|now)?\.?$|^i\s*just\s*wan\s*ask$|^point\s*me\s*abeg$|^wetin\s*i\s*suppose\s*ask\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help 133', 'exploring', entities)
  }

  return null
}
