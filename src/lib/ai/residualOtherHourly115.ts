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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept/i.test(
    q,
  )
}

/**
 * Hour-115 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Target: residual other via Pidgin + vague help, plus leftover pending / jamb / login.
 */
export function residualOtherHourly115(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /^(abeg|pls|please|jare)?\s*(help|assist|guide)\s*(me\s*)?(small|abeg|pls|please|jo)?\.?$/i.test(q) ||
    /una\s*fit\s*(help|assist|guide)\s*(me)?/i.test(q) ||
    /i\s*(just\s*)?(need|wan|want)\s*(una\s*)?help/i.test(q) ||
    /i\s*no\s*(sabi|know)\s*(wetin|where|how)\s*(to\s*)?(start|begin|do|ask)/i.test(q) ||
    /make\s*una\s*(yarn|talk|guide|show)\s*me\s*(small)?/i.test(q) ||
    /wetin\s*i\s*(suppose|go|fit)\s*(do|ask)\s*(now|here)?/i.test(q) ||
    /i\s*dey\s*(lost|confused|stranded|blank)/i.test(q) ||
    /how\s*(this|dis)\s*(nelfund\s*)?(thing|matter)\s*(dey\s*)?work/i.test(q) ||
    /show\s*me\s*(short\s*)?(menu|options?)/i.test(q) ||
    /gimme\s*(the\s*)?(short\s*)?(list|menu)/i.test(q) ||
    /orientate\s*me/i.test(q) ||
    /point\s*me\s*(to\s*)?(where|wetin)/i.test(q) ||
    /i\s*no\s*know\s*where\s*to\s*(start|begin)/i.test(q) ||
    /kindly\s*assist(\s*me)?/i.test(q) ||
    /can\s*you\s*help\s*me\s*(with\s*)?(nelfund|this)?/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 115', 'exploring', entities)
  }

  if (
    /how\s*far\s*(na)?\s*(my|with)?\s*(own|loan|application|file|nelfund)?/i.test(q) ||
    /money\s*(never|no|not|neva)\s*(enter|drop|show|land|come)/i.test(q) ||
    /alert\s*(never|no|not|neva)\s*(enter|drop|come|show)/i.test(q) ||
    /e\s*(never|neva|still)\s*(enter|drop|move|change|pending)/i.test(q) ||
    /una\s*(never|neva|no)\s*pay\s*(me|am)/i.test(q) ||
    /dem\s*(never|neva|no)\s*pay\s*(me|am)/i.test(q) ||
    /still\s*(pending|processing|under\s*review)/i.test(q) ||
    /status\s*(no|not|never)\s*(change|move|update)/i.test(q) ||
    /wetin\s*(dey\s*)?happen\s*(to|for)\s*my/i.test(q) ||
    /i\s*don\s*apply\s*(since|long|already)/i.test(q) ||
    /when\s*(dem|they|una)\s*(go|will)\s*(pay|credit|release)/i.test(q) ||
    /mates?\s*(don|have)\s*(collect|receive|see)/i.test(q) ||
    /nothing\s*(don|has)\s*(drop|enter|happen)/i.test(q) ||
    /track\s*(my\s*)?(loan|application)/i.test(q) ||
    /any\s*update\s*(on|for)\s*my/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 115', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(error|wahala|fail|invalid|no\s*gree)/i.test(q) ||
    /jamb\s*(no|not|never)\s*(work|gree|verify|match)/i.test(q) ||
    /utme\s*(no|not|never)\s*(work|gree|verify)/i.test(q) ||
    /jamb\s*(reg|number|no)\s*(wrong|invalid|reject)/i.test(q) ||
    /caps\s*(no|not)\s*(show|gree)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 115', 'applying', entities, true)
  }

  if (
    /email\s*(already\s*)?(used|taken|exist|registered)/i.test(q) ||
    /registered\s*(last\s*)?year/i.test(q) ||
    /account\s*(already\s*)?(exist|dey)/i.test(q) ||
    /cannot\s*(login|log\s*in|sign\s*in)/i.test(q) ||
    /forgot\s*(my\s*)?password/i.test(q) ||
    /otp\s*(no|not|never)\s*(come|enter|dey)/i.test(q) ||
    /mail\s*(don|already)\s*(dey\s*)?use/i.test(q)
  ) {
    return hit('portal-login', 0.94, ['other'], 'Login leftover 115', 'applying', entities, true)
  }

  if (
    /school\s*(not|no|never)\s*(on\s*)?(the\s*)?(list|showing)/i.test(q) ||
    /my\s*school\s*no\s*dey/i.test(q) ||
    /institution\s*(not|no)\s*(found|listed|showing)/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 115', 'applying', entities, true)
  }

  if (
    /when\s*(do\s*i|to|i\s*go)\s*repay|how\s*(do\s*i|to)\s*pay\s*back|after\s*nysc|gsi\s*(start|begin)|repayment\s*(start|begin|plan)/i.test(q)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 115', 'repaying', entities)
  }

  return null
}
