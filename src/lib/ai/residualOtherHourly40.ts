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
 * Hour-40 leftover catcher for admin topic `other` (324) plus pending-status (70).
 * Bare "i need loan", login-only, school-record stuck, rumour "is it true".
 */
export function residualOtherHourly40(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|nelfund\s*(na\s*)?wetin|why\s*(dem|una|they|fg)\s*(create|form|bring)|purpose\s*of\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'other'], 'Purpose leftover 40', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 40', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|registered\s*(last|this)\s*year|account\s*(already|don)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email already used leftover 40', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never|invalid|fail|wahala)|utme\s*(no|not|invalid)|wrong\s*jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.92, ['jamb', 'other'], 'JAMB leftover 40', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School not showing leftover 40', 'applying', entities, true)
  }

  if (
    /how\s*far|money\s*(never|no)\s*(enter|drop|show)|still\s*pending|under\s*review|when\s*(dem|they|una)\s*(go|will)\s*pay|no\s*alert|i\s*don\s*apply|check\s*(my\s*)?(loan|application|status)|name\s*(no|not)\s*dey\s*(the\s*)?(pay\s*)?list/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.9, ['pending-status', 'other'], 'Pending leftover 40', 'waiting', entities, true)
  }

  if (
    /^(nelfund\s*)?(login|sign\s*in|sign\s*up|log\s*in)[.!? ]*$/i.test(q) ||
    /cannot\s*(login|sign\s*in)|forgot\s*(my\s*)?password|portal\s*(no|not)\s*(open|load)/i.test(q)
  ) {
    return hit('portal-login', 0.88, ['login', 'other'], 'Login leftover 40', 'applying', entities, true)
  }

  if (
    /i\s*(wan|want|need)\s*(the\s*)?(loan|nelfund)|give\s*me\s*(the\s*)?(loan|nelfund)|help\s*me\s*(get|collect)\s*(the\s*)?(loan|nelfund)|how\s*(do\s*i|to|i\s*go)\s*(get|collect)\s*nelfund|i\s*need\s*(school\s*)?fee/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'I want loan leftover 40', 'preparing', entities)
  }

  if (/is\s*it\s*true|dem\s*say|i\s*hear\s*say|rumour|fake\s*news/i.test(q)) {
    if (/jail|prison|life/i.test(q)) {
      return hit('repayment', 0.88, ['repayment', 'other'], 'Jail rumour leftover 40', 'repaying', entities)
    }
    if (/open|close|deadline/i.test(q)) {
      return hit('current-information', 0.86, ['open-status', 'other'], 'Open rumour leftover 40', 'exploring', entities)
    }
    return hit('what-is-nelfund', 0.72, ['what-is', 'other'], 'Is it true leftover 40', 'exploring', entities)
  }

  if (
    /school\s*(never|no|not)\s*(upload|verify)|institution(al)?\s*verif|record\s*(no|not|never)\s*(dey|upload)/i.test(q)
  ) {
    return hit('missing-information', 0.88, ['missing', 'other'], 'School record leftover 40', 'applying', entities, true)
  }

  if (/^(help(\s*me)?|abeg|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['how-to-apply', 'other'], 'Bare help leftover 40', 'preparing', entities)
  }

  return null
}
