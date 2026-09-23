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
 * Hourly 136 2026-09-23: pending-status is the largest named unknown topic.
 * Extra sentence shapes that still miss earlier residualPending / hourly modules.
 */
export function residualOtherHourly136(text: string, entities: string[]): IntentResult | null {
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
    /tin\s*still\s*dey\s*(submitted|pending|applied)|e\s*still\s*show\s*(submitted|applied|pending)|portal\s*still\s*(dey\s*)?(show|write)\s*(submitted|pending|applied)|word\s*never\s*change|nothing\s*(don|has)\s*change|status\s*no\s*change|same\s*word\s*(since|still)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status', 'same-word'], 'Same submitted word leftover 136', 'waiting', entities, true)
  }

  if (
    /alert\s*(no|never|not)\s*(drop|enter|show|come)|no\s*alert\s*(at\s*all|since)|bank\s*alert\s*(no|never)|i\s*never\s*see\s*alert/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'no-alert'], 'No bank alert leftover 136', 'waiting', entities, true)
  }

  if (
    /batch\s*(don\s*)?(pass|pay)\s*(me|my\s*mates?|everybody)|dem\s*pay\s*(my\s*)?(mates?|class|hostel)|others\s*(don|have)\s*(collect|receive)|everybody\s*(don|has)\s*(collect|see)\s*(money|alert)|my\s*mates?\s*(don|have)\s*(collect|see)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'batch-miss'], 'Batch paid others leftover 136', 'waiting', entities, true)
  }

  if (
    /i\s*don\s*wait\s*(two|2|three|3|four|4)?\s*(months?|weeks?|days?)|wait(ed|ing)?\s*(for\s*)?(two|2|three|3)\s*months?|since\s*(june|july|august|september|may)\s*(e\s*)?(still|never)|apply\s*since\s*(june|july|august|september|last\s*session)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'long-wait'], 'Waited months leftover 136', 'waiting', entities, true)
  }

  if (
    /my\s*file\s*(no|never|not)\s*(move|change)|file\s*no\s*dey\s*move|application\s*stuck|e\s*stuck\s*(for|on)\s*(pending|submitted)|stuck\s*(on|for)\s*(pending|submitted|processing)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'stuck'], 'File stuck leftover 136', 'waiting', entities, true)
  }

  if (
    /dem\s*(don\s*)?pay\s*(the\s*)?school\s*(i|but)\s*never|school\s*(don|has)\s*(collect|receive).{0,28}(i|me)\s*never|institution\s*(don|has)\s*(collect|receive).{0,20}(no|never)\s*(upkeep|alert|mine)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'school-paid-me-wait'], 'School paid I wait leftover 136', 'waiting', entities, true)
  }

  if (
    /how\s*far\s*(na\s*)?(this|dis)\s*(my\s*)?(own|tin|file)|wetin\s*dey\s*happen\s*(to\s*)?(my\s*)?(own|loan|application)|any\s*movement\s*(for|on)\s*(my\s*)?(own|loan)|my\s*own\s*never\s*move/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'how-far'], 'How far this my own leftover 136', 'waiting', entities, true)
  }

  return null
}
