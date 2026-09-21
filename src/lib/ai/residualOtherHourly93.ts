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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window/i.test(
    q,
  )
}

/**
 * Hour-93 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still land in other/unknown.
 */
export function residualOtherHourly93(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /status\s*(still|dey|just)\s*(say|shows?|showing|read|na)\s*(processing|pending|submitted|under\s*review)|e\s*still\s*dey\s*process(ing)?|still\s*dey\s*process(ing)?|processing\s*(for\s*)?(weeks?|months?|days?)|my\s*(own|tin|file)\s*(no|never|not)\s*move|why\s*(my\s*)?(own|application)\s*(no|not|never)\s*move|una\s*don\s*see\s*my\s*(file|application)|alert\s*never\s*(come|enter|drop|show)|i\s*don\s*apply\s*(but\s*)?(money|alert)\s*never|dashboard\s*still\s*(say|shows?)\s*(submitted|pending|processing)|school\s*fees?\s*(don|has)\s*(enter|go)\s*(school|campus).{0,40}(i|me|upkeep).{0,20}(no|never|not)|upkeep\s*(for\s*)?me\s*(no|never)\s*(show|enter)|e\s*never\s*leave\s*processing|stuck\s*(on|for)\s*(processing|pending)|submitted\s*but\s*nothing\s*(don|has)\s*happen/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 93', 'waiting', entities, true)
  }

  if (
    /^(how\s*far\s*my\s*own|how\s*far\s*my\s*tin|money\s*never\s*enter|e\s*never\s*enter|status\s*still\s*processing|still\s*processing)[.!?]*$/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Short pending leftover 93', 'waiting', entities, true)
  }

  if (
    /jamb\s*(say|says|show)\s*(invalid|fail)|portal\s*(say|says)\s*invalid\s*jamb|jamb\s*no\s*valid|my\s*jamb\s*(no|not)\s*(dey|work|gree)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 93', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has|already)\s*(dey|been)\s*use[d]?|mail\s*already\s*register|cannot\s*create\s*(account|profile)\s*with\s*(this\s*)?(mail|email)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 93', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*(the\s*)?(list|drop)|institution\s*missing|school\s*no\s*dey\s*show\s*for\s*portal/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 93', 'applying', entities, true)
  }

  return null
}
