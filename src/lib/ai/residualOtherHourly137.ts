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
 * Hourly 137 2026-09-23: residual `other` still largest (324).
 * Extra Pidgin + vague help + fragments that miss exact-start soft-route.
 */
export function residualOtherHourly137(text: string, entities: string[]): IntentResult | null {
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
    /i\s*just\s*land|una\s*dey\??$|e\s*no\s*clear|make\s*una\s*help|small\s*help(\s*abeg)?|i\s*lost(\s*abeg)?|wetin\s*next\s*for\s*student|i\s*need\s*una(\s*support)?|biko\s*help|na\s*how(\s*e\s*be)?$|i\s*come(\s*abeg)?$|pls\s*guide\s*me\s*jo|i\s*wan\s*use\s*(this|dis)\s*thing|start\s*me(\s*abeg)?|where\s*i\s*go\s*begin|i\s*no\s*get\s*gist|help\s*student\s*abeg|just\s*help(\s*abeg)?|una\s*there\??|i\s*need\s*una\s*support|orient\s*me|show\s*menu|wetin\s*i\s*fit\s*ask|i\s*no\s*sabi\s*start|abeg\s*show\s*options|make\s*i\s*ask\s*how|any\s*tin\s*una\s*fit\s*yarn|i\s*dey\s*confused\s*small|no\s*question\s*yet|i\s*just\s*wan\s*see|help\s*joor|guide\s*joor|pls\s*menu|wetin\s*dey\s*here\s*for\s*student/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague Pidgin help 137', 'exploring', entities)
  }

  if (
    /status\s*dey\s*same|nothing\s*enter\s*my\s*account|kobo\s*(no|never)\s*(show|enter|drop)|processing\s*since\s*last\s*(year|session)|e\s*still\s*dey\s*processing|my\s*tin\s*never\s*move|no\s*credit\s*alert\s*at\s*all/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 137', 'waiting', entities, true)
  }

  if (
    /jamb\s*reject(\s*am)?|invalid\s*jamb\s*no\.?|jamb\s*no\s*gree\s*me|utme\s*no\s*dey\s*work/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 137', 'applying', entities, true)
  }

  if (
    /email\s*(don|already)\s*use(d)?|i\s*register\s*last\s*year|mail\s*already\s*used|old\s*account\s*(still\s*)?dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 137', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*(the\s*)?(list|drop\s*down)|my\s*school\s*missing\s*(for\s*)?(list|portal)/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 137', 'applying', entities, true)
  }

  if (
    /when\s*(will|go)\s*i\s*(start\s*)?repay|how\s*i\s*go\s*pay\s*back|gsi\s*go\s*take/i.test(q)
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 137', 'repaying', entities)
  }

  return null
}
