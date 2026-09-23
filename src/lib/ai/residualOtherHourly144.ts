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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 144 2026-09-23: pending-status (admin 70) leftover other.
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly144(text: string, entities: string[]): IntentResult | null {
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
    /mates?\s*(don|have|has)\s*(collect|receive|see|get)|dem\s*don\s*pay\s*(my\s*)?(mates?|class|others|everybody)|class\s*(don|have)\s*(collect|receive)|people\s*(don|have)\s*(collect|receive).{0,24}(i|me)\s*(never|no)|una\s*pay\s*others|others\s*don\s*(see|collect)\s*(alert|money)|everybody\s*don\s*collect\s*except\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'mates-paid'], 'Mates paid leftover 144', 'waiting', entities, true)
  }

  if (
    /dashboard\s*(still\s*)?(0|zero|empty|blank)|total\s*loans?\s*(is\s*|still\s*)?(0|zero)|approved\s*(but|and)\s*(no|never|not)\s*(money|alert|upkeep)|approved\s*no\s*(pay|alert)|status\s*(na|is)\s*approved.{0,20}(no|never)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'dashboard-zero'], 'Approved no money leftover 144', 'waiting', entities, true)
  }

  if (
    /\bbatch\s*[1-9]\b|which\s*batch|third\s*batch|4th\s*batch|next\s*batch|my\s*batch\s*(never|no)|batch\s*(no|not|never)\s*(pay|drop|show)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'batch'], 'Batch leftover 144', 'waiting', entities, true)
  }

  if (
    /school\s*(don|has)\s*(collect|receive|get).{0,20}(fee|money|charge)|una\s*don\s*pay\s*(my\s*)?school|institutional.{0,16}(don|has)\s*pay|fees?\s*(don|has)\s*(enter|go)\s*(school|institution).{0,30}(i|me)\s*(never|no)\s*(see|get)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'school-paid'], 'School paid student wait 144', 'waiting', entities, true)
  }

  if (
    /my\s*application\s*(is|dey|still)\s*(pending|processing)|how\s*far\s*(with\s*)?(my\s*)?(own|loan|file)|money\s*never\s*enter|status\s*still\s*processing|application\s*is\s*pending|e\s*never\s*(move|change|enter)|still\s*dey\s*wait|no\s*disbursement\s*yet|i\s*apply\s*(finish|since)|nothing\s*don\s*(enter|drop)|wetin\s*(dey\s*)?happen\s*to\s*my/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending core paraphrase 144', 'waiting', entities, true)
  }

  if (
    /track\s*(my\s*)?(loan|application|file)|follow\s*up\s*(on\s*)?(my\s*)?(loan|application)|any\s*(news|update)\s*(on|about)\s*my|when\s*(will|go)\s*(my\s*)?(money|upkeep)\s*(enter|drop)|i\s*don\s*wait\s*(pass|too)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status', 'track'], 'Track / follow-up leftover 144', 'waiting', entities, true)
  }

  return null
}
