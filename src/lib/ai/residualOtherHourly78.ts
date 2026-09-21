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
 * Hour-78 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status shapes that still fall into other.
 */
export function residualOtherHourly78(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop|pay)|processing|under\s*review|approved/.test(low)) {
    return null
  }

  if (
    /how\s*far\s*(my|with)\s*(own|application|loan|file)|money\s*never\s*(enter|show|drop|reflect)|status\s*(still|dey)\s*(processing|pending|review)|dem\s*never\s*pay\s*(me|am)|when\s*(will|go)\s*(i|una)\s*(get|see)\s*(paid|pay|money|upkeep)|no\s*update\s*(on|for)\s*(my\s*)?(application|loan|file)|i\s*don\s*apply\s*since|payment\s*(no|never|not)\s*(show|enter|reflect)|submitted\s*(last\s*)?(year|month|week).{0,24}(still|pending|nothing)|my\s*(own|file)\s*still\s*(pending|processing)|they\s*never\s*(credit|pay)\s*me|upkeep\s*never\s*(enter|show|drop)|loan\s*never\s*(enter|reflect)|i\s*never\s*see\s*(alert|credit|money)|awaiting\s*(disbursement|payment|approval)|disburse[d]?\s*(never|no|not)|batch\s*(never|no)\s*(come|drop)|how\s*long\s*(will|go)\s*(this|am|e)\s*(take|dey)|e\s*don\s*take\s*(too\s*)?(long|time)|una\s*go\s*pay\s*when|when\s*una\s*go\s*pay/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 78', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number|no|reg)\s*(not|no)\s*(valid|correct)|verification\s*failed\s*(on\s*)?(jamb|utme)|jamb\s*(no\s*)?(gree|work)|caps\s*(reject|failed)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 78', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|i\s*registered\s*last\s*year|cannot\s*create\s*(account|acct).{0,20}email|this\s*mail\s*(don|already)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other'], 'Email used leftover 78', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey)|my\s*school\s*no\s*dey\s*(list|portal)|institution\s*(missing|no\s*dey)|school\s*no\s*appear/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 78', 'applying', entities, true)
  }

  return null
}
