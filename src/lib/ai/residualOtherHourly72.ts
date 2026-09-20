import type { IntentId, IntentResult } from './types'
import { residualOtherHourly73 } from './residualOtherHourly73'

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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)/i.test(
    q,
  )
}

/**
 * Hour-72 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70.
 * Extra shapes: money never reflect / how far my own / email last year / school no dey list.
 */
export function residualOtherHourly72(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly73(text, entities)
  if (newer) return newer

  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show)|processing|under\s*review/.test(low)) {
    return null
  }

  if (
    /email\s*(already|don|has)\s*(used|exist|dey)|i\s*register(ed)?\s*(last\s*year|before|before\s*now)|cannot\s*create\s*(account|acct).{0,24}email|this\s*mail\s*(don|already)\s*(dey|exist)|old\s*email\s*(no|not)\s*(gree|work)|i\s*get\s*account\s*(before|last\s*year)|sign\s*up\s*(say|says)\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['email-used'], 'Email already used / registered last year', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey|appear)|my\s*school\s*no\s*dey\s*(the\s*)?list|institution\s*(missing|not\s*on)|school\s*no\s*dey\s*(for\s*)?(portal|list)|una\s*no\s*put\s*(my\s*)?school|search\s*(my\s*)?school\s*(nothing|empty)|school\s*name\s*(no|not)\s*(come|appear)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'School not on portal list', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|correct|gree)|verification\s*fail(ed)?\s*(on\s*)?jamb|jamb\s*no\s*gree|jamb\s*reject/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.9, ['jamb'], 'Invalid JAMB / verification failed', 'applying', entities, true)
  }

  if (
    /my\s*own\s*never\s*(move|change|reflect|enter|show)|e\s*never\s*reflect|alert\s*never\s*(come|enter)|dem\s*never\s*pay\s*me|una\s*never\s*pay\s*(me|us)|money\s*never\s*(enter|drop|show|reflect)|how\s*far\s*(my\s*)?(own|loan|application|file)|status\s*(still|stil)\s*(processing|pending|the\s*same)|no\s*change\s*(for|on)\s*(my\s*)?(status|file|loan)|e\s*never\s*move|application\s*(still|stil)\s*(pending|processing|under\s*review)|under\s*review\s*(since|still)|approved\s*but\s*(no|never)\s*(money|alert)|dem\s*approve\s*but\s*money\s*no\s*dey|when\s*(go|will)\s*(the\s*)?money\s*(enter|drop|reflect)|i\s*never\s*see\s*(my\s*)?(upkeep|alert|loan)|upkeep\s*never\s*(enter|drop|show)|school\s*fees\s*never\s*(enter|pay|show)|how\s*far\s*now\s*(my\s*)?(loan|own)|any\s*update\s*(on|for)\s*(my\s*)?(loan|application)|my\s*application\s*dey\s*pending|pending\s*since\s*(january|february|march|april|may|june|july|august|september|october|last)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.91, ['pending-status'], 'How far / money never enter / still processing', 'waiting', entities, true)
  }

  return null
}
