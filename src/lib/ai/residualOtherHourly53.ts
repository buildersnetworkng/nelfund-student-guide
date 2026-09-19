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
 * Hour-53 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Focus leftover other: amount, no-admission, apply-for-me, screenshot-only, change-school.
 */
export function residualOtherHourly53(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 53', 'exploring', entities)
  }

  if (/^[.?!,\\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 53', 'exploring', entities)
  }

  if (
    /how\s*much(\s*(na|is|be))?\s*(the\s*)?(upkeep|stipend|allowance|loan|money|dem\s*go\s*pay|una\s*go\s*give)|how\s*much\s*(dem|una|they)\s*go\s*(pay|give)|wetin\s*(be\s*)?(the\s*)?(amount|figure)|upkeep\s*(amount|how\s*much)|loan\s*amount|na\s*how\s*much/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.9, ['other', 'upkeep'], 'How much leftover 53', 'exploring', entities)
  }

  if (
    /(no|never|not|i\s*no\s*get)\s*(admission|offer)|without\s*(admission|jamb\s*admission)|i\s*never\s*(get|collect)\s*admission|can\s*i\s*apply\s*without\s*(admission|school)|awaiting\s*(admission|result)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.91, ['other', 'eligibility'], 'No admission leftover 53', 'preparing', entities)
  }

  if (
    /apply\s*(for\s*)?(me|am)|help\s*me\s*(apply|fill|register)|fill\s*(the\s*)?(form|portal)\s*for\s*me|una\s*fit\s*apply\s*for\s*me|do\s*the\s*application\s*for\s*me/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['other', 'how-to-apply'], 'Apply-for-me leftover 53', 'preparing', entities)
  }

  if (
    /change\s*(of\s*)?(school|institution|course)|i\s*(wan|want)\s*(to\s*)?change\s*(school|course)|transfer\s*(to\s*)?(another|new)\s*school|wrong\s*school\s*(dey|show)/i.test(
      q,
    )
  ) {
    return hit(
      'profile-update',
      0.9,
      ['other', 'profile'],
      'Change school leftover 53',
      'applying',
      entities,
      true,
    )
  }

  if (
    /screenshot|screen\s*shot|see\s*(the\s*)?(pic|photo|image)|i\s*(send|don\s*send|drop)\s*(pic|photo|image)|look\s*this\s*(pic|photo)|wetin\s*this\s*(error|message)\s*mean/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.82,
      ['other', 'pending-status'],
      'Screenshot leftover 53',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /\b(pending|under\s*review|processing)\b|how\s*far\s*(my|this|the)?\s*(loan|am|money|application)|money\s*(never|no)\s*(enter|drop)|e\s*never\s*(enter|drop|show)|nothing\s*don\s*(enter|drop)|i\s*dey\s*wait|when\s*(una|dem)\s*go\s*pay/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Pending leftover 53 core',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /invalid\s*jamb|jamb\s*(invalid|wrong|reject|fail|error|no\s*gree)|utme\s*(invalid|wrong)|old\s*jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb', 'other'], 'JAMB leftover 53', 'applying', entities, true)
  }

  if (
    /as\s*of\s*(today|now)|is\s+(nelfund|loan|portal|application)\s+(still\s+)?(open|closed)|deadline|can\s*i\s*still\s*apply|account\s*creation\s*(open|dey)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.92, ['open-status', 'other'], 'Open window leftover 53', 'exploring', entities)
  }

  if (
    /wetin\s*(be|mean)\s*(this\s*)?(nelfund|loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)\s*nelfund|purpose\s*of\s*(nelfund|this\s*loan)|what\s*is\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is', 'other'], 'Purpose leftover 53', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(exist|use|dey)|registered\s*last\s*year|old\s*account|cannot\s*create\s*(new\s*)?account/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email leftover 53', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|institution\s*(missing|no\s*dey)|not\s*on\s*(the\s*)?list/i.test(q)
  ) {
    return hit('school-not-found', 0.92, ['school-list', 'other'], 'School list leftover 53', 'applying', entities, true)
  }

  if (/repay|gsi|when\s*(i|we)\s*go\s*pay\s*back|interest\s*rate/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Repay leftover 53', 'exploring', entities)
  }

  return null
}
