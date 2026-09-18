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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*(window|application)\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hour-34 leftover catcher for admin topic `other` (largest unknown bucket).
 * Targets amount, contact-channel rumours, school-paid-me-not-paid, part-time, dual account.
 */
export function residualOtherHourly34(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(dis|this|nelfund)|why\s*(una|fg)\s*create\s*nelfund|aim\s*of\s*(the\s*)?loan|nelfund\s*for\s*wetin|explain\s*(this\s*)?nelfund\s*(to\s*me)?$/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Aim / for wetin leftover', 'exploring', entities)
  }

  if (liveish(q) || /when\s*(una|dem|they)\s*(go|will)\s*open\s*(the\s*)?(loan|upkeep)|2026\s*\/?\s*2027\s*(open|close)|flyer\s*say\s*open/i.test(q)) {
    return hit('current-information', 0.88, ['open-status', 'other'], 'When go open leftover', 'applying', entities)
  }

  if (
    /how\s*much\s*(be|na|is)?\s*(the\s*)?(loan|upkeep|stipend|allowance)|upkeep\s*(na|is)\s*how\s*much|monthly\s*(upkeep|stipend|allowance)\s*(amount|figure)|loan\s*amount\s*(for|per)\s*student/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.86, ['upkeep', 'other'], 'How much leftover', 'exploring', entities)
  }

  if (
    /school\s*(don|has|have)\s*(collect|receive|get)\s*(the\s*)?(money|fees)|dem\s*pay\s*(my\s*)?school\s*(but|and)\s*(i|me)\s*(no|never)|i\s*no\s*see\s*(my\s*)?(upkeep|money|alert)|alert\s*never\s*enter/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other'],
      'School paid student no see leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /i\s*(don|have)\s*(already\s*)?pay\s*(my\s*)?(school\s*)?fees|already\s*paid\s*(school|tuition)|receipt\s*(upload|of\s*fees)|bursary\s*receipt/i.test(
      q,
    )
  ) {
    return hit('refund', 0.84, ['fees', 'other'], 'Already paid fees leftover', 'waiting', entities, true)
  }

  if (
    /customer\s*care\s*(number|phone|line)|whatsapp\s*(group|number|link)|nelfund\s*(phone|hotline|call\s*centre)|una\s*number|phone\s*number\s*(for|of)\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('contact-support', 0.88, ['contact', 'other'], 'Phone / WhatsApp leftover', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(use|used|exist|exists|register)|registered\s*last\s*year|account\s*already\s*(dey|exists)|i\s*don\s*register\s*before/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login', 'other'], 'Email already used leftover', 'applying', entities, true)
  }

  if (
    /school\s*(never|no|not)\s*(verify|confirm)\s*(me|my\s*name)|institution\s*(verification|verify)\s*(pending|fail)|registry\s*(never|no)\s*upload/i.test(
      q,
    )
  ) {
    return hit(
      'institution-verification',
      0.88,
      ['school-list', 'other'],
      'School never verify leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /part\s*time|sandwich\s*(student|programme|program)|distance\s*learning|nysc\s*(fit|can)\s*apply|i\s*dey\s*serve/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Part-time / NYSC leftover', 'exploring', entities)
  }

  if (
    /two\s*accounts?|second\s*account|i\s*open\s*another\s*(mail|email|account)|double\s*application/i.test(q)
  ) {
    return hit('portal-login', 0.86, ['login', 'other'], 'Two accounts leftover', 'applying', entities, true)
  }

  if (
    /edit\s*(after|after\s*i)\s*submit|i\s*wan\s*change\s*(bank|bvn|nin)\s*after\s*submit|update\s*profile\s*after\s*(apply|submit)/i.test(
      q,
    )
  ) {
    return hit('profile-update', 0.84, ['missing-info', 'other'], 'Edit after submit leftover', 'applying', entities, true)
  }

  if (/hostel\s*(fee|charge|covered)|accommodation\s*(loan|cover)/i.test(q)) {
    return hit('school-fees', 0.82, ['fees', 'other'], 'Hostel covered leftover', 'exploring', entities)
  }

  if (
    /money\s*never\s*enter|how\s*far\s*(my\s*)?(loan|upkeep|application)|still\s*pending\s*(since|from)|under\s*review\s*(since|long)/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other'],
      'How far money never enter leftover',
      'waiting',
      entities,
      true,
    )
  }

  return null
}
