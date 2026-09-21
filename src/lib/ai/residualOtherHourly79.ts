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
 * Hour-79 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes still landing in other.
 */
export function residualOtherHourly79(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop|pay)|processing|under\s*review|approved|empty|zero|alert/.test(low)) {
    return null
  }

  if (
    /na\s*only\s*me\s*never(\s*collect)?|only\s*me\s*never\s*(collect|see|get)|mates?\s*don\s*(collect|receive|see\s*pay)|zero\s*naira|acct\s*still\s*empty|account\s*(still\s*)?(empty|quiet)|dashboard\s*(still\s*)?(na\s*)?(0|zero)|nothing\s*don\s*(drop|enter|show)|file\s*dey\s*sleep|loan\s*dey\s*sleep|una\s*forget\s*(my\s*)?(own|file)|application\s*hang|e\s*hang|status\s*no\s*change|e\s*remain\s*pending|wetin\s*dey\s*happen\s*to\s*(my\s*)?(loan|file|own|application)|no\s*(credit\s*)?alert|under\s*review\s*since|processing\s*since|still\s*on\s*(pending|processing|review)|e\s*still\s*dey\s*(review|process|pending)|school\s*don\s*(collect|receive).{0,20}(i|me)\s*never|approved\s*but\s*(no|never)\s*(money|pay|alert)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 79', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number|reg)?\s*(no|not)\s*(gree|work|valid)|utme\s*(no|not)\s*(valid|gree)|caps\s*(no|not)\s*(gree|show)|admission\s*(no|not)\s*(show|dey)\s*(for\s*)?(jamb|caps)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 79', 'applying', entities, true)
  }

  if (
    /same\s*mail\s*(from\s*)?last\s*year|old\s*email\s*(no|not)\s*(gree|work)|forgot\s*(my\s*)?password|otp\s*(no|not|never)\s*(come|enter|show)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['other'], 'Login leftover 79', 'applying', entities, true)
  }

  if (
    /institution\s*(no|not)\s*(dey|appear|show)|school\s*name\s*(no|not)\s*(dey|appear)|poly\s*(no|not)\s*dey\s*list|college\s*(no|not)\s*dey\s*list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 79', 'applying', entities, true)
  }

  return null
}
