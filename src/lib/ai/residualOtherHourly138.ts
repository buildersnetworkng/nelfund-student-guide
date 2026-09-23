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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|take)|is\s*the\s*loan\s*still\s*on|is\s*nelfund\s*still\s*taking\s*applications|have\s*they\s*closed\s*the\s*loan\s*window|loan\s*portal\s*still\s*open\s*now|una\s*still\s*dey\s*open\s*loan/i.test(
    q,
  )
}

/**
 * Hourly 138 2026-09-23: residual `other` still largest (324).
 * More Pidgin + vague help + typo fragments that miss exact-start soft-route.
 */
export function residualOtherHourly138(text: string, entities: string[]): IntentResult | null {
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
    /abeg\s*i\s*wan\s*gist|you\s*fit\s*help\s*student|make\s*una\s*brief\s*me|i\s*no\s*sabi\s*wetin\s*dey\s*go\s*on|kindly\s*assist|i\s*need\s*someone\s*to\s*talk\s*to|how\s*i\s*take\s*start\s*(this|dis)\s*thing|wetin\s*una\s*dey\s*offer|i\s*just\s*wan\s*enquire|na\s*student\s*i\s*be|i\s*come\s*check\s*una|help\s*me\s*figure\s*this|i\s*dey\s*find\s*who\s*go\s*explain|please\s*i\s*am\s*new\s*here|i\s*need\s*orientation|wetin\s*i\s*suppose\s*type|make\s*you\s*help\s*me\s*start|i\s*no\s*get\s*question\s*i\s*just\s*need\s*help|can\s*someone\s*guide|i\s*wan\s*enquire\s*about\s*loan\s*generally|any\s*tin\s*for\s*me\s*here|i\s*dey\s*lost\s*small|abeg\s*orientate|show\s*wetin\s*una\s*fit\s*do|pls\s*i\s*just\s*dey\s*confused|una\s*fit\s*show\s*me\s*options|i\s*no\s*know\s*where\s*to\s*begin|help\s*me\s*small\s*jo|gimme\s*direction|i\s*wan\s*use\s*una\s*chat|wetin\s*i\s*fit\s*yarn\s*here/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague Pidgin help 138', 'exploring', entities)
  }

  if (
    /status\s*never\s*change|my\s*application\s*still\s*pending\s*abeg|nothing\s*don\s*enter\s*since|e\s*dey\s*pending\s*tire|how\s*far\s*my\s*loan\s*now|una\s*never\s*pay\s*me\s*at\s*all/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 138', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|never)\s*(gree|work|enter)|utme\s*reject|jamb\s*verification\s*fail(ed)?/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 138', 'applying', entities, true)
  }

  if (
    /email\s*(has\s*)?already\s*been\s*used|i\s*used\s*(this|dis)\s*mail\s*last\s*year|registered\s*last\s*session/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 138', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*show|institution\s*not\s*in\s*(the\s*)?list|school\s*no\s*appear/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 138', 'applying', entities, true)
  }

  if (
    /how\s*(do\s*i|to)\s*repay|when\s*repayment\s*start|gsi\s*deduction|pay\s*back\s*the\s*loan/i.test(q)
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 138', 'repaying', entities)
  }

  return null
}
