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
 * Hour-121 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70.
 * New pending / payout-wait sentence shapes plus school-not-found hard route.
 */
export function residualOtherHourly121(text: string, entities: string[]): IntentResult | null {
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
    /e\s*never\s*(move|change|update)|file\s*still\s*dey\s*(there|pending|same)|dem\s*hold\s*my\s*(file|loan|application)|processing\s*for\s*(weeks|months|long)|i\s*check\s*(am|it)\s*(everyday|every\s*day|daily)|status\s*write\s*pending|una\s*see\s*my\s*file|my\s*loan\s*still\s*stand|no\s*credit\s*alert|upkeep\s*never\s*(enter|drop|show|land)|school\s*fee\s*never\s*(pay|enter|go)|dem\s*never\s*disburse|when\s*una\s*go\s*pay\s*me|i\s*never\s*collect\s*(anything|am)|my\s*dashboard\s*still\s*(zero|0)|nothing\s*for\s*my\s*account|e\s*dey\s*pending\s*since|since\s*(january|february|march|april|may|june|july|august|september|october|last\s*year).{0,20}(pending|no\s*money)|i\s*submit\s*(finish|already)\s*(na|now)?\s*(how\s*far)?|application\s*dey\s*sleep|e\s*no\s*dey\s*move\s*at\s*all/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 121', 'waiting', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|showing|appear)|my\s*school\s*(no|not)\s*(dey|on)\s*(the\s*)?list|institution\s*(missing|not\s*(on|in)\s*(the\s*)?list)|cannot\s*find\s*(my\s*)?(school|institution)|dropdown\s*(no|not)\s*(show|carry)|school\s*missing\s*on\s*portal|my\s*uni\s*(no|not)\s*(dey|show)|poly\s*(no|not)\s*dey\s*list|school\s*name\s*(no|not)\s*dey|institution\s*no\s*dey\s*portal/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 121', 'applying', entities, true)
  }

  if (
    /email\s*(don|already)\s*(dey|used|exist)|i\s*register\s*last\s*year|cannot\s*create\s*(account|profile)\s*with\s*(this|dis)\s*email|this\s*mail\s*(don|already)\s*dey|account\s*already\s*there/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 121', 'applying', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(no|not)\s*(valid|correct)|verification\s*failed\s*on\s*jamb|invalid\s*jamb|jamb\s*verification\s*fail/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 121', 'applying', entities, true)
  }

  return null
}
