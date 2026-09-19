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
 * Hour-46 leftover catcher for admin other (324) + pending-status (70) + jamb (40).
 * Phrases that still fall through to official-sources / other.
 */
export function residualOtherHourly46(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis|this)|nelfund\s*(stand\s*for|na\s*wetin)|why\s*(dem|they|una|fg)\s*(create|form|bring)\s*(am|nelfund|dis\s*loan)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.93, ['what-is', 'other'], 'Purpose leftover 46', 'exploring', entities)
  }

  if (
    /nelfund\s*(still\s*)?(dey\s*)?(collect|accept)|dem\s*still\s*dey\s*(collect|accept)\s*(form|application)|loan\s*(window|form)\s*(still\s*)?(open|dey)|when\s*(nelfund|loan)\s*(go|will)\s*(open|close)|as\s*of\s*today/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 46', 'exploring', entities)
  }

  if (
    /this\s*mail\s*(don|has)\s*(dey|exist)|email\s*don\s*(dey|exist)|i\s*use\s*(am|this)\s*last\s*year|last\s*year\s*account|cannot\s*create\s*(new\s*)?account/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Last-year email leftover 46', 'applying', entities, true)
  }

  if (
    /jamb\s*(reg(istration)?\s*)?(no|number)\s*(no|not|never|reject|fail)|rejected\s*jamb|jamb\s*20(1|2)\d\s*(no|not|never)|old\s*utme|caps\s*(reject|fail|error)|de\s*jamb\s*(no|not)\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB year / CAPS leftover 46', 'applying', entities, true)
  }

  if (
    /(unilag|lasu|oou|yabatech|unilorin|ui|oau|uniben)\s*(no|not|never)\s*(dey|show|appear)|school\s*(name\s*)?(no|not)\s*(dey|appear)\s*(for|on)\s*(the\s*)?(list|portal)|institution\s*list\s*(empty|blank)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list', 'other'], 'Named school not showing leftover 46', 'applying', entities, true)
  }

  if (
    /una\s*never\s*pay\s*(me|am)|dem\s*never\s*pay\s*(me|am)|no\s*salary\s*(enter|drop)|nothing\s*(enter|drop)\s*(my\s*)?(account|bank)|account\s*still\s*(empty|zero)|two\s*months?\s*(i\s*)?(never|no)\s*(see|collect)\s*(upkeep|money|alert)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other', 'no-alert'],
      'Una never pay / empty account leftover 46',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /abeg\s*(check|help)\s*(my\s*)?(loan|status|am)|help\s*me\s*(check|see)\s*(status|loan)|i\s*wan\s*know\s*(my\s*)?(status|how\s*far)|track\s*nelfund/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.91,
      ['pending-status', 'other'],
      'Help me check leftover 46',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?(repay|pay\s*back)|how\s*(i|to)\s*(go\s*)?pay\s*(am\s*)?back|after\s*nysc\s*(how|when)|interest\s*(rate|percent)|gsi\s*(start|begin)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'When repay leftover 46', 'repaying', entities)
  }

  if (/who\s*(fit|can|qualify)\s*(apply|collect)|part\s*time\s*(fit|can)|private\s*(uni|school)\s*(fit|can)/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'Who qualify leftover 46', 'exploring', entities)
  }

  return null
}
