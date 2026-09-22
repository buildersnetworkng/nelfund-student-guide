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
 * Hour-108 leftover catcher for residual unknown "other".
 * Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * New shapes: formal, casual, Pidgin, fragments, typos for vague help first.
 */
export function residualOtherHourly108(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(pls|plz|abeg|jare|jo|please|sir|ma)?\s*(help|halp|helep|asist|assist|guyd|guide|gide)\s*(me|us|am|una)?\s*(ooo+|oo+|abeg|pls|plz|please|small|jare|jo|now)?\.?$/i.test(q) ||
    /una\s*(fit|gree|dey|go)\s*(help|assist|guide|show|direct)\s*(me|us|am)?/i.test(q) ||
    /i\s*(just\s*)?(need|nid|ned|wan|want|dey\s*need)\s*(una\s*|your\s*)?(help|assistance|guide|direction)/i.test(q) ||
    /wetin\s*(i|una)\s*(suppose|supose|go|fit)\s*(do|ask|tok|try)(\s*(now|here|una|abeg|first))?/i.test(q) ||
    /i\s*dey\s*(lost|lose|confused|confuzed|confuse|stranded|blank|stuck|scatter)/i.test(q) ||
    /i\s*no\s*(sabi|saby|know|no)\s*(wetin|where|anytin|anything|how|to\s*start)/i.test(q) ||
    /make\s*una\s*(guide|help|show|orientate|explain|direct)\s*me/i.test(q) ||
    /can\s*(u|you|una)\s*(pls|plz|please)?\s*help\s*(me|us)/i.test(q) ||
    /kindly\s*(assist|help|guide)\s*(me|us)/i.test(q) ||
    /give\s*me\s*(a\s*)?(brief|short|small|quick)\s*(guide|menu|list|options?)/i.test(q) ||
    /show\s*me\s*(the\s*)?(short\s*)?(menu|options?|topics?)/i.test(q) ||
    /how\s*i\s*(go|fit|suppose)\s*(take\s*)?start/i.test(q) ||
    /point\s*me\s*(to\s*)?(where|wetin|official)/i.test(q) ||
    /wetin\s*(you|una)\s*(fit|can)\s*(do|help)/i.test(q) ||
    /orientate\s*me|direct\s*me(\s*abeg)?/i.test(q) ||
    /i\s*no\s*know\s*where\s*to\s*start/i.test(q) ||
    /^help(\s*me)?(\s*abeg|\s*pls|\s*plz|\s*please)?\.?$/i.test(q) ||
    /^assist(\s*me)?\.?$/i.test(q) ||
    /na\s*una\s*i\s*come\s*meet/i.test(q) ||
    /i\s*just\s*dey\s*(here|lost)|wetin\s*una\s*dey\s*do\s*here/i.test(q) ||
    /explain\s*(small|am)\s*(abeg|pls)?/i.test(q) ||
    /how\s*e\s*take\s*work\s*abeg/i.test(q) ||
    /i\s*wan\s*ask\s*(question|sometin|something)/i.test(q) ||
    /^(hi|hello|hey)\s+(pls|please|abeg)\s+(help|assist)/i.test(q) ||
    /i\s*(need|nid)\s*(direction|orientation|clarity)/i.test(q) ||
    /wetin\s*i\s*fit\s*ask\s*here/i.test(q) ||
    /una\s*dey\s*there\??$/i.test(q) ||
    /any\s*(help|guide)\s*(abeg|pls)?$/i.test(q) ||
    /make\s*i\s*ask\s*una\s*sometin/i.test(q) ||
    /i\s*no\s*get\s*direction/i.test(q) ||
    /abeg\s*show\s*me\s*road/i.test(q) ||
    /gimme\s*(menu|options|list)/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help / short menu 108', 'exploring', entities)
  }

  if (
    /how\s*far\s*(na\s*)?(this\s*)?(my\s*)?(own|file|loan|application|matter)/i.test(q) ||
    /e\s*never\s*(move|change|enter|drop)/i.test(q) ||
    /my\s*own\s*(still\s*)?(dey|is)?\s*(there|pending|same)/i.test(q) ||
    /una\s*don\s*forget\s*(my\s*)?(file|own|application)/i.test(q) ||
    /any\s*(news|word|update)\s*(for|on)\s*(my\s*)?(loan|file|own)/i.test(q) ||
    /status\s*(never|no|not)\s*(change|update|move)/i.test(q) ||
    /i\s*submit(ted)?\s*(since|last)/i.test(q) ||
    /dem\s*say\s*(pending|review)/i.test(q) ||
    /wetin\s*remain\s*(for|on)\s*(my\s*)?(file|application)/i.test(q) ||
    /i\s*dey\s*wait\s*(this\s*)?(loan|upkeep|money)/i.test(q) ||
    /pending\s*(still|stil|dey|na)/i.test(q) ||
    /no\s*(credit\s*)?alert\s*(since|at\s*all)/i.test(q) ||
    /e\s*still\s*dey\s*(pending|review|there)/i.test(q) ||
    /nothing\s*(don\s*)?happen\s*(to\s*)?(my\s*)?(file|loan)/i.test(q) ||
    /my\s*dashboard\s*(still\s*)?(zero|0|empty)/i.test(q) ||
    /una\s*never\s*(pay|approve)\s*(my\s*)?(own|loan)/i.test(q)
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 108', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number|reg)\s*(no|not|never|nt)\s*(gree|work|valid)/i.test(q) ||
    /e\s*say\s*(my\s*)?jamb\s*(wrong|invalid|no\s*dey)/i.test(q) ||
    /utme\s*(no|number)\s*(invalid|reject|fail)/i.test(q) ||
    /jamb\s*registration\s*(no|number)\s*(reject|fail)/i.test(q) ||
    /portal\s*(no|not)\s*(accept|gree)\s*(my\s*)?jamb/i.test(q) ||
    /correct\s*(my\s*)?jamb/i.test(q) ||
    /jamb\s*(caps|admission)\s*(no|not|never)\s*(match|show)/i.test(q) ||
    /invalid\s*jamb/i.test(q) ||
    /jamb\s*(wahala|issue|error|problem)/i.test(q) ||
    /my\s*jamb\s*(no|not)\s*(dey|work)/i.test(q) ||
    /fix\s*(this\s*)?jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 108', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)\s*(the\s*)?(list|portal|dropdown)/i.test(q) ||
    /i\s*no\s*see\s*(my\s*)?school/i.test(q) ||
    /institution\s*(not|no)\s*(listed|showing|available)/i.test(q) ||
    /my\s*(uni|poly|college|school)\s*(no|not)\s*(dey|on)\s*(the\s*)?list/i.test(q) ||
    /dropdown\s*(no|not)\s*(show|get)\s*(my\s*)?school/i.test(q) ||
    /school\s*name\s*(no|not)\s*(dey|there)/i.test(q) ||
    /find\s*my\s*school\s*(for|on)\s*(the\s*)?(list|portal)/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 108', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has|have|already)\s*(use|used|register)/i.test(q) ||
    /email\s*(na|is)\s*(already\s*)?(in\s*use|taken)/i.test(q) ||
    /i\s*register(ed)?\s*(last\s*)?(year|session)/i.test(q) ||
    /old\s*account/i.test(q) ||
    /use\s*(the\s*)?same\s*mail\s*(as|from)\s*last\s*year/i.test(q) ||
    /cannot\s*(enter|access)\s*(my\s*)?(old\s*)?account/i.test(q) ||
    /forgot\s*(the\s*)?(login|mail|password)/i.test(q) ||
    /mail\s*(don|already)\s*use/i.test(q) ||
    /last\s*year\s*(i\s*)?(register|apply)/i.test(q) ||
    /email\s*already\s*exist/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email / last-year register 108', 'applying', entities, true)
  }

  if (
    /how\s*(the\s*)?repay(ment)?\s*(go|dey|take)\s*(be|work)/i.test(q) ||
    /una\s*go\s*collect\s*(am|the\s*money)\s*how/i.test(q) ||
    /who\s*(go|will)\s*pay\s*(back|am)/i.test(q) ||
    /interest\s*(rate|percent)|how\s*much\s*interest/i.test(q) ||
    /do\s*i\s*(need\s*to\s*)?pay\s*(back|am)\s*(now|immediately)/i.test(q) ||
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?repay/i.test(q) ||
    /how\s*we\s*go\s*pay\s*(back|am)/i.test(q) ||
    /repay\s*(plan|period|start)/i.test(q) ||
    /loan\s*payback/i.test(q)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 108', 'repaying', entities)
  }

  return null
}
