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
 * Hour-47 leftover catcher.
 * Admin 2026-09-19: unknown 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 */
export function residualOtherHourly47(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /invalid\s*jamb|jamb\s*(no|number)\s*(invalid|wrong|reject|fail)|jamb\s*(no|not|never)\s*(gree|work|verify)|utme\s*(no|number)\s*(invalid|reject)|jamb\s*reg(istration)?\s*(no|number)\s*(wrong|invalid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb', 'other'], 'Invalid JAMB leftover 47', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(na|now|abeg)?|money\s*(never|no)\s*(enter|drop|show|land)|e\s*never\s*(enter|drop|land)|dem\s*never\s*(pay|enter|drop)|una\s*never\s*pay|i\s*never\s*(see|collect)\s*(money|alert|upkeep)|nothing\s*don\s*(enter|drop)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'How far / money never enter leftover 47',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /is\s*(nelfund|the\s*loan|loan|portal|application)\s*(still\s*)?(open|closed)|dem\s*don\s*close|una\s*don\s*close|can\s*i\s*still\s*apply|as\s*of\s*today|closing\s*date|deadline/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.92, ['open-status', 'other'], 'Open / deadline leftover 47', 'exploring', entities)
  }

  if (/^(hi|hello|hey|pls|please|abeg|good\s*(day|morning|afternoon|evening)|help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['greeting-vague', 'other'], 'Greeting-only leftover 47', 'exploring', entities)
  }

  if (
    /wetin\s*be\s*(nelfund|dis\s*loan|this\s*loan)|why\s*(dem|they|una)\s*(create|form|bring)\s*nelfund|nelfund\s*na\s*wetin|purpose\s*of\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is', 'other'], 'Purpose leftover 47', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(use|used|exist|dey)|registered\s*last\s*year|i\s*register\s*last\s*year|this\s*mail\s*(don|has)\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login', 'other'], 'Email already used leftover 47', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|not\s*showing\s*(on|in)\s*(the\s*)?list|institution\s*(no|not)\s*(dey|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list', 'other'], 'School not showing leftover 47', 'applying', entities, true)
  }

  if (/when\s*(do|go|will)\s*i\s*(start\s*)?(repay|pay\s*back)|repayment\s*(start|begin)|after\s*(nysc|graduation)/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'other'], 'Repayment leftover 47', 'repaying', entities)
  }

  return null
}
