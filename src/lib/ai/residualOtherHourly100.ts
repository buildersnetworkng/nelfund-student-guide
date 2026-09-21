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
 * Hour-100 leftover catcher.
 * Live 2026-09-21 19:03Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: JAMB verification sentence shapes that still leak into unknown/other.
 */
export function residualOtherHourly100(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /invalid\s*jamb|jamb\s*(no|number|reg|regno|reg\s*no|utme)\s*(is\s*)?(not|no)\s*(valid|correct|gree)|jamb\s*(no|not)\s*valid|jamb\s*number\s*not\s*valid|verification\s*failed\s*(on\s*)?(jamb|utme)?|jamb\s*(verification|verify)\s*(fail|failed|error|no\s*gree)|portal\s*(say|says|dey\s*tell)\s*(invalid|wrong)\s*jamb|it\s*say\s*jamb\s*(invalid|wrong|no\s*dey)|jamb\s*(dey|is)\s*(reject|rejected|bounce)|utme\s*(no|not)\s*(gree|valid|match)|caps\s*(no|not)\s*(gree|match|align)|my\s*jamb\s*(no|not)\s*(work|gree)|cannot\s*verify\s*jamb|jamb\s*verify\s*no\s*gree|e\s*say\s*invalid\s*(jamb|utme)|wrong\s*jamb\s*(number|reg)|jamb\s*fail\s*(for|on)\s*(portal|nelfund)|nelfund\s*no\s*gree\s*(my\s*)?jamb|old\s*jamb\s*(no|not)\s*(gree|work)|direct\s*entry\s*jamb|jamb\s*202[0-5]\s*(no|not)\s*(gree|valid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 100', 'applying', entities, true)
  }

  if (
    /alert\s*never\s*come|salary\s*alert\s*no\s*dey|bank\s*app\s*(still|dey)\s*(0|zero|empty)|i\s*check\s*my\s*bank\s*(nothing|empty)|upkeep\s*never\s*show|stipend\s*never\s*(enter|drop)|dem\s*pay\s*school\s*only|school\s*don\s*see\s*am\s*i\s*never|how\s*far\s*(with\s*)?(the\s*)?(file|loan|upkeep)|e\s*still\s*dey\s*pending\s*abeg|pending\s*since\s*(january|feb|march|april|may|june|july|august|sept|oct)|three\s*weeks?\s*(now|already)\s*(no|never)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 100', 'waiting', entities, true)
  }

  if (
    /email\s*(don|has|already)\s*(dey|been)?\s*(use[d]?|taken)|this\s*mail\s*(don|has)\s*(dey|been)\s*use|i\s*(don|have)\s*(register|registered)\s*(before|last\s*year|last\s*session)|cannot\s*(sign\s*up|signup|create)\s*(again|with\s*this)|account\s*already\s*exist|profile\s*already\s*exist/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 100', 'applying', entities, true)
  }

  if (
    /institution\s*(no|not)\s*(dey|showing|appear)|my\s*uni\s*no\s*dey|poly\s*no\s*dey\s*(the\s*)?list|college\s*missing|search\s*(no|not)\s*(bring|show)\s*(my\s*)?school|school\s*name\s*no\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 100', 'applying', entities, true)
  }

  return null
}
