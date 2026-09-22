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
 * Hour-123 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other = Pidgin + vague help shapes, never live-status dump.
 */
export function residualOtherHourly123(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan|why\s*(they|una|fg)\s*(bring|form|start)\s*(am|nelfund)|nelfund\s*for\s*wetin/i.test(
      q,
    )
  )
    return null

  if (
    /^(abeg|pls|please|jo)\s*(help|guide|yarn|show|assist)\s*(me)?\s*(\?|abeg|jo)?$|una\s*fit\s*yarn\s*me\s*(small)?|i\s*just\s*land(\s*here)?|i\s*dey\s*lost\s*(small|here)?|make\s*una\s*yarn\s*me\s*(the\s*)?(gist|thing)|gimme\s*(the\s*)?(gist|menu|options)|brief\s*me\s*(abeg|pls)?|show\s*(me\s*)?(wetin|what)\s*(dey|is)\s*(here|available)|how\s*una\s*take\s*help\s*people|wetin\s*i\s*fit\s*ask\s*(una|here)|i\s*no\s*know\s*where\s*to\s*start|where\s*i\s*go\s*begin|start\s*me\s*(small|up)|orient\s*me|i\s*need\s*(una\s*)?(direction|compass)|point\s*me\s*(the\s*)?way|help\s*a\s*confused\s*student|confused\s*student\s*here|i\s*wan\s*ask\s*but\s*i\s*no\s*sabi\s*how|just\s*dey\s*here\s*(abeg)?|wetin\s*una\s*dey\s*help\s*(with|on)|give\s*me\s*(short\s*)?options|list\s*wetin\s*i\s*fit\s*ask|how\s*i\s*go\s*use\s*(una|this\s*chat)|chat\s*help\s*abeg/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.91, ['other', 'greeting-vague'], 'Vague help leftover 123', 'exploring', entities)
  }

  if (
    /approved\s*(but|yet)\s*(no|never)\s*(cash|money|alert)|loan\s*approved\s*no\s*(cash|pay)|dem\s*approve\s*but\s*(money|kobo)\s*never|disburse(ment)?\s*(no|never|pending)|no\s*disbursement|i\s*remain\s*(for\s*)?(class|hostel)|everybody\s*don\s*collect\s*except\s*me|una\s*pay\s*others|progress\s*on\s*my\s*(file|loan)|track\s*(my\s*)?(loan|application)|status\s*check\s*(abeg|pls)|how\s*far\s*una\s*reach\s*(with\s*)?(my|am)|bank\s*(still\s*)?(empty|blank)|wallet\s*never\s*(show|enter)|cash\s*never\s*drop|kobo\s*never\s*enter|zero\s*naira\s*still|i\s*don\s*see\s*(any\s*)?(credit|alert)\s*(at\s*all)?/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 123', 'waiting', entities, true)
  }

  if (
    /jamb\s*(profile|caps)\s*(no|not|never)\s*(match|gree)|utme\s*(reg\s*)?(no|not)\s*(correct|valid)|admission\s*letter\s*(jamb|utme)|jamb\s*number\s*(wrong|reject)|e\s*talk\s*say\s*(jamb|utme)\s*(invalid|incorrect)|verify\s*jamb\s*(no\s*gree|fail)|jamb\s*otp|jamb\s*portal\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 123', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(taken|use[d]?|exist)|this\s*mail\s*dey\s*use|i\s*register\s*(am|with\s*am)\s*last\s*(year|session)|duplicate\s*(email|account)|sign\s*up\s*page\s*(say|talk)\s*(exist|used)|cannot\s*create\s*(another|new)\s*account|old\s*login\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 123', 'applying', entities, true)
  }

  if (
    /my\s*(uni|university|polytechnic|college)\s*(no|not)\s*(dey|show)|school\s*name\s*(no|not)\s*(appear|show)|dropdown\s*(empty|blank)|search\s*bar\s*(no|not)\s*(find|show)\s*(school|institution)|i\s*type\s*(my\s*)?school\s*(no|nothing)\s*(show|come)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 123', 'applying', entities, true)
  }

  if (
    /how\s*(dem|they)\s*(go|will)\s*(take\s*)?(my\s*)?(salary|pay)|when\s*repayment\s*(start|begin)|after\s*nysc\s*(i\s*)?(go|will)\s*pay|payback\s*plan|loan\s*deduction|gsi\s*(mandate|wahala)|wetin\s*be\s*(the\s*)?payback/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 123', 'repaying', entities)
  }

  return null
}
