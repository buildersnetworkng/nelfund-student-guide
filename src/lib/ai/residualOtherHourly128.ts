import type { IntentId, IntentResult } from './types'
import { residualOtherHourly129 } from './residualOtherHourly129'

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
 * Hourly 128 2026-09-22: pending-status leftovers.
 * Hourly 129 runs first so new JAMB / pending shapes are not dropped.
 */
export function residualOtherHourly128(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly129(text, entities)
  if (newer) return newer
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
    /how\s*far\s*(my|dis|this)\s*(own|app|application|loan)|my\s*(own|app|application)\s*(still\s*)?(pending|processing|dey\s*pending)|money\s*never\s*enter|status\s*still\s*(processing|pending)|nothing\s*(don|has)\s*(drop|enter|show)|una\s*never\s*pay\s*me|mates?\s*(don|have)\s*(collect|receive)|my\s*dashboard\s*(still\s*)?(show|showing)\s*(pending|0|zero)|wetin\s*(dey\s*)?happen\s*to\s*my\s*(loan|app|own)|batch\s*(never|no)\s*(reach|come)|disburse[d]?\s*(never|no|not)\s*(show|enter)|alert\s*never\s*come|no\s*credit\s*alert|my\s*file\s*(no|not|never)\s*(move|update)|status\s*no\s*change|under\s*review\s*(still|since)|they\s*never\s*credit\s*me|e\s*still\s*dey\s*process|application\s*hang\s*for\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 128', 'waiting', entities, true)
  }

  if (
    /email\s*(already|has\s*been|don)\s*(used|taken|exist|registered)|i\s*registered\s*(last\s*year|before|already)|cannot\s*create\s*account\s*with\s*this\s*email|this\s*email\s*(is\s*)?(already|don)\s*(in\s*use|used)|account\s*(already|don)\s*exist|sign\s*up\s*say\s*email\s*(used|exist)|registered\s*last\s*session/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['login'], 'Email used leftover 128', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey|on\s*the\s*list)|my\s*school\s*no\s*dey\s*(list|there)|institution\s*(missing|not\s*showing|no\s*dey)|school\s*missing\s*on\s*(the\s*)?portal|institution\s*not\s*on\s*(the\s*)?list|cannot\s*find\s*my\s*(school|institution)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.95, ['school-list'], 'School missing leftover 128', 'applying', entities, true)
  }

  return null
}
