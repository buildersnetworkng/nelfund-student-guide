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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|take)|is\s*the\s*loan\s*still\s*on/i.test(
    q,
  )
}

/**
 * Hourly 129 2026-09-23: jamb 40 is the next named unknown after pending-status.
 * Also catch leftover pending / email / school sentence shapes.
 */
export function residualOtherHourly129(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(
      q,
    )
  )
    return null

  if (
    /jamb\s*(number|reg|registration|details?|data|info)?\s*(is\s*)?(not|no|never|invalid|wrong)|invalid\s*jamb|jamb\s*(no|not)\s*(valid|gree|correct|work)|verification\s*(failed|fail|error|no\s*work)\s*(on\s*)?(my\s*)?jamb|jamb\s*verification\s*(fail|failed|error|no\s*work|not\s*working)|cannot\s*verify\s*(my\s*)?jamb|unable\s*to\s*verify\s*(jamb|utme)|portal\s*(say|says|dey\s*show)\s*(invalid\s*)?jamb|they\s*say\s*(my\s*)?jamb\s*(is\s*)?(wrong|invalid)|jamb\s*dey\s*reject\s*(me|am)|utme\s*(number|reg)?\s*(not|no)\s*(accepted|valid)|jamb\s*error\s*(on\s*)?(portal|screen)|my\s*jamb\s*(no|not)\s*(dey\s*)?(gree|work|pass)|jamb\s*caps\s*(no|not)|direct\s*entry\s*(jamb|number)\s*(no|not)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 129', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(na|now|abeg)?\s*(my|dis|this)?|e\s*never\s*(enter|drop|show)|kobo\s*(never|no)\s*(enter|drop|dey)|wallet\s*(still\s*)?(empty|blank)|approved\s*but\s*(no|never)\s*(money|alert)|i\s*don\s*apply\s*(since|long)|when\s*una\s*go\s*pay\s*me|status\s*check\s*(abeg|pls)|track\s*am\s*(abeg|for\s*me)|my\s*loan\s*(still\s*)?(dey|is)\s*(pending|processing)|nothing\s*show\s*for\s*(account|bank)|dem\s*pay\s*my\s*mates\s*before\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 129', 'waiting', entities, true)
  }

  if (
    /this\s*mail\s*(don|already)\s*(dey|exist|used)|email\s*don\s*dey\s*(use|used)|last\s*year\s*email|old\s*email\s*(no|not)\s*(gree|work)|cannot\s*register\s*(with\s*)?(this|dis)\s*(mail|email)|sign\s*up\s*(no|not)\s*gree\s*(this\s*)?(mail|email)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['login'], 'Email used leftover 129', 'applying', entities, true)
  }

  if (
    /my\s*(uni|poly|college|school)\s*(no|not)\s*(dey|show)|school\s*name\s*(no|not)\s*(appear|show)|cannot\s*select\s*(my\s*)?(school|institution)|institution\s*drop\s*down\s*(empty|blank)|list\s*of\s*schools?\s*(no|not)\s*(get|carry)\s*(my|our)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.95, ['school-list'], 'School missing leftover 129', 'applying', entities, true)
  }

  return null
}
