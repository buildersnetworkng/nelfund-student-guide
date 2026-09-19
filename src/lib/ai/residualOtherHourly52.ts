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
 * Hour-52 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus: pending-status misfires first, then JAMB / live window / purpose leftovers.
 */
export function residualOtherHourly52(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 52', 'exploring', entities)
  }

  if (/^[.?!,\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 52', 'exploring', entities)
  }

  if (
    /\b(pending|under\s*review|processing)\b|how\s*far|money\s*(never|no)\s*(enter|drop)|e\s*never\s*(enter|drop|show)|nothing\s*don\s*(enter|drop)|status\s*(no|not)\s*(change|move)|same\s*pending|i\s*dey\s*wait|when\s*(una|dem)\s*go\s*pay/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other'],
      'Pending leftover 52 core',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /no\s*(alert|credit)|bank\s*(still\s*)?(empty|zero)|account\s*(still\s*)?(empty|zero)|upkeep\s*(never|no)\s*(land|enter|drop)|i\s*never\s*see\s*(alert|money|upkeep)|dem\s*pay\s*(school|everybody).{0,20}(me\s*)?(never|no)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Empty bank leftover 52',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /invalid\s*jamb|jamb\s*(invalid|wrong|reject|fail|error|no\s*gree)|utme\s*(invalid|wrong)|caps.{0,16}(no|not)|old\s*jamb|registration\s*number.{0,16}(invalid|wrong)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb', 'other'], 'JAMB leftover 52', 'applying', entities, true)
  }

  if (
    /as\s*of\s*(today|now)|is\s+(nelfund|loan|portal|application)\s+(still\s+)?(open|closed)|deadline|can\s*i\s*still\s*apply|dem\s*still\s*dey\s*(collect|open)|loan\s*(window|application)\s*(open|close)|account\s*creation\s*(open|dey)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.92, ['open-status', 'other'], 'Open window leftover 52', 'exploring', entities)
  }

  if (
    /wetin\s*(be|mean)\s*(this\s*)?(nelfund|loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)\s*nelfund|purpose\s*of\s*(nelfund|this\s*loan)|nelfund\s*na\s*(wetin|scholarship|grant)|what\s*is\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is', 'other'], 'Purpose leftover 52', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(exist|use|dey)|registered\s*last\s*year|i\s*use\s*(am|this)\s*last\s*year|old\s*account|cannot\s*create\s*(new\s*)?account/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email leftover 52', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|institution\s*(missing|no\s*dey)|not\s*on\s*(the\s*)?list|search\s*school\s*(no|not)\s*(work|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list', 'other'], 'School list leftover 52', 'applying', entities, true)
  }

  if (/repay|gsi|when\s*(i|we)\s*go\s*pay\s*back|after\s*(nysc|school)\s*repay|interest\s*rate/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Repay leftover 52', 'exploring', entities)
  }

  return null
}
