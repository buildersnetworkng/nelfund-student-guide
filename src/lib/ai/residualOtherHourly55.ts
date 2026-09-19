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
 * Hour-55 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Catch how-far-application, money-never-enter, last-year email, school list, invalid JAMB pidgin.
 */
export function residualOtherHourly55(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /email\s*(already|has\s*been|don)\s*(used|exist|registered|taken)|already\s*registered\s*(last\s*year|before|previously)|account\s*already\s*(exist|dey)|registered\s*last\s*year|use\s*(the\s*)?same\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login', 'other'], 'Email already used leftover 55', 'applying', entities, true)
  }

  if (
    /forgot\s*(my\s*)?(password|pass)|reset\s*(my\s*)?password|password\s*(no|not|never)\s*(work|dey\s*work)|cannot\s*sign\s*in|can'?t\s*(login|log\s*in|sign\s*in)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Forgot password leftover 55', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|come\s*out)\s*(for\s*)?(the\s*)?(list|portal)|my\s*school\s*(no|not)\s*(on|in|dey)\s*(the\s*)?list|institution\s*(not|no)\s*(listed|showing)|cannot\s*find\s*(my\s*)?school|school\s*no\s*dey\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list', 'other'], 'School not on list leftover 55', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never)\s*(dey\s*)?(work|verify|valid)|jamb\s*(number|reg)\s*(is\s*)?(wrong|invalid|rejected)|jamb\s*verification\s*(fail|failed)|e\s*say\s*jamb\s*(invalid|wrong)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb', 'other'], 'Invalid JAMB leftover 55', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(na\s*)?(my\s*)?(application|loan|upkeep)|wetin\s*dey\s*happen\s*(to\s*)?(my\s*)?(application|loan)|my\s*(application|loan)\s*(how\s*far|still\s*there)|status\s*(still\s*)?(processing|pending|under\s*review)|under\s*review\s*(since|still)|processing\s*since/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other'],
      'How far application leftover 55',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /money\s*never\s*(enter|drop|show|come)|upkeep\s*never\s*(enter|drop|show|come)|alert\s*never\s*(come|enter)|dem\s*never\s*pay\s*me|una\s*never\s*pay\s*me|when\s*(will|go)\s*(they|dem|una)\s*pay\s*me|i\s*never\s*see\s*(the\s*)?(money|upkeep|alert)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other'],
      'Money never enter leftover 55',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /account\s*creation\s*(still\s*)?(open|close)|sign\s*up\s*(still\s*)?(open|dey)|can\s*i\s*(still\s*)?(create|open)\s*(an?\s*)?account|registration\s*(still\s*)?(open|dey\s*open)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'other'], 'Account creation open leftover 55', 'exploring', entities)
  }

  if (
    /apply\s*(again|this\s*year)|last\s*year\s*(i\s*)?(apply|applied)|re-?apply|new\s*session\s*application|i\s*don\s*apply\s*(before|last\s*year)/i.test(
      q,
    )
  ) {
    return hit('reapplication', 0.9, ['reapply', 'other'], 'Reapply leftover 55', 'preparing', entities)
  }

  if (/opay|palmpay|moniepoint|change\s*(my\s*)?bank|wallet\s*(no|not)\s*(work|accept)/i.test(q)) {
    return hit('bank-information', 0.91, ['bank', 'other'], 'Wallet / change bank leftover 55', 'applying', entities, true)
  }

  if (/private\s*(university|uni|poly|school)|can\s*private\s*(school|uni)\s*apply/i.test(q)) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Private school leftover 55', 'exploring', entities)
  }

  if (/\bnysc\b|i\s*(don|have)\s*graduate|after\s*graduation\s*(fit|can)\s*apply/i.test(q) && /nelfund|loan|apply|upkeep/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'Graduate / NYSC leftover 55', 'exploring', entities)
  }

  if (/^(\?+|ok|okay|hmm+|abeg|pls|please)\s*$/i.test(q)) {
    return hit('how-to-apply', 0.55, ['empty', 'other'], 'Tiny noise leftover 55', 'exploring', entities)
  }

  return null
}
