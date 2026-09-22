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
 * Hour-124 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still leak as other/unknown.
 */
export function residualOtherHourly124(text: string, entities: string[]): IntentResult | null {
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
    /dashboard\s*(still\s*)?(zero|0|empty|blank)|my\s*dashboard\s*(na|is)\s*(0|zero)|total\s*(loan|amount)\s*(still\s*)?(0|zero)|balance\s*(still\s*)?(0|zero|empty)|file\s*(no|not|never)\s*(move|change)|batch\s*(never|no|not)\s*(reach|include)\s*me|una\s*forget\s*(my\s*)?own|status\s*(na|is)\s*submitted(\s*only)?|e\s*dey\s*submitted\s*since|processing\s*since|i\s*submit(ted)?\s*since|hostel\s*(people|mates)\s*(don|have)\s*(collect|receive)|dem\s*pay\s*(my\s*)?(hostel|room|class)\s*(people|mates)|upkeep\s*(no|not|never)\s*(show|enter|drop)\s*(for|in)?\s*(account|bank)?|no\s*credit\s*alert\s*since|since\s*i\s*apply.{0,20}(nothing|no\s*alert|zero)|nothing\s*for\s*(my\s*)?(account|bank)\s*since|my\s*file\s*still\s*(the\s*)?same|e\s*never\s*leave\s*pending|stuck\s*(for|on)\s*(pending|submitted|processing)|una\s*no\s*remember\s*my\s*file|when\s*my\s*batch\s*go\s*pay|i\s*no\s*see\s*my\s*name\s*(for|on)\s*(the\s*)?(list|batch)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 124', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg|registration|no|number)?\s*(no|not|never)\s*(valid|correct|gree)|invalid\s*jamb(\s*number)?|jamb\s*(verification|verify)\s*(fail|failed|error)|utme\s*(number|reg)\s*(reject|invalid)|e\s*say\s*jamb\s*(no|not)\s*valid|jamb\s*wahala|my\s*jamb\s*no\s*gree|cannot\s*verify\s*(my\s*)?jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 124', 'applying', entities, true)
  }

  if (
    /^(help|assist|guide)\s*(me)?\s*(abeg|pls|please)?$|i\s*need\s*help(\s*abeg)?$|wetin\s*una\s*fit\s*do\s*for\s*me|yarn\s*me\s*how\s*this\s*chat\s*work|i\s*dey\s*confused\s*(abeg)?$|make\s*we\s*start\s*(small)?$|what\s*can\s*you\s*help\s*(me\s*)?(with)?$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 124', 'exploring', entities)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)\s*(the\s*)?(list|dropdown|portal)|institution\s*(missing|absent)|my\s*school\s*no\s*dey\s*(the\s*)?list|poly\s*(no|not)\s*dey\s*(list|show)|college\s*(no|not)\s*dey\s*(list|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 124', 'applying', entities, true)
  }

  return null
}
