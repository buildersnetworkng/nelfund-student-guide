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
 * Hour-65 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus: batch / credit / dashboard-zero / mates-don-collect that still leak as other.
 */
export function residualOtherHourly65(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|mean)\s*(nelfund|dis\s*loan|this\s*scheme)|nelfund\s*(stand\s*for|na\s*wetin)|why\s*(fg|government)\s*(bring|create)\s*(am|nelfund)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is'], 'Purpose leftover 65', 'exploring', entities)
  }

  if (
    /(is\s*)?(loan|upkeep)\s*(window|application)\s*(open|close|don\s*open)|dem\s*still\s*dey\s*(open|collect)|as\s*of\s*(today|now).{0,24}(open|close)|when\s*(go|will)\s*(loan|upkeep)\s*open/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'current'], 'Open leftover 65', 'exploring', entities)
  }

  if (
    /batch\s*\d+|which\s*batch|next\s*disburse|credit\s*(alert|never)|dashboard\s*(still\s*)?(0|zero|empty)|mates?\s*(don|have)\s*(collect|receive|see\s*alert)|class\s*(don|have)\s*(collect|receive)|wetin\s*happen\s*to\s*my\s*(money|upkeep|loan)|i\s*apply\s*(last|since)\s*(month|week)|nothing\s*(don|has)\s*(enter|drop|show)|no\s*pay\s*list|name\s*no\s*dey\s*(pay\s*)?list|when\s*(dem|they)\s*go\s*credit|processing\s*for\s*(weeks|months)|still\s*on\s*(pending|review)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 65', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not)\s*(gree|correct|verify)|utme\s*number\s*(wrong|invalid)|caps\s*(no|not)\s*(match|gree)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 65', 'applying', entities, true)
  }

  if (
    /email\s*(don|already)\s*(dey|used|exist)|last\s*year\s*(account|email)|old\s*account\s*(no|not)\s*(open|gree)|forgot\s*password/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 65', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show)\s*(for\s*)?(the\s*)?(list|portal)|institution\s*(no|not)\s*(appear|show)|search\s*school\s*(empty|blank)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 65', 'applying', entities, true)
  }

  if (
    /when\s*(do\s*i|i\s*go|to)\s*(start\s*)?(repay|pay\s*back)|after\s*nysc.{0,16}(pay|repay)|life\s*jail/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 65', 'repaying', entities)
  }

  return null
}
