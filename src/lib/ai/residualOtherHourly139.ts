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
 * Hourly 139 2026-09-23: pending-status is the largest named unknown topic (70).
 * Cover more sentence shapes that still fall into residual other.
 */
export function residualOtherHourly139(text: string, entities: string[]): IntentResult | null {
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
    /my\s*application\s*is\s*pending|how\s*far\s*my\s*own|money\s*never\s*enter|status\s*still\s*processing|tin\s*still\s*dey\s*pending|e\s*never\s*leave\s*pending|dashboard\s*still\s*(zero|0)|kobo\s*never\s*(enter|drop)|una\s*never\s*credit\s*me|processing\s*since|submitted\s*but\s*nothing|nothing\s*don\s*happen\s*to\s*my\s*(loan|file|own)|my\s*own\s*never\s*move|loan\s*dey\s*sleep|status\s*no\s*dey\s*change|e\s*just\s*dey\s*(there|pending)|when\s*go\s*my\s*own\s*enter|dem\s*forget\s*my\s*file|i\s*don\s*apply\s*but\s*nothing|application\s*hang\s*(for|on)\s*pending|still\s*see\s*pending\s*for\s*dashboard|my\s*nelfund\s*never\s*pay|upkeep\s*never\s*enter\s*my\s*account|school\s*fees\s*don\s*pay\s*but\s*i\s*never\s*see|how\s*far\s*na\s*this\s*my\s*application/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending paraphrase 139', 'waiting', entities, true)
  }

  if (
    /pls\s*i\s*just\s*dey\s*confused|una\s*fit\s*show\s*me\s*options|i\s*no\s*know\s*where\s*to\s*begin|help\s*me\s*small\s*jo|gimme\s*direction|i\s*wan\s*use\s*una\s*chat|wetin\s*i\s*fit\s*yarn\s*here|i\s*just\s*wan\s*ask\s*something\s*small|make\s*una\s*point\s*me/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague leftover 139', 'exploring', entities)
  }

  return null
}
