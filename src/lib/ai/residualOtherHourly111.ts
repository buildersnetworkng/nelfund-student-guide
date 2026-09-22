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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)/i.test(
    q,
  )
}

/**
 * Hour-111 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still fall into other.
 */
export function residualOtherHourly111(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*(loan\s*)?application\s*(is|still|dey)\s*(pending|processing|under\s*review)/i.test(q) ||
    /how\s*far\s*(na\s*)?(my\s*)?(own|loan|file|application)/i.test(q) ||
    /money\s*(never|no|don\s*no)\s*(enter|drop|show|land)/i.test(q) ||
    /status\s*(still|dey|is)\s*(processing|pending|same|verified)/i.test(q) ||
    /dashboard\s*(still\s*)?(dey\s*)?(show(ing)?\s*)?(0|zero|nil)/i.test(q) ||
    /(mates?|paddy|course\s*mates?)\s*(don|have)\s*(collect|receive|see\s*money)/i.test(q) ||
    /verified\s*(but|and)\s*(no|not|never)\s*(disburse|paid|enter)/i.test(q) ||
    /school\s*(fees?|charges?)\s*(don|has)\s*(pay|paid|enter).{0,40}(upkeep|stipend|allowance)\s*(no|not|never)/i.test(q) ||
    /nothing\s*(don|has)\s*drop\s*(since|at\s*all)/i.test(q) ||
    /una\s*never\s*pay\s*(me|us|my\s*own)/i.test(q) ||
    /still\s*(dey|on)\s*(pending|processing)\s*(for|on)\s*(my\s*)?(own|portal|dashboard)/i.test(q) ||
    /wetin\s*(dey\s*)?happen\s*to\s*my\s*(loan|application|money|file)/i.test(q) ||
    /no\s*(credit\s*)?alert\s*(since|at\s*all|yet)/i.test(q) ||
    /application\s*(never|no)\s*(move|change|update)/i.test(q) ||
    /e\s*don\s*stay\s*(pending|same)\s*(pass|too)/i.test(q)
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending leftover 111', 'waiting', entities, true)
  }

  if (
    /^(abeg|pls|plz|please)?\s*(help|guide)\s*(me\s*)?(small|abeg|pls)?\.?$/i.test(q) ||
    /i\s*just\s*(dey\s*)?(find|look\s*for)\s*(sense|direction)/i.test(q) ||
    /point\s*me\s*(small|abeg)/i.test(q) ||
    /which\s*(one|matter)\s*(i\s*)?(fit|should)\s*(ask|start)/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 111', 'exploring', entities)
  }

  if (
    /jamb\s*(number|reg|no)\s*(not|no)\s*(valid|correct|dey)/i.test(q) ||
    /verification\s*failed\s*(on\s*)?(jamb|utme)/i.test(q) ||
    /invalid\s*jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 111', 'applying', entities, true)
  }

  return null
}
