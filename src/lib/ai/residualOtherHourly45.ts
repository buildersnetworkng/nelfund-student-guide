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
 * Hour-45 leftover catcher: admin other (324) + pending-status (70) + jamb (40).
 * Money never enter, two months no upkeep, JAMB year/CAPS, email already used.
 */
export function residualOtherHourly45(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)|purpose\s*of\s*nelfund|why\s*(was|is)\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.93, ['what-is', 'other'], 'Purpose leftover 45', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 45', 'exploring', entities)
  }

  if (
    /email\s*(already|don|has)\s*(been\s*)?(used|exist|register)|registered\s*(last|this|previous)\s*year|account\s*(already|don)\s*(dey|exist)|this\s*email\s*(is\s*)?(already|taken)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login', 'other'], 'Email already used leftover 45', 'applying', entities, true)
  }

  if (
    /invalid\s*(jamb|utme)|jamb\s*(no|not|never|invalid|fail|wahala|reject|year|caps)|utme\s*(no|not|invalid)|wrong\s*jamb|caps\s*(no|not|never|fail)|direct\s*entry\s*(no|not)|old\s*jamb|jamb\s*of\s*20\d{2}/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB leftover 45', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list', 'other'], 'School not showing leftover 45', 'applying', entities, true)
  }

  if (
    /money\s*never\s*(enter|drop|show|land|come)|alert\s*never\s*(enter|drop|come)|upkeep\s*never\s*(enter|drop|come|show)|i\s*never\s*(collect|see|get)\s*(my\s*)?(money|upkeep|alert|pay)|account\s*never\s*(see|show)\s*money|(two|2|three|3)\s*months?\s*(no|without|never)\s*(pay|upkeep|alert|stipend)|stipend\s*(no|not|never)\s*(enter|drop|come)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other', 'no-alert'],
      'Money never enter leftover 45',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /how\s*far\s*(with\s*)?(my\s*)?(nelfund|loan|application|am|money|upkeep)|wetin\s*dey\s*happen\s*(to|with)\s*(my\s*)?(loan|application|nelfund|money)|any\s*(news|update)\s*(on|about)\s*(my\s*)?(loan|application)|check\s*(my\s*)?(status|application)|status\s*(still|dey)\s*pending/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.92,
      ['pending-status', 'other'],
      'How far / status leftover 45',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /(mates|class|everybody|others)\s*(don|have)\s*(collect|receive|get).{0,24}(me|i)\s*(never|no)|only\s*me\s*(remain|never)|dem\s*pay\s*(others|everybody)\s*(but\s*)?(i|me)\s*(never|no)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other', 'mates-paid'],
      'Others paid leftover 45',
      'waiting',
      entities,
      true,
    )
  }

  if (/i\s*(don|have)\s*(apply|submit|register).{0,40}(pending|how\s*far|never\s*enter|no\s*update)/i.test(q)) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'Submitted still pending leftover 45',
      'waiting',
      entities,
      true,
    )
  }

  return null
}
