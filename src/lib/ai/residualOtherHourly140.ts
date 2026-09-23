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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept/i.test(
    q,
  )
}

/**
 * Hourly 140 2026-09-23: jamb is the next named unknown topic (40)
 * after pending-status. Cover more sentence shapes that still land in other.
 */
export function residualOtherHourly140(text: string, entities: string[]): IntentResult | null {
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
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|correct|working)|jamb\s*(verification|verify)\s*(failed|fail|no\s*gree)|verification\s*failed\s*(on|for)\s*jamb|jamb\s*no\s*dey\s*(work|gree)|my\s*jamb\s*(no|not)\s*(dey|work|valid)|e\s*say\s*jamb\s*(invalid|wrong)|portal\s*reject\s*(my\s*)?jamb|jamb\s*reg\s*(no|number)\s*(wrong|invalid)|utme\s*(number|reg)\s*(invalid|fail)|jamb\s*wahala|dem\s*say\s*my\s*jamb\s*(no|not)\s*correct|cannot\s*verify\s*(my\s*)?jamb|jamb\s*details\s*(no|not)\s*match|admission\s*letter\s*jamb\s*(no|not)|jamb\s*and\s*nin\s*(no|not)\s*match/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.96, ['jamb'], 'JAMB paraphrase 140', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|exist)|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*with\s*this\s*email|this\s*mail\s*don\s*dey|account\s*already\s*exist/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['login'], 'Email used paraphrase 140', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing|my\s*school\s*no\s*dey\s*(the\s*)?list|institution\s*missing\s*on\s*(the\s*)?portal|school\s*no\s*dey\s*appear/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.95, ['school-list'], 'School missing paraphrase 140', 'applying', entities, true)
  }

  return null
}
