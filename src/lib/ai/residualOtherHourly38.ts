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
 * Hour-38 leftover catcher: other=324 still largest unknown bucket.
 * Amount rumours, interest/free-loan, BVN mismatch, transfer, private/distance,
 * SIWES, photo size, change school, indemnity, "una dey pay".
 */
export function residualOtherHourly38(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis|this)|nelfund\s*(na\s*)?wetin|why\s*(dem|una|fg)\s*(create|form|bring)\s*(nelfund|am|dis\s*loan)|purpose\s*of\s*(the\s*)?(loan|scheme)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Purpose leftover 38', 'exploring', entities)
  }

  if (
    /how\s*much\s*(nelfund|una|dem|they)\s*(dey\s*)?(give|pay|send)|how\s*much\s*(is\s*)?(the\s*)?(loan|upkeep|stipend)|nelfund\s*(amount|figure)|upkeep\s*(na|is)\s*how\s*much|interest[\s-]*free|is\s*(it|nelfund)\s*(free|a\s*grant)|na\s*scholarship|loan\s*or\s*grant|must\s*i\s*repay|do\s*i\s*(have\s*to|need\s*to)\s*pay\s*back/i.test(
      q,
    )
  ) {
    if (/repay|pay\s*back|after\s*nysc|interest/i.test(q)) {
      return hit('repayment', 0.88, ['repayment', 'other'], 'Must I repay leftover 38', 'repaying', entities)
    }
    if (/scholarship|grant|free\s*money|na\s*scholarship/i.test(q) && !/interest[\s-]*free/i.test(q)) {
      return hit('loan-or-scholarship', 0.88, ['other'], 'Grant vs loan leftover 38', 'exploring', entities)
    }
    if (/upkeep|stipend|allowance|how\s*much/i.test(q)) {
      return hit('upkeep', 0.88, ['other', 'upkeep'], 'How much leftover 38', 'exploring', entities)
    }
  }

  if (
    /bvn\s*(no|not|never|mismatch|wahala|fail|invalid)|nin\s*(no|not|never|mismatch|wahala|fail|invalid)|name\s*(no|not)\s*(match|gree|tally)|date\s*of\s*birth\s*(no|not)\s*(match|gree)/i.test(
      q,
    )
  ) {
    return hit('nin-verification', 0.9, ['other', 'bvn'], 'BVN / NIN mismatch leftover 38', 'applying', entities, true)
  }

  if (
    /change\s*(my\s*)?school|i\s*(don|have)\s*transfer|transfer\s*student|i\s*leave\s*(the\s*)?(old|former)\s*school|new\s*school\s*(no|not)\s*(show|dey)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.86, ['other', 'school'], 'Transfer / change school leftover 38', 'applying', entities, true)
  }

  if (
    /private\s*(uni|university|poly|school)|distance\s*learning|open\s*university|noun\s*(fit|can)\s*apply|part[\s-]*time\s*(fit|can)|sandwich/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['other', 'eligibility'], 'Private / distance leftover 38', 'exploring', entities)
  }

  if (
    /\bsiwes\b|industrial\s*training|clearance\s*(form|letter)|indemnity|surety\s*(form|letter)|guarantor/i.test(q)
  ) {
    if (/guarantor|surety|indemnity/i.test(q)) {
      return hit('guarantor', 0.86, ['other'], 'Guarantor leftover 38', 'preparing', entities)
    }
    return hit('documents-needed', 0.84, ['other', 'documents'], 'SIWES / clearance leftover 38', 'preparing', entities)
  }

  if (
    /passport\s*(photo|size)|photo\s*(size|format)|jpeg|png\s*(no|not)\s*(upload|gree)|upload\s*(no|not)\s*(gree|work)|document\s*(no|not)\s*(upload|gree)/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.88, ['other', 'documents'], 'Upload / photo leftover 38', 'applying', entities, true)
  }

  if (
    /una\s*dey\s*pay|dem\s*dey\s*pay|when\s*una\s*go\s*pay|i\s*don\s*submit|i\s*don\s*apply\s*(abeg)?|e\s*dey\s*processing|processing\s*since/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status', 'other'], 'Una dey pay leftover 38', 'waiting', entities, true)
  }

  if (
    /missing\s*information|information\s*(no|not)\s*(complete|dey)|faculty\s*(no|not)\s*(dey|show)|department\s*(no|not)\s*(dey|show)/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.9, ['missing-info', 'other'], 'Missing info leftover 38', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)|institution\s*(no|not)\s*(dey|show)|my\s*school\s*(no|not)\s*on/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School no dey leftover 38', 'applying', entities, true)
  }

  return null
}
