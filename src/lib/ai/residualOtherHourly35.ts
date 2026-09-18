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
 * Hour-35 leftover catcher: admin pending-status (70) + other (324) misfires.
 * Pidgin payout wait, processing, disbursement rumours, JAMB reject leftovers.
 */
export function residualOtherHourly35(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(dis|this)\s*(nelfund|loan|scheme)|why\s*(una|dem|fg)\s*(create|form|bring)\s*(am|nelfund)|nelfund\s*stand\s*for/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Why create leftover 35', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.88, ['open-status', 'other'], 'Open leftover 35', 'applying', entities)
  }

  if (
    /application\s*(dey|is)\s*(processing|in\s*progress)|status\s*(dey|is)\s*(processing|loading)|e\s*dey\s*process|processing\s*(my\s*)?(loan|file)|disburs(e|ement)\s*(pending|soon|when)|when\s*(go|will)\s*(i\s*)?see\s*(alert|money)|tinubu\s*(list|pay)|name\s*(no|not)\s*dey\s*(the\s*)?(pay\s*)?list|dem\s*never\s*(pay|send)\s*(me|am)|i\s*wan\s*check\s*(my\s*)?(loan|application)|my\s*(loan|application)\s*(nko|now|abeg)|how\s*many\s*(weeks|months)\s*(pending|now)|e\s*never\s*move|nothing\s*don\s*drop/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other'],
      'Processing / disbursement leftover 35',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /jamb\s*(reject|rejected|no\s*work|no\s*gree|no\s*match)|registration\s*number\s*(reject|invalid)|utme\s*(pin|number)\s*(wrong|invalid|reject)|use\s*(de|the)\s*jamb|jamb\s*no\s*dey\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.88, ['jamb', 'other'], 'JAMB reject leftover 35', 'applying', entities, true)
  }

  if (
    /email\s*(don|has)\s*(use|used)|i\s*register\s*last\s*(year|session)|old\s*email\s*(no|not)\s*(work|gree)/i.test(q)
  ) {
    return hit('portal-login', 0.86, ['login', 'other'], 'Old email leftover 35', 'applying', entities, true)
  }

  if (/school\s*(no|not)\s*dey\s*show|i\s*no\s*see\s*(my\s*)?school\s*(for|on)\s*(the\s*)?(list|portal)/i.test(q)) {
    return hit('school-not-found', 0.86, ['school-list', 'other'], 'School no show leftover 35', 'applying', entities, true)
  }

  return null
}
