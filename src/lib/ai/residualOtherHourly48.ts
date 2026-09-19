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

/**
 * Hour-48 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * residualPendingMore was written but not wired; this file covers remaining short / pidgin leftovers.
 */
export function residualOtherHourly48(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 48', 'exploring', entities)
  }

  if (/^[.?!,\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 48', 'exploring', entities)
  }

  if (
    /\bjamb\b.{0,24}(no|not|never|invalid|wrong|fail|reject|gree)|invalid.{0,12}\bjamb\b|utme.{0,16}(invalid|fail|reject)|direct\s*entry.{0,20}jamb|old\s*(year\s*)?jamb|202[0-5]\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB leftover 48', 'applying', entities, true)
  }

  if (
    /e\s*dey\s*(processing|pending|review)|still\s*(processing|pending)|nothing\s*don\s*(drop|enter|show)|mates?\s*don\s*(collect|receive|get)|class\s*(don|have)\s*(collect|get)|only\s*me\s*(remain|never)|una\s*don\s*pay\s*(my\s*)?school|school\s*don\s*(collect|receive).{0,24}(me|i|upkeep)\s*(never|no)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.92,
      ['pending-status', 'other'],
      'Processing / mates paid leftover 48',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /account\s*creation\s*(open|dey)|fit\s*i\s*create\s*account|can\s*i\s*create\s*(an?\s*)?account|sign\s*up\s*(still\s*)?(open|dey)|loan\s*window|upkeep\s*window|2026\s*\/?\s*2027.{0,20}(open|close|apply)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Account vs loan window leftover 48', 'exploring', entities)
  }

  if (/email\s*(already|don)\s*(register|use|used|exist)|last\s*year\s*(i\s*)?(register|apply)|old\s*email/i.test(q)) {
    return hit('portal-login', 0.92, ['login', 'other'], 'Email already used leftover 48', 'applying', entities, true)
  }

  if (/school\s*(no|not)\s*(on|dey)\s*(the\s*)?list|institution\s*not\s*found|my\s*school\s*no\s*dey/i.test(q)) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School list leftover 48', 'applying', entities, true)
  }

  if (/wetin\s*be\s*(nelfund|dis\s*scheme)|why\s*dem\s*(create|form)\s*(am|nelfund)|purpose\s*of\s*(this|dis)\s*loan/i.test(q)) {
    return hit('what-is-nelfund', 0.93, ['what-is', 'other'], 'Purpose leftover 48', 'exploring', entities)
  }

  return null
}
