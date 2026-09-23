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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 146 2026-09-23: pending-status leftover + other fragments.
 * Formal, casual, Pidgin, typos. Never invent policy or dates.
 */
export function residualOtherHourly146(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /kobo\s*(no|never|not)\s*(dey|enter|drop)|zero\s*naira|no\s*kobo|account\s*still\s*(empty|blank)|e\s*don\s*tey|una\s*forget\s*me|my\s*file\s*dey\s*sleep|stuck\s*(on|for)\s*pending|pending\s*(for\s*)?(months?|weeks?)|how\s*long\s*(to|before)\s*(approve|approval|pay)|how\s*many\s*days.{0,20}(approve|pay)|status\s*check|track\s*am|i\s*apply\s*last\s*(session|year).{0,24}(no|never)\s*(money|alert)|since\s*last\s*(session|year).{0,20}nothing|nothing\s*since\s*(january|february|march|april|may|june|july|august|september)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 146', 'waiting', entities, true)
  }

  if (
    /e\s*never\s*show\s*for\s*(bank|account)|bank\s*(still\s*)?(empty|zero)|no\s*credit\s*since|alert\s*no\s*dey|sms\s*no\s*dey|dem\s*forget\s*my\s*(own|file)|my\s*own\s*dey\s*behind|i\s*remain|only\s*me\s*remain|una\s*skip\s*me|skip\s*my\s*name/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Skipped / empty bank 146', 'waiting', entities, true)
  }

  if (
    /how\s*long\s*does\s*it\s*take\s*to\s*(approve|process)|approval\s*time|processing\s*time|sla|how\s*many\s*weeks/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.9, ['pending-status'], 'How long approval 146', 'waiting', entities, true)
  }

  return null
}
