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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)/i.test(
    q,
  )
}

/**
 * Hour-77 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still land as other.
 */
export function residualOtherHourly77(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop)|processing|under\s*review|approved/.test(low)) {
    return null
  }

  if (
    /e\s*still\s*dey\s*(review|process|pending)|dashboard\s*(still\s*)?(na\s*)?(0|zero|empty)|no\s*(credit\s*)?alert|una\s*never\s*pay\s*(me|am)|wetin\s*dey\s*happen\s*to\s*my\s*(own|file|application|loan)|processing\s*since\s*(last\s*)?(month|week)|approved\s*but\s*(no|never)\s*(money|pay|alert)|school\s*don\s*(collect|receive)\s*but\s*(me|i)\s*never|file\s*dey\s*sleep|my\s*loan\s*dey\s*sleep|status\s*no\s*change|e\s*remain\s*pending|still\s*on\s*(pending|processing|review)|nothing\s*don\s*(drop|enter|show)\s*(for\s*)?(my\s*)?(account|bank|acct)|bank\s*never\s*(alert|notify)|i\s*submit\s*since\s*.{0,20}(nothing|no\s*pay)|dem\s*forget\s*my\s*(file|own)|my\s*own\s*lost\s*for\s*system|check\s*my\s*status\s*(abeg|pls)|wetin\s*happen\s*to\s*the\s*(loan|application)|application\s*hang|e\s*hang\s*for\s*(pending|review)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 77', 'waiting', entities, true)
  }

  if (
    /i\s*just\s*wan\s*(ask|know)\s*(small|something)|any\s*update\s*(for\s*)?(nelfund|loan)|una\s*dey\s*online\s*\??$|help\s*desk\s*abeg|i\s*need\s*someone\s*to\s*yarn|talk\s*sense\s*to\s*me|make\s*una\s*guide\s*me|i\s*no\s*sabi\s*where\s*to\s*start|confused\s*pass|too\s*plenty\s*information|too\s*much\s*info/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.86, ['other', 'greeting-vague'], 'Vague leftover 77', 'exploring', entities)
  }

  if (
    /jamb\s*(id|reg)\s*(invalid|fail|failed)|verification\s*failed\s*(on\s*)?jamb|caps\s*(no|not)\s*(match|gree)|admission\s*letter\s*(no|not)\s*(work|gree)|utme\s*(number|no)\s*(reject|rejected)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 77', 'applying', entities, true)
  }

  return null
}
