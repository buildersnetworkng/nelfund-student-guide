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
 * Hour-54 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Catch payout rumours, DE/matric leftovers, mixed greetings, verification-pending.
 */
export function residualOtherHourly54(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /have\s*(they|dem|una)\s*(started|begin|beginned)\s*(pay|paying|disburse)|they\s*(have\s*)?(started|don\s*start)\s*(pay|paying|disburse)|is\s*(nelfund|una|dem)\s*(paying|dey\s*pay)\s*(now|already)|una\s*don\s*start\s*(to\s*)?pay|batch\s*(don|has)\s*(drop|pay)|pay\s*list\s*(don|dey)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Started paying rumour leftover 54',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /institution(al)?\s*verif|school\s*(never|no|not)\s*(verify|confirm|upload)|awaiting\s*(school|institution)\s*verif|verification\s*(pending|dey\s*pending)/i.test(
      q,
    )
  ) {
    return hit(
      'institution-verification',
      0.92,
      ['missing', 'other'],
      'Institution verification leftover 54',
      'applying',
      entities,
      true,
    )
  }

  if (
    /direct\s*entry|\bde\s*jamb\b|old\s*jamb\s*(number|reg)|jamb\s*(from|of)\s*20\d{2}|used\s*(my\s*)?(old|last)\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb', 'other'], 'Direct entry / old JAMB leftover 54', 'applying', entities, true)
  }

  if (
    /matric\s*(no|number|num)\s*(no|not|never|no\s*dey)|no\s*matric|matric\s*(not|never)\s*(generated|ready|show)|without\s*matric/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.9, ['documents', 'other'], 'No matric leftover 54', 'preparing', entities, true)
  }

  if (
    /^(good\s*(morning|afternoon|evening)|how\s*far|hi|hello)\b.{0,40}\b(apply|application|loan|nelfund|portal|register)\b/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'Greeting plus apply leftover 54', 'preparing', entities)
  }

  if (
    /\b(200|300|400|500)\s*(level|l)\b|can\s*(a\s*)?(200|300|400)l\s*(student\s*)?(apply|fit)|final\s*year\s*(fit|can)\s*apply/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Level leftover 54', 'exploring', entities)
  }

  if (
    /they\s*say\s*(nelfund|loan|portal)\s*(don\s*)?(close|open)|i\s*hear\s*(say\s*)?(nelfund|loan).{0,20}(close|open|pay)|rumour|is\s*it\s*true.{0,30}(open|close|pay)/i.test(
      q,
    )
  ) {
    if (/pay|disburse|alert|batch/i.test(q)) {
      return hit(
        'pending-application',
        0.88,
        ['pending-status', 'other'],
        'Pay rumour leftover 54',
        'waiting',
        entities,
        true,
      )
    }
    return hit('current-information', 0.9, ['open-status', 'other'], 'Open/close rumour leftover 54', 'exploring', entities)
  }

  if (/please\s*(help|abeg)|i\s*need\s*help|una\s*fit\s*help\s*me|assist\s*me\s*(abeg)?/i.test(q) && q.length < 48) {
    return hit('how-to-apply', 0.62, ['other', 'empty'], 'Vague help leftover 54', 'exploring', entities)
  }

  if (/e\s*no\s*(show|reflect)\s*(for|on)\s*(my\s*)?(account|bank)|account\s*(still\s*)?(empty|blank)|no\s*credit\s*alert/i.test(q)) {
    return hit(
      'pending-application',
      0.92,
      ['pending-status', 'other'],
      'Nothing in account leftover 54',
      'waiting',
      entities,
      true,
    )
  }

  return null
}
