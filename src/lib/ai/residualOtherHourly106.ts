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
 * Hour-106 leftover catcher for residual unknown "other".
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: Pidgin + vague help, plus leftover pending / jamb / school / login.
 */
export function residualOtherHourly106(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|please|jare)?\s*(help|assist|guide)\s*(me|us)?\s*(abeg|pls|please|small|jare|jo)?\.?$/i.test(q) ||
    /una\s*fit\s*(help|assist|guide)\s*(me|us)?/i.test(q) ||
    /i\s*(just\s*)?(need|wan|want|dey\s*need)\s*(una\s*)?(help|assistance)/i.test(q) ||
    /wetin\s*i\s*(suppose|go|fit)\s*(do|ask)(\s*(now|here|una|abeg))?\??$/i.test(q) ||
    /i\s*dey\s*(lost|confused|stranded|blank)/i.test(q) ||
    /i\s*no\s*(sabi|know)\s*(wetin|where|anything|how)\s*(to\s*)?(start|begin|do)?/i.test(q) ||
    /make\s*una\s*(guide|help|show|orientate)\s*me/i.test(q) ||
    /can\s*(you|una)\s*(please\s*)?help\s*me(\s*with\s*(this\s*)?(nelfund|loan|portal))?\??$/i.test(q) ||
    /kindly\s*(assist|help|guide)\s*me/i.test(q) ||
    /give\s*me\s*(a\s*)?(brief|short|small)\s*(guide|menu|list|options?)/i.test(q) ||
    /show\s*me\s*(the\s*)?(short\s*)?(menu|options?|topics?)/i.test(q) ||
    /how\s*i\s*(go|fit)\s*(take\s*)?start(\s*(this|dis)\s*(thing|matter|nelfund))?/i.test(q) ||
    /point\s*me\s*(to\s*)?(where|wetin|official)/i.test(q) ||
    /wetin\s*(you|una)\s*(fit|can)\s*(do|help)/i.test(q) ||
    /orientate\s*me|direct\s*me(\s*abeg)?/i.test(q) ||
    /i\s*no\s*know\s*where\s*to\s*start/i.test(q) ||
    /^help(\s*me)?(\s*abeg|\s*pls|\s*please)?\.?$/i.test(q) ||
    /^assist(\s*me)?\.?$/i.test(q) ||
    /na\s*una\s*i\s*come\s*meet/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help / short menu 106', 'exploring', entities)
  }

  if (
    /how\s*far\s*(na\s*)?(this\s*)?(my\s*)?(own|file|loan|application|matter)/i.test(q) ||
    /e\s*never\s*(move|change|enter|drop)/i.test(q) ||
    /my\s*own\s*(still\s*)?(dey|is)?\s*(there|pending|same)/i.test(q) ||
    /una\s*don\s*forget\s*(my\s*)?(file|own|application)/i.test(q) ||
    /any\s*(news|word|update)\s*(for|on)\s*(my\s*)?(loan|file|own)/i.test(q) ||
    /status\s*(never|no|not)\s*(change|update|move)\s*(since|at\s*all)?/i.test(q) ||
    /i\s*submit(ted)?\s*(since|last)\s+\w+/i.test(q) ||
    /dem\s*say\s*(pending|review).{0,16}(till|since|still)/i.test(q) ||
    /wetin\s*remain\s*(for|on)\s*(my\s*)?(file|application)/i.test(q) ||
    /i\s*dey\s*wait\s*(this\s*)?(loan|upkeep|money)\s*(since|tire)/i.test(q)
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 106', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|not|never)\s*(gree|work|valid)/i.test(q) ||
    /e\s*say\s*(my\s*)?jamb\s*(wrong|invalid|no\s*dey)/i.test(q) ||
    /utme\s*(no|number)\s*(invalid|reject|fail)/i.test(q) ||
    /jamb\s*registration\s*(no|number)\s*(reject|fail)/i.test(q) ||
    /portal\s*(no|not)\s*(accept|gree)\s*(my\s*)?jamb/i.test(q) ||
    /correct\s*(my\s*)?jamb/i.test(q) ||
    /jamb\s*(caps|admission)\s*(no|not|never)\s*(match|show)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 106', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)\s*(the\s*)?(list|portal|dropdown)/i.test(q) ||
    /i\s*no\s*see\s*(my\s*)?school(\s*for\s*(the\s*)?list)?/i.test(q) ||
    /institution\s*(not|no)\s*(listed|showing|available)/i.test(q) ||
    /my\s*(uni|poly|college|school)\s*(no|not)\s*(dey|on)\s*(the\s*)?list/i.test(q) ||
    /dropdown\s*(no|not)\s*(show|get)\s*(my\s*)?school/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 106', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has|have|already)\s*(use|used|register)/i.test(q) ||
    /email\s*(na|is)\s*(already\s*)?(in\s*use|taken)/i.test(q) ||
    /i\s*register(ed)?\s*(last\s*)?(year|session).{0,20}(email|login|account)/i.test(q) ||
    /old\s*account.{0,16}(email|login|password)/i.test(q) ||
    /use\s*(the\s*)?same\s*mail\s*(as|from)\s*last\s*year/i.test(q) ||
    /cannot\s*(enter|access)\s*(my\s*)?(old\s*)?account/i.test(q) ||
    /forgot\s*(the\s*)?(login|mail|password)/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email / last-year register 106', 'applying', entities, true)
  }

  if (
    /how\s*(the\s*)?repay(ment)?\s*(go|dey|take)\s*(be|work)/i.test(q) ||
    /una\s*go\s*collect\s*(am|the\s*money)\s*how/i.test(q) ||
    /who\s*(go|will)\s*pay\s*(back|am)/i.test(q) ||
    /interest\s*(rate|percent)|how\s*much\s*interest/i.test(q) ||
    /gsi\s*(go|will|dey)\s*(start|cut)/i.test(q) ||
    /do\s*i\s*(need\s*to\s*)?pay\s*(back|am)\s*(now|immediately)/i.test(q)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 106', 'repaying', entities)
  }

  return null
}
