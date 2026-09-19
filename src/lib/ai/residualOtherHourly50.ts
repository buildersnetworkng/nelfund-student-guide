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
 * Hour-50 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus: remaining "other" that is actually pending, JAMB, login, purpose, or live window.
 */
export function residualOtherHourly50(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 50', 'exploring', entities)
  }

  if (/^[.?!,\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 50', 'exploring', entities)
  }

  if (
    /\b(agent|middleman|pay\s*(una|dem|somebody)|who\s*go\s*help\s*me\s*apply|i\s*wan\s*pay\s*person)\b/i.test(q)
  ) {
    return hit('how-to-apply', 0.9, ['other'], 'Agent leftover 50', 'applying', entities, true)
  }

  if (
    /jamb.{0,24}(invalid|wrong|no\s*gree|reject|fail|error)|caps.{0,16}(no|not)|old\s*jamb|direct\s*entry.{0,16}jamb|registration\s*number.{0,16}(invalid|wrong)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB leftover 50', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(now|abeg|my\s*own)|my\s*own\s*(never|no|still)|una\s*forget\s*my\s*own|nothing\s*don\s*(enter|drop|show)|e\s*never\s*(drop|enter|show)|i\s*never\s*see\s*(alert|money|upkeep)|bank\s*(still\s*)?(empty|zero)|account\s*still\s*(empty|zero)|dem\s*pay\s*(school|everybody).{0,24}(me\s*)?(never|no)|when\s*(una|dem)\s*go\s*pay\s*me|i\s*dey\s*check\s*(since|everyday)|status\s*no\s*dey\s*move|same\s*pending|still\s*pending\s*(abeg)?/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Pending leftover 50 how-far / empty bank / same pending',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /fit\s*i\s*(still\s*)?(register|sign\s*up|create\s*account)|account\s*creation\s*(dey|open)|loan\s*(window|application)\s*(open|close|dey)|as\s*of\s*(today|now).{0,24}(open|close)|dem\s*don\s*announce\s*(date|window)|deadline\s*(for\s*)?(2026|2027|this\s*year)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Open window leftover 50', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(exist|use|dey)|i\s*use\s*(am|this)\s*last\s*year|old\s*account|cannot\s*create\s*(new\s*)?account|account\s*already\s*exist/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['login', 'other'], 'Email already used leftover 50', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|institution\s*(missing|no\s*dey)|my\s*school\s*no\s*dey\s*(the\s*)?list|poly(technic)?\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School list leftover 50', 'applying', entities, true)
  }

  if (
    /wetin\s*(be|na)\s*nelfund|why\s*(dem|una|fg)\s*create\s*nelfund|nelfund\s*purpose|nelfund\s*na\s*scholarship|na\s*grant\s*or\s*loan/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.93, ['what-is', 'other'], 'Purpose leftover 50', 'exploring', entities)
  }

  if (/repay|gsi|when\s*(i|we)\s*go\s*pay\s*back|life\s*jail|salary\s*deduct/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Repayment leftover 50', 'exploring', entities)
  }

  return null
}
