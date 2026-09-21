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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-81 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still fall into other.
 */
export function residualOtherHourly81(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop|pay)|processing|under\s*review|approved|empty|zero|alert/.test(low)) {
    return null
  }

  if (
    /e\s*(still\s*)?dey\s*(processing|process)|still\s*dey\s*(process|processing)|status\s*(still|dey)\s*(processing|process)|loan\s*(still\s*)?(under|dey)\s*process|application\s*(dey|is|still)\s*(processing|in\s*progress)|processing\s*(no|not|never)\s*(finish|end|clear)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Still processing leftover 81', 'waiting', entities, true)
  }

  if (
    /portal\s*(still\s*)?(say|dey\s*say|shows?|showing)\s*(pending|review|processing)|e\s*still\s*(say|dey)\s*pending|application\s*(never|no)\s*(leave|comot)\s*pending|my\s*(own|file|loan)\s*(never|no)\s*(leave|comot)\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Portal still pending leftover 81', 'waiting', entities, true)
  }

  if (
    /wetin\s*(dey\s*)?happen\s*(to\s*)?(my\s*)?(application|loan|file|own)|wetin\s*dey\s*sup\s*(with\s*)?(my\s*)?(loan|application)|how\s*my\s*(application|loan)\s*(dey|go)|abeg\s*(check|look)\s*(my\s*)?(application|loan|file)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'What happen to my file leftover 81', 'waiting', entities, true)
  }

  if (
    /i\s*(don|have)\s*submit\s*(everything|all)|submit\s*(everything|all).{0,24}(nothing|no\s*update|pending)|everything\s*(don|has)\s*(enter|go).{0,20}(nothing|pending|no\s*pay)|i\s*finish\s*(the\s*)?(form|application).{0,24}(nothing|pending|no\s*money)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Submitted everything leftover 81', 'waiting', entities, true)
  }

  if (
    /application\s*(don|has)\s*tey\s*(pending|for\s*pending)|e\s*don\s*tey\s*(pending|since)|pending\s*don\s*tey|two\s*months?\s*(still|dey)\s*pending|since\s*last\s*(session|semester).{0,24}pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending don tey leftover 81', 'waiting', entities, true)
  }

  if (
    /una\s*don\s*pay\s*(others|people|classmates)|dem\s*don\s*pay\s*(others|people).{0,20}(i\s*)?never|others\s*don\s*(collect|see\s*alert).{0,16}(i\s*)?never|classmates?\s*don\s*(collect|receive)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Others paid leftover 81', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number|reg)\s*(no|not|never)\s*(valid|gree|work)|invalid\s*(jamb|utme)|verification\s*failed\s*(on\s*)?(jamb|utme)|jamb\s*(verification\s*)?(fail|failed|reject)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'Invalid JAMB leftover 81', 'applying', entities, true)
  }

  if (
    /email\s*already\s*(used|exist|dey)|i\s*register(ed)?\s*last\s*year|cannot\s*create\s*account\s*with\s*(this|dis)\s*email|this\s*email\s*(don|has)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email used leftover 81', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?(list|dropdown)|my\s*school\s*no\s*dey|institution\s*missing\s*(on\s*)?(the\s*)?portal|school\s*not\s*showing/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School not showing leftover 81', 'applying', entities, true)
  }

  return null
}
