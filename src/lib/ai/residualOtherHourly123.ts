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
 * Hour-123 leftover catcher.
 * Live 2026-09-22 19:10Z: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30.
 * Focus: pending-status sentence shapes that still leak into unknown/other.
 */
export function residualOtherHourly123(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan|why\s*(they|una|fg)\s*(bring|form|start)\s*(am|nelfund)|nelfund\s*for\s*wetin/i.test(
      q,
    )
  )
    return null

  if (
    /approved\s*(but|yet)\s*(no|never|not)\s*(money|alert|pay|upkeep)|dem\s*say\s*(dem|they)\s*(go|will)\s*pay|they\s*said\s*(they\s*)?(will|would)\s*pay|disburse(ment)?\s*(no|not|never|still)|no\s*disbursement|i\s*don\s*see\s*(any\s*)?(credit|alert|kobo)|kobo\s*no\s*dey|zero\s*(naira|balance)\s*(for|in)\s*(my\s*)?(bank|account)|bank\s*(still\s*)?(empty|blank)|upkeep\s*never\s*(land|drop|enter|show)|institutional\s*(don|has)\s*(pay|paid)\s*but\s*(i|me)\s*(no|never)|school\s*(don|has)\s*(receive|collect).{0,24}(i|me)\s*(no|never)|when\s*(will|go)\s*(my\s*)?(own|money|upkeep)\s*(enter|drop|come)|wetin\s*happen\s*to\s*my\s*(own|money|upkeep)|una\s*don\s*pay\s*(others|everybody)\s*(except|but)\s*me|i\s*remain\s*for\s*(the\s*)?(list|batch)|batch\s*(no|not|never)\s*(pay|drop)|my\s*name\s*no\s*dey\s*(pay|disburse)\s*list|check\s*(my\s*)?(status|application)\s*abeg|status\s*check|application\s*tracker|track\s*am\s*for\s*me|how\s*far\s*una\s*(reach|go)\s*with\s*my|progress\s*on\s*my\s*(file|loan|application)|e\s*never\s*move\s*(one\s*)?inch|stuck\s*on\s*pending|hang\s*for\s*pending|pending\s*since\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d+)|since\s*\d{4}\s*(still|e\s*still)|submitted\s*(last|last\s*year).{0,20}(pending|nothing)|i\s*apply\s*(finish|don\s*finish).{0,16}(no|never)\s*(pay|alert)|loan\s*approved\s*no\s*cash|cash\s*never\s*show|wallet\s*never\s*credit/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 123', 'waiting', entities, true)
  }

  if (
    /e\s*say\s*email\s*(don|already)\s*(exist|use|used)|mail\s*address\s*(already|don)\s*(taken|use|used)|this\s*address\s*(is\s*)?(already|taken)|i\s*create[d]?\s*(account|profile)\s*(last|last\s*year)|cannot\s*open\s*(another|new)\s*account|sign\s*up\s*page\s*(no|not)\s*gree|duplicate\s*(email|account)|email\s*taken/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 123', 'applying', entities, true)
  }

  if (
    /jamb\s*(id|reg|registration)\s*(no|not|never)\s*(valid|correct|gree)|portal\s*(say|says)\s*invalid\s*(jamb|utme)|utme\s*number\s*(wrong|invalid)|caps\s*status\s*(no|not)\s*(gree|match)|admission\s*letter\s*jamb\s*(no|not)\s*gree|verify\s*jamb\s*(no|not)\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 123', 'applying', entities, true)
  }

  if (
    /my\s*(uni|university|polytechnic|college)\s*(no|not)\s*(dey|show|appear)|search\s*box\s*(no|not)\s*(bring|show)\s*(my\s*)?school|list\s*(no|not)\s*get\s*(unilag|lasu|oou|yabatech|unilorin)|institution\s*field\s*(empty|blank)|school\s*dropdown\s*(empty|blank)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School missing leftover 123', 'applying', entities, true)
  }

  if (
    /just\s*dey\s*here|i\s*land(ed)?\s*(here|for\s*here)|wetin\s*una\s*dey\s*help\s*with|talk\s*to\s*me\s*small|yarn\s*me\s*small|i\s*need\s*direction|show\s*options\s*abeg|brief\s*me|give\s*me\s*options/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague help leftover 123', 'exploring', entities)
  }

  return null
}
