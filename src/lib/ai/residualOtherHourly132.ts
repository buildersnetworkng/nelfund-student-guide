import type { IntentId, IntentResult } from './types'
import { residualOtherHourly133 } from './residualOtherHourly133'

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
 * Hourly 132 2026-09-23: residual other first (Pidgin + vague help).
 * Extra sentence shapes that still land in the admin other bucket.
 */
export function residualOtherHourly132(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly133(text, entities)
  if (newer) return newer
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
    /^(bros|sis|oga|aunty|sir|ma)?\s*(abeg|pls|biko|please)?\s*(help|assist|guide|yarn|talk|orientate)\s*(me|am|us)?\s*(small|jo|jare|now|abeg|pls)?\.?$|^i\s*(just\s*)?(come|dey)\s*(here|online)\s*(abeg)?$|^wetin\s*una\s*(dey|fit)\s*(do|help)\s*(here|for\s*here)?\??$|^talk\s*to\s*me\s*(abeg|now)?$|^i\s*no\s*know\s*wetin\s*to\s*(type|ask|write)$|^anything\s*una\s*fit\s*do\s*(for\s*)?me\??$|^help\s*me\s*abeg\s*i\s*no\s*sabi$|^una\s*fit\s*yarn\s*me\s*(small|the\s*gist)\??$|^i\s*wan\s*ask\s*question$|^question\s*abeg$|^support\s*abeg$|^customer\s*care$|^i\s*need\s*(info|information|orientation)$|^how\s*una\s*take\s*help\s*students?\??$|^e\s*be\s*like\s*say\s*i\s*lost$|^i\s*dey\s*manage\s*abeg$|^wetin\s*suppose\s*i\s*ask\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.91, ['other', 'greeting-vague'], 'Vague Pidgin help 132', 'exploring', entities)
  }

  if (
    /my\s*(own|loan|file|application)\s*(still\s*)?(dey|is)\s*(there|same|pending)|e\s*never\s*(reach|drop|show)\s*(my\s*)?(own|side)|dem\s*don\s*pay\s*(everybody|everybody else|my\s*people)|i\s*still\s*dey\s*wait\s*(for\s*)?(alert|credit|upkeep)|no\s*credit\s*alert\s*(since|at\s*all)|processing\s*never\s*end|under\s*review\s*since|how\s*far\s*una\s*never\s*pay/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 132', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not)\s*(correct|gree|match)|utme\s*(reg|no|number)\s*(invalid|wrong|fail)|verify\s*jamb\s*(no|not)\s*(work|gree)|jamb\s*portal\s*error|it\s*say\s*invalid\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 132', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|already)\s*(use|used)|last\s*year\s*(i\s*)?(register|sign\s*up)|old\s*account\s*(still\s*)?(dey|exist)|cannot\s*register\s*again|email\s*already\s*registered/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 132', 'applying', entities, true)
  }

  if (
    /school\s*(name\s*)?(no|not|never)\s*(dey|appear|show)\s*(for|on)\s*(the\s*)?list|uni\s*no\s*dey\s*the\s*list|poly\s*missing\s*(for|on)\s*list|institution\s*not\s*listed/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 132', 'applying', entities, true)
  }

  if (
    /when\s*repayment\s*(go|will|dey)\s*start|how\s*i\s*go\s*pay\s*back\s*(the\s*)?loan|after\s*service\s*(year|nysc).{0,20}pay|gsi\s*go\s*debit|pay\s*back\s*how/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 132', 'repaying', entities)
  }

  return null
}
