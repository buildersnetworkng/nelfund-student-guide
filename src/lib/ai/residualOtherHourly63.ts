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
 * Hour-63 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus: pending payout Pidgin that still leaked as other, plus wetin-happen-to-my-loan.
 */
export function residualOtherHourly63(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan|scheme)|why\s+dem\s+(create|form|bring)|nelfund\s+na\s+wetin|purpose\s+of\s+nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is'], 'Purpose leftover 63', 'exploring', entities)
  }

  if (
    /loan\s*(don|has|have)\s*(open|start)|upkeep\s*(don|has)\s*(open|start)|dem\s*don\s*open\s*(am|loan)|window\s*(don|dey)\s*open|una\s*don\s*announce/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'current'], 'Open window leftover 63', 'exploring', entities)
  }

  if (
    /wetin\s*(dey\s*)?(happen|sup|go\s*happen)\s*(to\s*)?(my\s*)?(loan|application|file|own)|e\s*still\s*dey\s*(pending|review|same)|una\s*never\s*pay|dem\s*never\s*pay|never\s*see\s*(alert|money|credit)|application\s*never\s*(move|change)|status\s*still\s*(the\s*)?same|i\s*don\s*(finish|complete)\s*(apply|application)|check\s*am\s*(for\s*)?me|no\s*money\s*enter\s*since|dashboard\s*(still\s*)?(0|zero|empty)|when\s*una\s*go\s*release|release\s*(my\s*)?(upkeep|money)|my\s*file\s*(no|not)\s*move/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 63', 'waiting', entities, true)
  }

  if (
    /jamb\s*(dey\s*)?(red|reject|wrong)|jamb\s*number\s*(no|not)\s*(gree|work)|utme\s*wahala|caps\s*(no|not)\s*(gree|match)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 63', 'applying', entities, true)
  }

  if (
    /mail\s*(don|already)\s*(dey|exist)|last\s*year\s*account|old\s*email|sign\s*in\s*no\s*gree|password\s*no\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['login'], 'Login leftover 63', 'applying', entities, true)
  }

  if (
    /school\s*name\s*(no|not)\s*dey|search\s*(my\s*)?school\s*(no|not)|list\s*no\s*carry\s*(my\s*)?school|institution\s*missing/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 63', 'applying', entities, true)
  }

  return null
}
