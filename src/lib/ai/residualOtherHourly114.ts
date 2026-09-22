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
 * Hour-114 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70.
 * Extra pending / how-far / money-never-enter shapes that still land in admin `other`.
 */
export function residualOtherHourly114(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /my\s*(application|loan|file|own)\s*(is|na|still|dey)?\s*(still\s*)?(pending|processing|under\s*review)/i.test(q) ||
    /application\s*(is\s*)?(still\s*)?(pending|processing)/i.test(q) ||
    /status\s*(still\s*)?(processing|pending|submitted|under\s*review)/i.test(q) ||
    /how\s*far\s*(my\s*)?(own|one|side|matter|tin|thing)/i.test(q) ||
    /how\s*far\s*(na\s*)?(with\s*)?(my\s*)?(nelfund|loan|application|file)/i.test(q) ||
    /money\s*(never|no|not)\s*(enter|drop|show|land|come)/i.test(q) ||
    /e\s*never\s*(enter|drop|land|show|move|change)/i.test(q) ||
    /nothing\s*(don|has|have)\s*(drop|enter|show|happen)/i.test(q) ||
    /una\s*never\s*(pay|credit|send)\s*(me|am|us)/i.test(q) ||
    /dem\s*never\s*(pay|credit|send)\s*(me|am|us)/i.test(q) ||
    /file\s*(no|not|never)\s*(dey\s*)?(move|change|update)/i.test(q) ||
    /e\s*still\s*dey\s*(pending|process|review)/i.test(q) ||
    /still\s*dey\s*(pending|process|wait)/i.test(q) ||
    /approved\s*(but|sha)\s*(no|never|not)\s*(alert|money|pay|enter)/i.test(q) ||
    /successful\s*(but|sha)\s*(no|never)\s*(money|alert)/i.test(q) ||
    /i\s*never\s*see\s*(alert|money|upkeep|credit)/i.test(q) ||
    /no\s*(alert|credit)\s*(don|has)\s*(enter|drop|come)/i.test(q) ||
    /wetin\s*(dey\s*)?happen\s*(to|with)\s*my\s*(loan|application|own|file)/i.test(q) ||
    /my\s*own\s*(never|no)\s*(enter|drop|move)/i.test(q) ||
    /they\s*have\s*not\s*(paid|credited)\s*me/i.test(q) ||
    /has\s*(my\s*)?(loan|application)\s*(been\s*)?(approved|paid|disbursed)/i.test(q) ||
    /when\s*(will|go)\s*(i|una|dem)\s*(see|get|collect)\s*(my\s*)?(money|upkeep|alert)/i.test(q) ||
    /processing\s*(for|since)\s*(weeks?|months?|long)/i.test(q) ||
    /under\s*review\s*(for|since)\s*(weeks?|months?)/i.test(q) ||
    /no\s*movement\s*(on|for)\s*(my\s*)?(file|application|loan)/i.test(q) ||
    /application\s*stuck\s*(on|at)\s*(pending|processing)/i.test(q)
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending leftover 114', 'waiting', entities, true)
  }

  if (
    /email\s*(already\s*)?(used|taken|exist)/i.test(q) ||
    /cannot\s*create\s*(an?\s*)?account\s*(with\s*)?(this|dis)\s*(email|mail)/i.test(q) ||
    /i\s*registered\s*last\s*year/i.test(q) ||
    /mail\s*(already|don)\s*(dey|been)\s*use/i.test(q)
  ) {
    return hit('portal-login', 0.95, ['other'], 'Email used leftover 114', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|dey\s*show)/i.test(q) ||
    /my\s*school\s*no\s*dey\s*(list|there)/i.test(q) ||
    /institution\s*(missing|absent)\s*(on|from)\s*(the\s*)?portal/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list leftover 114', 'applying', entities, true)
  }

  return null
}
