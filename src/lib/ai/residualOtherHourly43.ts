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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|when\s*(will|go).{0,16}(open|start|begin)/i.test(
    q,
  )
}

/**
 * Hour-43 leftover catcher for admin topic `other` (324) and pending-status (70).
 * Focus: already paid fees, how much / amount, no NIN/BVN yet, change of school,
 * next step after account create, matric / faculty not on list, hostel-only ask.
 */
export function residualOtherHourly43(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)|purpose\s*of\s*nelfund|nelfund\s*na\s*wetin|wetin\s*nelfund\s*stand\s*for/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'other'], 'Purpose leftover 43', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 43', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|registered\s*(last|this)\s*year|account\s*(already|don)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email already used leftover 43', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never|invalid|fail|wahala|reject)|utme\s*(no|not|invalid)|wrong\s*jamb|format\s*(of\s*)?jamb|jamb\s*year/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb', 'other'], 'JAMB leftover 43', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School not showing leftover 43', 'applying', entities, true)
  }

  if (
    /already\s*paid\s*(my\s*)?(school\s*)?fees?|i\s*(don|have)\s*(pay|paid)\s*(my\s*)?(school\s*)?fees?|self[\s-]*pay|paid\s*from\s*pocket|i\s*pay\s*(school\s*)?fees?\s*(myself|by\s*myself)|school\s*fees?\s*(don|has)\s*(pay|paid)\s*(already|finish)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other', 'already-paid'],
      'Already paid fees leftover 43',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /how\s*much(\s*(na|is|be))?\s*(nelfund|the\s*loan|upkeep|dem\s*dey\s*give)|wetin\s*(be|na)\s*(the\s*)?(amount|figure)|amount\s*(dem|they|una)\s*(dey\s*)?give|nelfund\s*(dey\s*)?give\s*how\s*much|monthly\s*(upkeep|stipend)\s*(na|is)\s*how\s*much/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'amount'], 'How much leftover 43', 'exploring', entities)
  }

  if (
    /i\s*no\s*(get|have)\s*(nin|bvn)|no\s*(nin|bvn)\s*(yet|with\s*me)|how\s*(do\s*i|to|i\s*go)\s*(get|do)\s*(nin|bvn)|bvn\s*(no|not)\s*(ready|dey)|nin\s*(no|not)\s*(ready|dey)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.88,
      ['missing', 'other', 'nin-bvn'],
      'No NIN/BVN leftover 43',
      'preparing',
      entities,
      true,
    )
  }

  if (
    /change\s*of\s*(school|institution|uni|university)|i\s*(don|have|wan|want)\s*(change|transfer)\s*(school|institution)|transfer\s*(to|from)\s*(another|new)\s*(school|uni)|i\s*leave\s*(the\s*)?(old|former)\s*school/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.88,
      ['missing', 'other', 'change-school'],
      'Change of school leftover 43',
      'applying',
      entities,
      true,
    )
  }

  if (
    /what\s*(next|remain)|wetin\s*remain|after\s*i\s*(create|open|don\s*create)\s*(account|profile)|i\s*(just|don)\s*(create|open)\s*(my\s*)?(account|profile)|next\s*step\s*after\s*(sign\s*up|signup|registration)/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'After account create leftover 43', 'preparing', entities)
  }

  if (
    /matric\s*(no|number|num)\s*(no|not|never)\s*(gree|work|accept|show)|faculty\s*(no|not|never)\s*(dey|show|on\s*(the\s*)?list)|department\s*(no|not)\s*(dey|show)|course\s*(no|not)\s*(dey|show)\s*(for|on)\s*(portal|list)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.9,
      ['missing', 'other'],
      'Matric / faculty leftover 43',
      'applying',
      entities,
      true,
    )
  }

  if (
    /hostel\s*(fee|money|loan)|accommodation\s*(fee|loan)|can\s*(nelfund|una)\s*pay\s*hostel|nelfund\s*(cover|pay)\s*hostel/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'hostel'], 'Hostel leftover 43', 'exploring', entities)
  }

  if (
    /can\s*i\s*apply\s*(for\s*)?(two|2)\s*(school|institution)|two\s*(school|account)|second\s*application\s*for\s*(another|new)\s*school/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'Two schools leftover 43', 'preparing', entities)
  }

  if (
    /^(check(\s*am)?|status|my\s*status|loan\s*status|application\s*status)[.!? ]*$/i.test(q) ||
    /i\s*wan\s*know\s*(my\s*)?(status|how\s*far)|abeg\s*check\s*(my\s*)?(loan|status|am)/i.test(q)
  ) {
    return hit('pending-application', 0.84, ['pending-status', 'other'], 'Bare status leftover 43', 'waiting', entities, true)
  }

  if (
    /i\s*(wan|want|need)\s*(the\s*)?(loan|nelfund)|give\s*me\s*(the\s*)?(loan|nelfund)|help\s*me\s*(get|collect)\s*(the\s*)?(loan|nelfund)|how\s*(do\s*i|to|i\s*go)\s*(get|collect)\s*nelfund|i\s*need\s*(school\s*)?fee/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'I want loan leftover 43', 'preparing', entities)
  }

  if (/^(help(\s*me)?|abeg|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['how-to-apply', 'other'], 'Bare help leftover 43', 'preparing', entities)
  }

  return null
}
