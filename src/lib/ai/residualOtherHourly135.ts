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
 * Hourly 135 2026-09-23: residual `other` first (Pidgin + vague help).
 * Extra shapes that still miss exact-start regexes: fragments, typos, casual menu asks.
 */
export function residualOtherHourly135(text: string, entities: string[]): IntentResult | null {
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
    /i\s*just\s*dey\s*find\s*(my\s*)?way|una\s*fit\s*brief\s*me|how\s*(this|dis)\s*chat\s*take\s*work|wetin\s*(you|una)\s*cover\s*(here|for\s*here)|i\s*no\s*get\s*(any\s*)?(specific|clear)\s*question|just\s*dey\s*pass|make\s*we\s*start\s*small|any\s*gist\s*(for|about)\s*students|i\s*need\s*direction\s*(abeg|pls|please)?|pls\s*orientate\s*me\s*(small)?|orientate\s*me\s*small|gimme\s*(small\s*)?(gist|brief)|show\s*me\s*wetin\s*(you|una)\s*(fit|can)\s*(do|cover)|i\s*no\s*sabi\s*where\s*to\s*begin|hlp\s*me|abeg\s*hlp|gude\s*me|assistt\s*me|^help\?+$|^guide\s*(jo|jare|abeg)?\.?$|^abeg\s*na\.?$|^info\s*(pls|abeg|please)\.?$|^pls\s*info\.?$|^i\s*dey\s*here\s*abeg\.?$|^wetin\s*una\s*sabi\??$|^make\s*una\s*yarn\s*small\.?$|^i\s*wan\s*hear\s*una\.?$|^who\s*fit\s*help\s*me\s*here\??$|^any\s*help\s*here\??$|^nelfund\s*help\s*(abeg|pls)?\.?$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague Pidgin help 135', 'exploring', entities)
  }

  if (
    /my\s*dashboard\s*still\s*(zero|0|empty)|dem\s*(don\s*)?pay\s*(my\s*)?(room\s*mates?|roomates?|mates)|submitted\s*since\s*(last\s*)?(month|week)|e\s*never\s*leave\s*(submitted|pending)|batch\s*(don\s*)?pay\s*(but\s*)?i\s*never\s*see/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 135', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|not)\s*(gree|work)|utme\s*(say|says?)\s*invalid|caps\s*(no|not)\s*gree/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 135', 'applying', entities, true)
  }

  if (
    /this\s*mail\s*(don|already)\s*(dey|used)|last\s*session\s*(i\s*)?(register|sign\s*up)|old\s*login\s*(still\s*)?dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 135', 'applying', entities, true)
  }

  if (
    /my\s*(uni|poly|college)\s*(no|not)\s*dey\s*(the\s*)?dropdown|school\s*no\s*dey\s*dropdown/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 135', 'applying', entities, true)
  }

  if (
    /when\s*i\s*go\s*start\s*(to\s*)?pay\s*back|how\s*repayment\s*take\s*work|gsi\s*go\s*collect/i.test(q)
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 135', 'repaying', entities)
  }

  return null
}
