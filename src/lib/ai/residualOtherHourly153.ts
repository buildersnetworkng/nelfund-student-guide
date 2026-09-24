import type { IntentId, IntentResult } from './types'
import { residualOtherHourly151 } from './residualOtherHourly151'

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
 * Hourly 153 2026-09-24: pending-status leftovers (largest unknown after other).
 * Formal, casual, Pidgin, fragments, typos. Never invent policy or pay dates.
 */
export function residualOtherHourly153(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  try {
    const newer = residualOtherHourly151(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /has\s*(nelfund|they|dem|una)\s*(paid|pay|disburse|send|sent)\s*(me|us|my\s*own)?|did\s*(they|dem|nelfund)\s*(already\s*)?(pay|paid|send)|any\s*(word|news|gist)\s*(on|about)\s*(my\s*)?(loan|upkeep|file)|stipend\s*(for\s*)?(two|2)\s*months?|allowance\s*(no|not|never)\s*(enter|drop|show)|upkeep\s*(no|not|never)\s*(enter|drop|show)|glitch\s*(on|for|dey)\s*(the\s*)?portal|portal\s*glitch|loan\s*(no|not|never)\s*(drop|enter|land|show)|nothing\s*(don|has)\s*(drop|enter)|i\s*don\s*apply\s*(but|since).{0,24}(nothing|no\s*money|no\s*alert)|they\s*approved\s*(my\s*)?mates|classmates?\s*(got|have|don)\s*(paid|pay|payment|collect)|file\s*(no|not|never)\s*(dey\s*)?move|una\s*forget\s*my\s*own|my\s*name\s*(no|not)\s*dey\s*(the\s*)?(pay\s*)?list|tinubu\s*(pay\s*)?list|pay\s*list\s*(abeg|pls)?|i\s*wan\s*check\s*if\s*dem\s*don\s*pay|any\s*disbursement\s*(yet|abeg)|when\s*(will|go)\s*(my\s*)?(money|loan|upkeep)\s*(enter|drop|show)|e\s*don\s*reach\s*(two|2)\s*months|two\s*months\s*(no|without)\s*(pay|alert|upkeep)|waiting\s*(two|2)\s*months|my\s*dashboard\s*(still\s*)?(show|shows|dey)\s*(pending|0|zero)|status\s*word\s*(no|not)\s*change|same\s*status\s*(since|for)|stuck\s*(on|at)\s*pending|pending\s*for\s*(weeks|months)|processing\s*for\s*(weeks|months)|no\s*credit\s*alert|credit\s*alert\s*(no|not|never)|bank\s*(no|not|never)\s*(see|show)\s*(nelfund|credit)|school\s*(say|said)\s*(dem|they)\s*never\s*(see|receive)\s*(the\s*)?(money|fees)|fees\s*never\s*reach\s*(school|campus)|has\s*the\s*money\s*been\s*(paid|sent)|have\s*they\s*paid\s*(the\s*)?(loan|upkeep)|una\s*don\s*pay\s*people|dem\s*don\s*pay\s*some\s*people|i\s*no\s*see\s*my\s*own|my\s*own\s*no\s*show\s*for\s*(the\s*)?list/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.9, ['pending-status'], 'Hourly 153 pending leftover', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(is\s*)?(not\s*)?valid|verification\s*failed\s*(on\s*)?(jamb|utme)|portal\s*(say|says|dey\s*talk)\s*(invalid\s*)?jamb|cannot\s*verify\s*(my\s*)?(jamb|utme)|jamb\s*reject(ed)?|utme\s*reject(ed)?|wrong\s*jamb\s*(reg|number)|jamb\s*no\s*gree\s*verify|caps\s*no\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.9, ['jamb'], 'Hourly 153 jamb leftover', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(is\s*)?(already|don)\s*(in\s*use|used|taken)|i\s*registered\s*(last\s*year|before)|cannot\s*create\s*(an?\s*)?account\s*with\s*this\s*email|mail\s*already\s*taken|email\s*taken\s*already|old\s*account\s*(dey|exists)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'Hourly 153 email used leftover', 'applying', entities, true)
  }

  if (
    /my\s*(school|uni|poly|college)\s*(no|not)\s*(dey|on)\s*(the\s*)?(list|dropdown)|institution\s*missing\s*on\s*(the\s*)?portal|school\s*no\s*dey\s*list|cannot\s*pick\s*(my\s*)?school|school\s*search\s*(no|not)\s*find/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'Hourly 153 school list leftover', 'applying', entities, true)
  }

  return null
}
