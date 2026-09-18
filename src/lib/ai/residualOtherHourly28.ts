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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(
    q,
  )
}

/** 18 Sep 07:18 WAT: unknown 602, other 324, pending-status 70, jamb 40. */
export function residualOtherHourly28(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null

  if (
    /status\s*(no|not|never|still)|check\s*(my\s*)?(loan|app|application)|application\s*(status|stage)|see\s*(my\s*)?status|wetin\s*(be\s*)?(my\s*)?status|how\s*far\s*(with\s*)?(my\s*)?(loan|app|money)|money\s*(never|no)\s*(enter|drop|show|reflect)|alert\s*(never|no)\s*(enter|drop)|under\s*review|still\s*(on\s*)?pending|dem\s*never\s*pay|una\s*never\s*pay|e\s*never\s*enter/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'Status / money never enter leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /invalid\s*(jamb|utme)|jamb\s*(number\s*)?(invalid|wrong|error|fail|reject|no\s*gree)|utme\s*(invalid|wrong|fail)|jamb\s*(no|not|never)\s*(dey|work|gree|match)|wrong\s*jamb|jamb\s*wahala|registration\s*number\s*(invalid|wrong)/i.test(
      q,
    )
  ) {
    return hit(
      'jamb-verification',
      0.9,
      ['jamb', 'other'],
      'Invalid JAMB leftover',
      'applying',
      entities,
      true,
    )
  }

  if (
    /email\s*(already\s*)?(used|exist|taken)|registered\s*last\s*year|account\s*already|i\s*(don|have)\s*(register|create).{0,20}last\s*year|use\s*(the\s*)?same\s*mail/i.test(
      q,
    )
  ) {
    return hit(
      'portal-login',
      0.9,
      ['login', 'other'],
      'Email already used leftover',
      'applying',
      entities,
      true,
    )
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*there/i.test(
      q,
    )
  ) {
    return hit(
      'school-not-found',
      0.88,
      ['school-list', 'other'],
      'School not showing leftover',
      'applying',
      entities,
      true,
    )
  }

  if (/wetin\s*be\s*(nelfund|dis\s*loan|this\s*loan)|na\s*wetin\s*nelfund|tell\s*me\s*about\s*nelfund/i.test(q)) {
    return hit('what-is-nelfund', 0.86, ['what-is', 'other'], 'What is NELFUND leftover', 'exploring', entities)
  }

  return null
}
