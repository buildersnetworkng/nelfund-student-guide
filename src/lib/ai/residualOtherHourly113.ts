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
 * Hour-113 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Vague Pidgin help, extra pending / JAMB / school-list / email-used shapes.
 */
export function residualOtherHourly113(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /email\s*(i\s*)?(use|used)\s*(last\s*year|before|previously)/i.test(q) ||
    /last\s*year\s*(i\s*)?(register|registered|sign\s*up)/i.test(q) ||
    /mail\s*(don|already)\s*(dey|been)\s*(use|used|take|taken)/i.test(q) ||
    /this\s*email\s*(no|not|never)\s*(gree|work)\s*(again|again\s*o)?/i.test(q) ||
    /sign\s*up\s*(say|says?)\s*(email|mail)\s*(exist|used)/i.test(q) ||
    /i\s*use\s*(this|dis)\s*(same\s*)?(mail|email)\s*(last\s*year|before)/i.test(q)
  ) {
    return hit('portal-login', 0.95, ['other'], 'Email used last year leftover 113', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)\s*(the\s*)?(list|portal|dropdown)/i.test(q) ||
    /my\s*(school|uni|poly|college)\s*(no|not|never)\s*(dey|show)/i.test(q) ||
    /cannot\s*find\s*(my\s*)?(school|institution)/i.test(q) ||
    /institution\s*(no|not)\s*(on|in)\s*(the\s*)?list/i.test(q) ||
    /school\s*list\s*(no|not|empty|blank)/i.test(q) ||
    /dropdown\s*(no|not)\s*(get|show)\s*(my\s*)?(school|uni)/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School not on list leftover 113', 'applying', entities, true)
  }

  if (
    /how\s*far\s*(na|now|abeg)?\s*(una|my\s*loan|my\s*own)?/i.test(q) ||
    /e\s*never\s*(move|change|enter|drop)/i.test(q) ||
    /status\s*(still\s*)?(na|is)\s*(pending|processing|review)/i.test(q) ||
    /i\s*don\s*apply\s*(since|from)\s*(last|january|months?)/i.test(q) ||
    /una\s*go\s*pay\s*(when|when\s*now)/i.test(q) ||
    /my\s*mates\s*don\s*(collect|receive|see)\s*(money|alert|theirs)/i.test(q) ||
    /nothing\s*don\s*(show|happen)\s*(for|on)\s*(my\s*)?(portal|dashboard)/i.test(q) ||
    /dashboard\s*(still\s*)?(zero|0|empty)/i.test(q) ||
    /batch\s*(no|not|never)\s*(reach|include)\s*me/i.test(q) ||
    /wetin\s*hold\s*(this|dis)\s*(application|file|loan)/i.test(q) ||
    /processing\s*(since|for)\s*(weeks?|months?)/i.test(q) ||
    /i\s*submit\s*(am|it)\s*(long|since)/i.test(q) ||
    /no\s*credit\s*alert\s*(since|at\s*all)/i.test(q)
  ) {
    return hit('pending-application', 0.96, ['pending-status'], 'Pending leftover 113', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never)\s*(dey|gree|work|pass|verify)/i.test(q) ||
    /invalid\s*(jamb|utme)\s*(no|number|reg)/i.test(q) ||
    /jamb\s*(reg|registration)\s*(wrong|error|fail)/i.test(q) ||
    /portal\s*(say|says?)\s*(invalid|wrong)\s*jamb/i.test(q) ||
    /utme\s*(no|not)\s*(verify|gree)/i.test(q) ||
    /jamb\s*caps\s*(no|not|never)/i.test(q) ||
    /direct\s*entry\s*(jamb|verification)\s*(fail|issue)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 113', 'applying', entities, true)
  }

  if (
    /how\s*(i|we)\s*(go|fit)\s*pay\s*(am|back|the\s*loan)/i.test(q) ||
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?repay/i.test(q) ||
    /repayment\s*(start|begin|commence)/i.test(q) ||
    /after\s*nysc\s*(i\s*)?(go|will)\s*pay/i.test(q) ||
    /wetin\s*be\s*(the\s*)?repay(ment)?/i.test(q) ||
    /10\s*%|ten\s*percent\s*(of\s*)?(salary|pay)/i.test(q)
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 113', 'repaying', entities)
  }

  if (
    /abeg\s*(help|assist)\s*(me\s*)?(small|jare|jo)?/i.test(q) ||
    /i\s*just\s*(dey|come)\s*(here|ask)/i.test(q) ||
    /wetin\s*una\s*(fit|can)\s*(do|help)/i.test(q) ||
    /show\s*me\s*(wetin|what)\s*(i\s*)?(fit|can)\s*ask/i.test(q) ||
    /i\s*no\s*know\s*wetin\s*to\s*(type|ask|write)/i.test(q) ||
    /help\s*me\s*(with\s*)?(this|dis)\s*(nelfund\s*)?(matter|thing)/i.test(q) ||
    /orient\s*me|brief\s*me\s*(small|abeg)/i.test(q) ||
    /i\s*dey\s*stranded(\s*abeg)?/i.test(q)
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague help leftover 113', 'exploring', entities)
  }

  return null
}
