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
 * Hour-112 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * New pending sentence shapes that 111 still misses, plus email-used and extra JAMB.
 */
export function residualOtherHourly112(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /email\s*(already|don|has\s*been)\s*(used|exist|taken|register)/i.test(q) ||
    /i\s*(already\s*)?registered\s*(last\s*year|before|previously)/i.test(q) ||
    /cannot\s*create\s*(an?\s*)?account\s*(with\s*)?(this|dis)\s*email/i.test(q) ||
    /this\s*mail\s*(don|already)\s*(dey|exist)/i.test(q) ||
    /account\s*(already|don)\s*exist/i.test(q)
  ) {
    return hit('portal-login', 0.95, ['other'], 'Email already used leftover 112', 'applying', entities, true)
  }

  if (
    /they\s*have\s*not\s*paid\s*me|dem\s*never\s*pay\s*(me|us|my\s*own)/i.test(q) ||
    /when\s*(will|go)\s*i\s*(receive|collect|see)\s*(my\s*)?(upkeep|money|loan|stipend|allowance)/i.test(q) ||
    /i\s*applied\s*(last\s*year|last\s*session).{0,40}(still|yet|nothing|no\s*money)/i.test(q) ||
    /approved\s*(but|and)\s*(no|not|never)\s*(money|pay|disburse|alert)/i.test(q) ||
    /under\s*review\s*(for|since)\s*(months?|weeks?|long)/i.test(q) ||
    /my\s*file\s*(no|never|not)\s*(dey\s*)?(move|change|update)/i.test(q) ||
    /upkeep\s*(dey\s*)?(delay|late|slow)|upkeep\s*(never|no)\s*(enter|drop|show)/i.test(q) ||
    /disbursement\s*(never|no|not)\s*(come|enter|show|drop)/i.test(q) ||
    /(bank\s*)?account\s*(still\s*)?(empty|zero)|bank\s*(still\s*)?(empty|quiet)/i.test(q) ||
    /nelfund\s*(never|no)\s*(credit|pay)\s*me/i.test(q) ||
    /i\s*don\s*wait\s*since\s*(january|last\s*year|months?|weeks?)/i.test(q) ||
    /is\s*my\s*(loan|application)\s*(approved|done|ready)/i.test(q) ||
    /why\s*(my\s*)?(money|upkeep|loan)\s*(no|never|not)\s*(enter|drop|show)/i.test(q) ||
    /how\s*long\s*(before|till|until)\s*(they|dem|nelfund)\s*pay/i.test(q) ||
    /payment\s*(no|never|not)\s*(show|enter|drop)/i.test(q) ||
    /i\s*never\s*see\s*(alert|credit|money)/i.test(q) ||
    /awaiting\s*disbursement/i.test(q) ||
    /submitted\s*since\s*(last\s*)?(session|year|month).{0,30}(nothing|no\s*money|still)/i.test(q) ||
    /wetin\s*dey\s*hold\s*(my\s*)?(money|loan|file)/i.test(q) ||
    /my\s*own\s*(never|no)\s*(enter|pay|drop)/i.test(q)
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending leftover 112', 'waiting', entities, true)
  }

  if (
    /jamb\s*(dey\s*)?(reject|fail|bounce)/i.test(q) ||
    /my\s*jamb\s*(no|never)\s*(gree|work|pass)/i.test(q) ||
    /cannot\s*verify\s*(my\s*)?jamb/i.test(q) ||
    /jamb\s*(mismatch|no\s*match|not\s*matching)/i.test(q) ||
    /utme\s*(number|reg|no)\s*(wrong|invalid|fail)/i.test(q) ||
    /jamb\s*number\s*(not|no)\s*valid/i.test(q) ||
    /verification\s*failed\s*(on\s*)?(jamb|utme)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 112', 'applying', entities, true)
  }

  return null
}
