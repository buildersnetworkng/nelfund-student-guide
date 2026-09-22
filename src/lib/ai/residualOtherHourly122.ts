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
 * Hour-122 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual "other" Pidgin + vague help, then leftover pending / jamb / login / school.
 */
export function residualOtherHourly122(text: string, entities: string[]): IntentResult | null {
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
    /abeg\s*(una\s*)?(help|guide|assist|yarn|show)\s*(me)?|una\s*fit\s*(help|guide|yarn)\s*(me)?(\s*small)?|i\s*(just\s*)?(dey\s*)?(lost|confused|blank|stranded)|i\s*no\s*sabi\s*(wetin|how|where)\s*(to\s*)?(start|begin|enter)?|make\s*una\s*(guide|help|show)\s*me\s*(small)?|gimme\s*(short\s*)?(menu|list|options)|show\s*me\s*(wetin|what)\s*(i\s*)?(fit|can)\s*ask|how\s*(e|this|dis)\s*matter\s*take\s*be|i\s*need\s*(small|quick)\s*orientation|orientate\s*me\s*(abeg|pls)?|wetin\s*una\s*(fit|dey)\s*do\s*(here|for\s*here)|na\s*wetin\s*i\s*(suppose|fit)\s*ask|help\s*me\s*(navigate|find\s*my\s*way)|i\s*no\s*know\s*wetin\s*to\s*type|just\s*help\s*me\s*(abeg|jo)|pls\s*orientate|kindly\s*point\s*me|i\s*wan\s*una\s*direct\s*me|how\s*i\s*go\s*take\s*use\s*(this|dis)\s*(bot|chat|ai)|wetin\s*this\s*(bot|ai)\s*(fit|can)\s*do/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 122', 'exploring', entities)
  }

  if (
    /my\s*(own|file|loan|app)\s*(still\s*)?(dey|is)\s*(there|same|pending)|dem\s*hold\s*am\s*(since|still)|nothing\s*don\s*(show|enter|change)\s*(since|at\s*all)|i\s*don\s*wait\s*(tire|finish)|waiting\s*tire|status\s*no\s*gree\s*change|e\s*still\s*write\s*pending|portal\s*still\s*write\s*(pending|processing)|una\s*forget\s*my\s*file|my\s*batch\s*never\s*(pay|drop)|mates\s*don\s*(collect|receive)\s*(theirs|theirs\s*own)|class\s*don\s*collect\s*except\s*me|how\s*far\s*(na|now)\s*(abeg)?|wetin\s*dey\s*sup\s*with\s*my\s*(loan|file)|any\s*news\s*on\s*my\s*(loan|application)|update\s*abeg|i\s*check\s*am\s*now\s*now|i\s*refresh\s*(everyday|every\s*day)|still\s*the\s*same\s*word|same\s*status\s*since/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 122', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|not|never)\s*(gree|work|enter)|jamb\s*(dey\s*)?(reject|bounce)|utme\s*(no|not)\s*(gree|work)|caps\s*(no|not)\s*(gree|match)|jamb\s*error|wrong\s*jamb|jamb\s*wahala|e\s*say\s*invalid\s*jamb|verification\s*for\s*jamb\s*(fail|failed)|jamb\s*reg\s*(no|not)\s*(correct|valid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 122', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|already)\s*(dey|used|register)|mail\s*(don|already)\s*exist|i\s*use\s*(am|this\s*mail)\s*last\s*(year|session)|cannot\s*register\s*(again|twice)|sign\s*up\s*(no|not)\s*gree|account\s*dey\s*already|i\s*don\s*get\s*account\s*before|old\s*email\s*(no|not)\s*gree\s*login/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 122', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*(the\s*)?(drop\s*)?down|institution\s*no\s*show|my\s*poly\s*no\s*dey|college\s*no\s*dey\s*list|search\s*(school|institution)\s*(no|not)\s*(work|show)|i\s*no\s*see\s*(my\s*)?school\s*(for|on)\s*(the\s*)?(list|portal)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 122', 'applying', entities, true)
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?pay\s*(back|am)|how\s*(dem|they)\s*(take\s*)?collect\s*(the\s*)?loan|salary\s*deduct|after\s*service\s*(year|year\s*two)|nysc\s*(finish|done).{0,16}(pay|repay)|how\s*repayment\s*dey\s*work|wetin\s*be\s*repayment|loan\s*payback|dem\s*go\s*cut\s*(my\s*)?salary/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 122', 'repaying', entities)
  }

  return null
}
