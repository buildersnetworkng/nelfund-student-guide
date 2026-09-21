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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)/i.test(
    q,
  )
}

/**
 * Hour-102 leftover catcher.
 * Live 2026-09-21 20:10Z: unknownAi 438, other 324, pending-status 70.
 * Focus: pending / how-far / money-never-enter sentence shapes that still land on unknown/other.
 */
export function residualOtherHourly102(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /how\s*far(\s*(na|with|on))?\s*(my|dis|this|the)?\s*(own|one|app(lication)?|file|matter|loan)?/i.test(q) ||
    /my\s*(own|one|app(lication)?|file)\s*(still\s*)?(dey\s*)?(pending|processing|under\s*review|review)/i.test(q) ||
    /(application|file|loan)\s*(is|dey|still)\s*(pending|processing|under\s*review|reviewing)/i.test(q) ||
    /status\s*(still|dey|is|remain[s]?)\s*(pending|processing|same|under\s*review|no\s*change)/i.test(q) ||
    /money\s*(never|no|not)\s*(enter|show|land|drop|reach|come)/i.test(q) ||
    /(upkeep|alert|credit|transfer)\s*(never|no|not)\s*(enter|show|land|drop|reach|come)/i.test(q) ||
    /dem\s*(never|no)\s*(pay|credit|send)\s*(me|my\s*own)/i.test(q) ||
    /they\s*(haven'?t|have\s*not|never)\s*(paid|credited|sent)\s*(me|mine)/i.test(q) ||
    /(no|zero)\s*(alert|credit|kobo|naira)\s*(since|after|for)/i.test(q) ||
    /submit(ted)?\s*(since|last|for)\s*(week|month|january|february|march|april|may|june|july|august|september)/i.test(
      q,
    ) ||
    /nothing\s*(don|has)\s*(change|happen)|e\s*no\s*move|still\s*the\s*same\s*(word|status|place)/i.test(q) ||
    /classmates?\s*(don|have)\s*(collect|receive|get)|everybody\s*(don|have)\s*(collect|receive)\s*(except|apart)/i.test(
      q,
    ) ||
    /approved\s*(but|yet)\s*(no|never)\s*(alert|money|credit)/i.test(q) ||
    /under\s*review\s*(since|for)\s*\w+/i.test(q) ||
    /when\s*(go|will)\s*(my\s*)?(money|upkeep|alert)\s*(enter|come|drop)/i.test(q) ||
    /i\s*don\s*submit\s*(but|yet)\s*(nothing|no\s*money|e\s*no\s*move)/i.test(q)
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 102', 'waiting', entities, true)
  }

  if (
    /invalid\s*(jamb|utme)|jamb\s*(number\s*)?(not\s*valid|invalid|fail|failed|reject)/i.test(q) ||
    /verification\s*(failed|fail)\s*(on\s*)?(jamb|utme)/i.test(q) ||
    /jamb\s*(no|number)\s*(no|not)\s*(dey|gree|work)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 102', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(use[d]?|exist|register)/i.test(q) ||
    /i\s*register(ed)?\s*last\s*(year|session)/i.test(q) ||
    /cannot\s*create\s*(account|profile)\s*(with\s*)?(this|dis)\s*(email|mail)/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login', 'email-used'], 'Email used leftover 102', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey)|my\s*school\s*no\s*dey\s*(list|there)|institution\s*(missing|no\s*dey)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 102', 'applying', entities, true)
  }

  return null
}
