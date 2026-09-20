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

/**
 * Hour-70 leftover catcher.
 * Live 2026-09-20 17:05Z: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30.
 * Focus: pending-status sentence shapes that still fall into unknown/other.
 */
export function residualOtherHourly70(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /how\s*far\s*(my|una|the)\s*(own|app|application|loan)|my\s*own\s*(never|no|never)\s*(drop|enter|show|move)|dem\s*pay\s*(others|people|mates)|others\s*(don|have)\s*(collect|receive)|approved\s*but\s*(no|zero|never)\s*(money|alert|pay)|why\s*(my|una)\s*own\s*dey\s*(delay|sleep)|status\s*(still|dey)\s*(processing|in\s*progress|submitted)|still\s*on\s*(submitted|processing|pending)|when\s*(will|go)\s*(my\s*)?(application|file)\s*(leave|comot|move)\s*pending|i\s*apply\s*(last|this)\s*(session|year)\s*nothing|e\s*never\s*reflect\s*(for|on)\s*(school|bursary)|loan\s*approved\s*(waiting|awaiting)\s*disburse|waiting\s*(for\s*)?(disburse|verification|approval)|processing\s*since\s*(last|last\s*year|january|months)|my\s*application\s*is\s*pending|money\s*never\s*enter|e\s*dey\s*say\s*(in\s*progress|processing|submitted)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 70', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number|reg)\s*(no|not|never)\s*(valid|gree|work)|invalid\s*jamb|verification\s*failed\s*on\s*jamb|jamb\s*wahala|utme\s*(no|not)\s*valid/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 70', 'applying', entities, true)
  }

  if (
    /email\s*already\s*(used|taken|exist)|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*with\s*this\s*email|mail\s*don\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 70', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing|my\s*school\s*no\s*dey\s*list|institution\s*missing\s*on\s*portal|school\s*no\s*dey\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 70', 'applying', entities, true)
  }

  return null
}
