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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s+(window|application)\s+(open|closed)/i.test(
    q,
  )
}

/** 18 Sep 10:06 WAT: unknownAi 438, other 324, pending-status 70, jamb 40, open-status 26. */
export function residualOtherHourly31(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null

  if (
    /i\s*no\s*get\s*(nin|bvn)|no\s*(nin|bvn)|don.?t\s*have\s*(a\s*)?(nin|bvn)|without\s*(nin|bvn)|nin\s*(never|no)\s*(ready|dey|come)/i.test(
      q,
    )
  ) {
    return hit('nin-verification', 0.88, ['nin', 'other'], 'No NIN / BVN leftover', 'preparing', entities, true)
  }

  if (
    /password\s*(no|not|never)\s*(dey|work|correct)|forget\s*(my\s*)?password|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|can.?t\s*login|cannot\s*log\s*in|login\s*(no|not)\s*(dey|work)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.88, ['login', 'other'], 'Password / cannot login leftover', 'applying', entities, true)
  }

  if (
    /use\s*(another|someone|my\s*(broda|brother|sister|friend)).{0,16}email|another\s*person.?s\s*email|borrow\s*(an?\s*)?email|email\s*no\s*be\s*my\s*own/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.86, ['login', 'other'], 'Someone else email leftover', 'applying', entities, true)
  }

  if (
    /200\s*level|\b200l\b|300\s*level|\b300l\b|final\s*year|400\s*level|\b400l\b|i\s*be\s*\d00\s*level/i.test(q) &&
    /eligib|qualify|fit|apply|can\s*i/i.test(q)
  ) {
    return hit('eligibility', 0.86, ['eligibility', 'other'], '200L / later level leftover', 'exploring', entities)
  }

  if (/faculty\s*(no|not|never)\s*(dey|show|appear)|department\s*(no|not)\s*(on\s*)?(the\s*)?list|course\s*code\s*(no|not)\s*(dey|show)/i.test(q)) {
    return hit(
      'missing-information',
      0.86,
      ['missing-info', 'other'],
      'Faculty / department not listed leftover',
      'applying',
      entities,
      true,
    )
  }

  if (/upload\s*(passport|photo|picture)|passport\s*(photo)?\s*(no|not)\s*(dey|gree|upload)|photo\s*(reject|fail)/i.test(q)) {
    return hit(
      'documents-needed',
      0.84,
      ['documents', 'other'],
      'Passport photo upload leftover',
      'preparing',
      entities,
      true,
    )
  }

  if (/approv(ed|al).{0,48}(school|institution).{0,24}(no|never|not).{0,16}(pay|collect|receive)|school\s*(never|no)\s*(collect|receive|see)\s*(the\s*)?(money|fee|loan)/i.test(q)) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other'],
      'Approved but school not paid leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/how\s*(i\s*)?(go|to|do\s*i)\s*repay|when\s*(i\s*)?(go|will)\s*start\s*(to\s*)?pay\s*back|pay\s*back\s*(the\s*)?loan|repayment\s*plan/i.test(q)) {
    return hit('repayment', 0.86, ['repayment', 'other'], 'How to repay leftover', 'repaying', entities)
  }

  if (/i\s*wan(t)?\s*(to\s*)?know\s*(my\s*)?status|wetin\s*be\s*(my\s*)?status|status\s*check|check\s*status/i.test(q)) {
    return hit(
      'pending-application',
      0.84,
      ['pending-status', 'other'],
      'Status check leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/collate|i\s*just\s*type\s*anything|test\s*message|^ok\s*sir$|^please\s*help$|^help\s*me$|^abeg$/i.test(q)) {
    return hit('official-sources', 0.55, ['other', 'vague'], 'Vague help leftover', 'unknown', entities)
  }

  return null
}
