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
 * Hourly 125 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * New sentence shapes: formal, casual, Pidgin, fragments, typos.
 */
export function residualOtherHourly125(text: string, entities: string[]): IntentResult | null {
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
    /abeg\s*una\s*help(\s*me)?|i\s*just\s*land(\s*here)?|wetin\s*i\s*fit\s*ask(\s*you)?|show\s*(me\s*)?(options|menu)|i\s*dey\s*lost|na\s*wetin\s*you\s*dey\s*do|pls\s*orient\s*me|i\s*no\s*get\s*clue|start\s*from\s*(the\s*)?(beginning|scratch)|help\s*confused\s*student|una\s*fit\s*yarn\s*me\s*small|i\s*wan\s*start\s*but\s*i\s*no\s*know\s*how\s*to\s*begin|how\s*i\s*go\s*begin\s*(asking|here)|i\s*just\s*dey\s*enter|wetin\s*you\s*fit\s*do|gimme\s*options|i\s*need\s*orientation|kindly\s*show\s*topics|what\s*topics\s*you\s*cover|i\s*no\s*sabi\s*where\s*to\s*start|direct\s*me\s*abeg|help\s*me\s*find\s*my\s*way|i\s*dey\s*blank|blank\s*page\s*help|una\s*dey\s*there\s*abeg|pls\s*list\s*what\s*i\s*fit\s*ask|i\s*need\s*a\s*starting\s*point|how\s*to\s*use\s*una|how\s*to\s*use\s*this\s*app|i\s*come\s*online\s*now|first\s*time\s*here\s*abeg/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague help leftover 125', 'exploring', entities)
  }

  if (
    /file\s*still\s*stand|dem\s*never\s*settle\s*me|i\s*never\s*see\s*kobo|alert\s*never\s*come|how\s*far\s*una\s*reach\s*with\s*my|my\s*dashboard\s*(still|stil)\s*(zero|0)|batch\s*(never|no)\s*reach\s*me|una\s*don\s*forget\s*me|processing\s*no\s*end|under\s*review\s*no\s*move|status\s*no\s*change\s*since|i\s*apply\s*long\s*time\s*nothing/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 125', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not)\s*correct|utme\s*no\s*gree|admission\s*no\s*match|jamb\s*profile\s*(reject|fail)|caps\s*wahala|verify\s*utme|jamb\s*no\s*dey\s*work|invalid\s*jamb\s*reg/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 125', 'applying', entities, true)
  }

  if (
    /that\s*mail\s*don\s*exist|email\s*already\s*in\s*use|i\s*register\s*last\s*session|old\s*account\s*from\s*last\s*year|cannot\s*create\s*account\s*again|sign\s*up\s*say\s*email\s*used|forgot\s*last\s*year\s*password/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 125', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*the\s*list|dropdown\s*no\s*show\s*my\s*(uni|poly|school)|institution\s*search\s*empty|i\s*search\s*school\s*nothing\s*come|campus\s*missing\s*for\s*portal/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 125', 'applying', entities, true)
  }

  if (
    /how\s*dem\s*go\s*collect\s*the\s*money|when\s*repayment\s*go\s*start|after\s*nysc\s*how\s*i\s*pay|salary\s*go\s*cut|gsi\s*go\s*hold\s*me|pay\s*back\s*the\s*loan\s*how/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 125', 'repaying', entities)
  }

  return null
}
