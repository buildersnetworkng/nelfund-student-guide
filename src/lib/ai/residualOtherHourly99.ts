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
 * Hour-99 leftover catcher.
 * Live 2026-09-21 18:19Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still leak into unknown/other.
 */
export function residualOtherHourly99(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /e\s*never\s*(drop|enter|land)\s*(for|in|inside)?\s*(my\s*)?(account|bank|wallet)|money\s*no\s*(dey|enter|show)|kobo\s*never\s*(enter|drop)|account\s*still\s*(empty|blank|0|zero)|no\s*credit\s*(alert|msg)|alert\s*no\s*dey|i\s*never\s*collect\s*(my\s*)?(own|upkeep|money)|una\s*forget\s*me|dem\s*forget\s*(my\s*)?(own|file)|only\s*me\s*remain|everybody\s*(don|has)\s*(collect|receive)\s*(except|but)\s*me|processing\s*since|still\s*processing|status\s*(still\s*)?(na|is)?\s*processing|file\s*(still\s*)?(dey|is)\s*(processing|pending)|how\s*far\s*my\s*(own|matter|case)|my\s*application\s*(is\s*)?pending|pending\s*abeg|e\s*dey\s*there\s*so|nothing\s*enter\s*(my\s*)?account|school\s*(don|has)\s*collect\s*but\s*(i|me)\s*(no|never)|paid\s*(the\s*)?school\s*but\s*(no|never)\s*(upkeep|alert)|upkeep\s*line\s*(still|dey)\s*(pending|0)|institutional\s*(still|dey)\s*pending|i\s*check\s*(am|status)\s*(e\s*)?(still|dey)|last\s*(week|month)\s*(e\s*)?(still|dey)\s*(same|pending)|two\s*weeks?\s*(now|already)\s*(no|never)\s*(pay|alert)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 99', 'waiting', entities, true)
  }

  if (
    /^(help|help\s*me|abeg|pls|please|una\s*help)$|i\s*just\s*dey\s*confused|i\s*no\s*know\s*where\s*to\s*start|point\s*me|direct\s*me|short\s*list\s*of\s*options|what\s*can\s*you\s*do|wetin\s*you\s*fit\s*do|capabilities|menu\s*abeg/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 99', 'exploring', entities)
  }

  if (
    /jamb\s*(verification|verify)\s*(fail|failed|error)|verification\s*failed\s*(on\s*)?(jamb|utme)|jamb\s*number\s*(not|no)\s*valid|invalid\s*(utme|reg\s*no)|caps\s*(no|not)\s*(gree|match)|old\s*jamb\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 99', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has)\s*(dey|been)\s*use[d]?|cannot\s*create\s*(account|profile)\s*with\s*(this|the)\s*email|email\s*already\s*in\s*use|i\s*register(ed)?\s*last\s*year/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 99', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*(the\s*)?list|school\s*not\s*showing|institution\s*missing|cannot\s*find\s*(my\s*)?(school|institution)|dropdown\s*no\s*get\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 99', 'applying', entities, true)
  }

  return null
}
