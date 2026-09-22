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
 * Hourly 127 2026-09-22: other 324 still largest unknown bucket.
 * New vague-help + Pidgin fragments. Never dump live open/closed.
 */
export function residualOtherHourly127(text: string, entities: string[]): IntentResult | null {
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
    /abeg\s*help\s*me\s*(small|now|here)?|help\s*me\s*abeg|i\s*need\s*(una\s*)?help(\s*jare)?|una\s*fit\s*help\s*me|pls\s*help(\s*me)?(\s*jare)?|i\s*no\s*sabi\s*(anything|wetin\s*to\s*do)|how\s*una\s*take\s*dey\s*help|gimme\s*(small\s*)?guide|i\s*wan\s*ask\s*(something|one\s*tin)|una\s*dey(\s*there)?\??$|make\s*una\s*guide\s*me|i\s*dey\s*confused\s*abeg|wetin\s*una\s*fit\s*assist|assist\s*me\s*(abeg|jare|pls)|kindly\s*assist(\s*me)?|i\s*just\s*wan\s*yarn|talk\s*to\s*me\s*abeg|where\s*i\s*go\s*start\s*from|i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*i\s*suppose\s*ask|help\s*confused|i\s*dey\s*lost\s*here|show\s*me\s*wetin\s*you\s*cover|list\s*topics\s*abeg|i\s*need\s*direction|point\s*me\s*abeg|make\s*i\s*ask\s*how|how\s*this\s*chat\s*work|wetin\s*this\s*bot\s*dey\s*do|who\s*you\s*be\s*abeg|i\s*come\s*ask\s*question|just\s*help\s*me\s*navigate/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.93, ['other', 'greeting-vague'], 'Vague help leftover 127', 'exploring', entities)
  }

  if (
    /money\s*never\s*show\s*for\s*(my\s*)?(account|bank)|dem\s*never\s*pay\s*me|how\s*far\s*my\s*(loan|file|matter)|i\s*don\s*wait\s*(too\s*)?long|nothing\s*don\s*enter\s*since|una\s*never\s*settle\s*my\s*own|my\s*own\s*never\s*drop|alert\s*no\s*dey|zero\s*for\s*dashboard\s*still|batch\s*no\s*reach\s*my\s*side|status\s*still\s*the\s*same\s*word/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 127', 'waiting', entities, true)
  }

  if (
    /jamb\s*no\s*gree\s*enter|utme\s*reject\s*me|jamb\s*say\s*error|portal\s*no\s*accept\s*jamb|my\s*jamb\s*no\s*match|caps\s*and\s*jamb\s*wahala|verify\s*my\s*jamb\s*abeg|jamb\s*number\s*no\s*work/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 127', 'applying', entities, true)
  }

  if (
    /email\s*don\s*dey\s*use|mail\s*already\s*register|i\s*use\s*this\s*mail\s*last\s*year|last\s*year\s*account\s*still\s*dey|cannot\s*sign\s*up\s*again|create\s*account\s*say\s*used|old\s*nelfund\s*mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 127', 'applying', entities, true)
  }

  if (
    /school\s*name\s*no\s*dey|i\s*no\s*see\s*my\s*school|search\s*my\s*uni\s*nothing|poly\s*no\s*dey\s*list|college\s*missing\s*for\s*dropdown/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 127', 'applying', entities, true)
  }

  if (
    /how\s*i\s*go\s*pay\s*back|dem\s*go\s*cut\s*salary|after\s*service\s*how\s*i\s*repay|gsi\s*mandate|repay\s*the\s*loan\s*abeg|when\s*i\s*go\s*start\s*to\s*pay/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 127', 'repaying', entities)
  }

  return null
}
