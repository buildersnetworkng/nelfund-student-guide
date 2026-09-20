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
 * Hour-61 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Target leftover "other": wan apply, reject, grant vs loan, session, ND/HND, repay start, institutional charges.
 */
export function residualOtherHourly61(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /i\s*wan(t)?\s*(to\s*)?apply|how\s*i\s*(go|fit)\s*apply|guide\s*me\s*(to\s*)?apply|start\s*(my\s*)?(application|registration)|i\s*wan(t)?\s*(to\s*)?(create|open)\s*(account|profile)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.92, ['how-to-apply', 'other'], 'Want to apply leftover 61', 'preparing', entities)
  }

  if (
    /dem\s*(don\s*)?(reject|decline)\s*(me|am|my)|my\s*(loan|application)\s*(don\s*)?(reject|decline)|status\s*(na|is)\s*(reject|declin)|rejected\s*(application|loan)/i.test(
      q,
    )
  ) {
    return hit('rejected-application', 0.92, ['other'], 'Rejected leftover 61', 'rejected', entities, true)
  }

  if (
    /na\s*(grant|scholarship)|is\s*(it|nelfund|this)\s*(a\s*)?(grant|scholarship|free)|loan\s*or\s*(grant|scholarship)|dem\s*go\s*collect\s*(am|back)|do\s*i\s*(need|have)\s*to\s*pay\s*(back|am)/i.test(
      q,
    )
  ) {
    return hit('loan-or-scholarship', 0.9, ['other'], 'Grant vs loan leftover 61', 'exploring', entities)
  }

  if (
    /session\s*registration|academic\s*session|wrong\s*session|choose\s*(the\s*)?session|202[4-7]\s*\/\s*202[5-8]/i.test(
      q,
    ) &&
    !/deadline|open|close/i.test(q)
  ) {
    return hit('academic-session', 0.88, ['other'], 'Session leftover 61', 'applying', entities, true)
  }

  if (
    /\b(nd|hnd|nce)\b|polytechnic|college\s*of\s*education|federal\s*poly|state\s*poly/i.test(q) &&
    /apply|eligible|fit|qualify|nelfund/i.test(q)
  ) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'ND/HND/poly leftover 61', 'exploring', entities)
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?(repay|pay\s*back)|after\s*(school|graduation|nysc).{0,20}(pay|repay)|repayment\s*(start|begin|period)|how\s*(i|to)\s*pay\s*(back|am)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Repay start leftover 61', 'repaying', entities)
  }

  if (
    /institutional\s*charges?|school\s*charges?|tuition\s*(loan|pay)|fees?\s*(go|goes|dey)\s*(to\s*)?(school|bursary)/i.test(
      q,
    )
  ) {
    return hit('institutional-charges', 0.88, ['fees', 'other'], 'Institutional charges leftover 61', 'waiting', entities)
  }

  if (
    /guarantor|surety|who\s*(go|will)\s*stand|parent\s*(need|must)\s*(sign|guarantee)/i.test(q)
  ) {
    return hit('guarantor', 0.88, ['other'], 'Guarantor leftover 61', 'preparing', entities)
  }

  if (
    /i\s*don\s*(already\s*)?pay\s*(my\s*)?(school\s*)?fees?|already\s*paid\s*(from\s*)?(pocket|my\s*money)|refund\s*(my\s*)?(fees?|money)/i.test(
      q,
    )
  ) {
    return hit('refund', 0.9, ['refund', 'other'], 'Already paid / refund leftover 61', 'waiting', entities, true)
  }

  if (
    /^(check\s*(am|my\s*(loan|status|application))|i\s*wan(t)?\s*(to\s*)?check|status\s*abeg|wetin\s*be\s*my\s*status)\??$/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.9, ['pending-status', 'other'], 'Check status leftover 61', 'waiting', entities, true)
  }

  return null
}
