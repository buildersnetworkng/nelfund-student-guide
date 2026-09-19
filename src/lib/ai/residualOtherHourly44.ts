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
 * Hour-44 leftover catcher: admin pending-status (70) plus residual other.
 * Focus: mates/class already paid, apply since DATE, how far nelfund, no SMS,
 * JAMB year / CAPS leftovers that still fall to unknown/other.
 */
export function residualOtherHourly44(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)|purpose\s*of\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'other'], 'Purpose leftover 44', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 44', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|registered\s*(last|this)\s*year|account\s*(already|don)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email already used leftover 44', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never|invalid|fail|wahala|reject|year)|utme\s*(no|not|invalid)|wrong\s*jamb|caps\s*(no|not|never)|direct\s*entry\s*(no|not)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb', 'other'], 'JAMB leftover 44', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School not showing leftover 44', 'applying', entities, true)
  }

  if (
    /(mates|class|course\s*mates|roommates?|hostel\s*mates?)\s*(don|have|has)\s*(collect|receive|get|see)\s*(money|upkeep|alert|pay|loan)|dem\s*don\s*pay\s*(my\s*)?(mates|class|everybody|others)|everybody\s*(don|have)\s*(collect|receive)|una\s*don\s*pay\s*(others|my\s*mates)|only\s*me\s*(remain|never\s*collect)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other', 'mates-paid'],
      'Mates already paid leftover 44',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /i\s*(don|have)?\s*apply\s*since|apply\s*since\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)|pending\s*since\s*\d|under\s*review\s*since|i\s*apply\s*(last\s*)?(month|week|semester)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'Apply since leftover 44',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /how\s*far\s*(with\s*)?(my\s*)?(nelfund|loan|application|am|money)|wetin\s*dey\s*happen\s*(to|with)\s*(my\s*)?(loan|application|nelfund)|any\s*(news|update)\s*(on|about)\s*(my\s*)?(loan|application)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'How far nelfund leftover 44',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /no\s*(sms|mail|email|call)\s*(from\s*)?(nelfund|una)|una\s*never\s*(text|sms|mail|call)|nobody\s*(don|has)\s*(message|text)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other'],
      'No SMS leftover 44',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /school\s*(don|has)\s*(collect|receive|get)\s*(the\s*)?(money|fee|loan)|fees?\s*(don|has)\s*(enter|go)\s*(the\s*)?school|una\s*don\s*pay\s*(the\s*)?school.{0,24}(me|i)\s*(no|never)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'School paid student wait leftover 44',
      'waiting',
      entities,
      true,
    )
  }

  if (/^(help(\s*me)?|abeg|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['how-to-apply', 'other'], 'Bare help leftover 44', 'preparing', entities)
  }

  return null
}
