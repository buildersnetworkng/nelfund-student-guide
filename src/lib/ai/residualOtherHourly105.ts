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
 * Hour-105 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70.
 * Focus: pending-status and repayment shapes that still land as other.
 */
export function residualOtherHourly105(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /una\s*never\s*(send|pay|release)\s*(my\s*)?(own|money|upkeep|loan)/i.test(q) ||
    /i\s*apply\s*since\s+\w+.{0,20}(still|nothing|no\s*update)/i.test(q) ||
    /has\s*nelfund\s*(paid|credited|processed)\s*me/i.test(q) ||
    /check\s*if\s*(they|dem|una)\s*(have\s*)?(processed|paid|approved)\s*(mine|my\s*own)/i.test(q) ||
    /e\s*still\s*dey\s*(review|pending|process)/i.test(q) ||
    /no\s*credit\s*alert\s*since/i.test(q) ||
    /wetin\s*dey\s*hold\s*(my\s*)?(file|loan|application|own)/i.test(q) ||
    /dem\s*don\s*pay\s*(the\s*)?school.{0,24}(my\s*own|i|upkeep).{0,16}(empty|never)/i.test(q) ||
    /batch\s*\d+.{0,20}(i\s*never|i\s*no|my\s*own\s*never)/i.test(q) ||
    /my\s*dashboard\s*(still\s*)?(na|is|dey)?\s*(0|zero|empty|blank)/i.test(q) ||
    /nothing\s*don\s*(show|enter|drop)\s*(for\s*)?(my\s*)?(account|bank)/i.test(q) ||
    /i\s*never\s*see\s*(my\s*)?(own|money|alert|upkeep)/i.test(q) ||
    /file\s*(never|no|not)\s*(move|change|update)/i.test(q) ||
    /still\s*the\s*same\s*(status|word|thing)/i.test(q) ||
    /when\s*will\s*(i|my\s*account)\s*(see|get)\s*(the\s*)?(money|upkeep|alert)/i.test(q) ||
    /approved\s*but\s*(no|never|not)\s*(money|alert|credit)/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 105', 'waiting', entities, true)
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?(pay|repay)/i.test(q) ||
    /how\s*repayment\s*take\s*work/i.test(q) ||
    /una\s*go\s*cut\s*(my\s*)?salary/i.test(q) ||
    /after\s*(service|nysc).{0,16}(pay|repay)/i.test(q) ||
    /how\s*(do\s*i|to)\s*pay\s*(the\s*)?(loan|nelfund)\s*back/i.test(q) ||
    /repayment\s*(plan|schedule|start|date)/i.test(q)
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 105', 'repaying', entities)
  }

  if (
    /how\s*i\s*take\s*apply/i.test(q) ||
    /steps?\s*to\s*(register|apply|sign\s*up)/i.test(q) ||
    /i\s*wan(t)?\s*start\s*(the\s*)?(application|registration)/i.test(q) ||
    /walk\s*me\s*through\s*(apply|application|sign\s*up)/i.test(q)
  ) {
    return hit('how-to-apply', 0.9, ['how-to-apply'], 'Apply leftover 105', 'preparing', entities)
  }

  return null
}
