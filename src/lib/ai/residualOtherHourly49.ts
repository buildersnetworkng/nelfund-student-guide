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
 * Hour-49 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus: pending-status phrases that still land in other (how far my own, dashboard zero, no SMS).
 */
export function residualOtherHourly49(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 49', 'exploring', entities)
  }

  if (/^[.?!,\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 49', 'exploring', entities)
  }

  if (
    /\b(utme|reg(istration)?\s*no|jamb\s*(no|number|reg))\b.{0,20}(no|not|never|invalid|fail|wrong|gree)|verification\s*(fail|failed|error).{0,16}\bjamb\b|cannot\s*verify\s*jamb|jamb\s*no\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB leftover 49', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(my|na|now|abeg)|wetin\s*dey\s*happen\s*(to\s*)?(my\s*)?(application|loan|own)|status\s*(no|not|never)\s*(change|move|update)|same\s*(thing|status|word)\s*since|dashboard\s*(still\s*)?(zero|0|empty|blank)|total\s*(is\s*)?(still\s*)?(0|zero)|no\s*(sms|alert|credit|notification)|bank\s*(never|no)\s*(show|enter|reflect)|una\s*forget\s*me|everybody\s*(don|have)\s*(collect|get).{0,20}(except|only)\s*me|i\s*apply\s*since|since\s*(january|february|march|april|may|june|july|august|september|last\s*year|last\s*month)|check\s*my\s*own|my\s*own\s*(never|no)\s*(show|enter|drop)|upkeep\s*(dey|never|no)\s*(come|enter)|school\s*fee\s*(don|has)\s*pay.{0,20}(upkeep|me)\s*(never|no)|when\s*money\s*go\s*enter|money\s*go\s*enter\s*when/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Pending leftover 49 how-far / dashboard / no SMS',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /account\s*creation\s*(still\s*)?(open|dey)|fit\s*i\s*sign\s*up\s*now|loan\s*(and\s*)?upkeep\s*(open|close|window)|as\s*of\s*today.{0,20}(open|close)|dem\s*don\s*open\s*(loan|upkeep|am)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Open window leftover 49', 'exploring', entities)
  }

  if (/email\s*(don|already)\s*(dey|exist|use)|i\s*register\s*(last\s*)?year|use\s*(the\s*)?old\s*(email|account)/i.test(q)) {
    return hit('portal-login', 0.92, ['login', 'other'], 'Email already used leftover 49', 'applying', entities, true)
  }

  if (/school\s*(no|not)\s*dey\s*(show|appear|list)|i\s*no\s*see\s*my\s*school|institution\s*(no|not)\s*dey/i.test(q)) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School list leftover 49', 'applying', entities, true)
  }

  if (/wetin\s*nelfund\s*mean|why\s*una\s*create\s*(this|dis|am)|nelfund\s*na\s*wetin/i.test(q)) {
    return hit('what-is-nelfund', 0.93, ['what-is', 'other'], 'Purpose leftover 49', 'exploring', entities)
  }

  return null
}
