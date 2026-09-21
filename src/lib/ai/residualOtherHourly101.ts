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
 * Hour-101 leftover catcher.
 * Live 2026-09-21 19:11Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual "other" Pidgin + vague help, plus leftover pending / jamb / login.
 */
export function residualOtherHourly101(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|please|kindly)?\s*(una\s*)?(help|assist|guide|orientate)\s*(me|us)?\s*(small|abeg|now|jare|jo)?\.?$|^i\s*(just\s*)?(dey|am)\s*(lost|confused|stranded)\.?$|^wetin\s*i\s*(fit|suppose)\s*ask\s*(here|una)\??$|^point\s*me\s*(to\s*)?(where|wetin)\s*(to\s*)?start|^direct\s*me\s*(abeg|pls)?\.?$|^wetin\s*you\s*(fit|can)\s*do(\s*for\s*me)?\??$|^show\s*me\s*(short\s*)?(menu|options?)\.?$|^i\s*no\s*sabi\s*(anything|wetin\s*to\s*do)\.?$|^make\s*una\s*(just\s*)?(help|show)\s*me\.?$|^how\s*i\s*take\s*enter\s*(this\s*)?(thing|matter)\??$|^abeg\s*i\s*need\s*(una|your)\s*help\.?$|^can\s*una\s*help\s*me\s*(with\s*)?(this\s*)?(nelfund)?\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help menu 101', 'exploring', entities)
  }

  if (
    /my\s*(own|file|matter)\s*(never|no)\s*(move|change)|e\s*never\s*(leave|comot)\s*pending|status\s*dey\s*same\s*(place|spot)|i\s*submit\s*(am\s*)?(since|last)\s*(week|month)|dem\s*pay\s*(everybody|all\s*of\s*dem)\s*(except|leave)\s*me|una\s*forget\s*my\s*(file|own)|batch\s*(never|no)\s*(reach|include)\s*me|i\s*never\s*see\s*(kobo|naira)|account\s*still\s*(empty|blank)\s*abeg|how\s*far\s*now\s*(una|abeg)|e\s*dey\s*pending\s*(pass|since)\s*(two|2|three|3)\s*(week|month)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 101', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no\s*)?gree\s*(me|am)|e\s*bounce\s*(my\s*)?jamb|portal\s*reject\s*(my\s*)?(jamb|utme)|cannot\s*pass\s*jamb\s*(step|page)|jamb\s*field\s*(no|not)\s*(gree|accept)|utme\s*error\s*(dey|show)|registration\s*number\s*(no|not)\s*(gree|valid)|jamb\s*slip\s*(no|not)\s*(work|gree)|they\s*say\s*(my\s*)?jamb\s*(wrong|invalid)|nelfund\s*reject\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 101', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has)\s*(dey|been)\s*(use[d]?|register)|mail\s*(already|don)\s*(in\s*use|taken)|i\s*use\s*(am|this)\s*last\s*year|last\s*session\s*(i\s*)?(don|have)\s*register|cannot\s*open\s*(new|another)\s*(account|profile)|profile\s*don\s*dey\s*(for|on)\s*(that|dis|this)\s*mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'email-used'], 'Email used leftover 101', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?(drop\s*)?down|dropdown\s*(no|not)\s*(show|bring)\s*(my\s*)?school|i\s*search\s*(my\s*)?(uni|poly|college)\s*(e\s*)?(no|not)\s*(show|come)|institution\s*list\s*(miss|no\s*dey)|my\s*campus\s*no\s*dey\s*(there|here)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 101', 'applying', entities, true)
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*(start\s*)?pay\s*(back|am)|after\s*(school|nysc)\s*(how|wetin)|interest\s*(rate|dey)?\s*(on\s*)?(the\s*)?loan|how\s*(dem|they)\s*(take\s*)?collect\s*(the\s*)?money\s*back|gsi\s*(na|is)\s*wetin|payback\s*(plan|period)|repayment\s*(start|begin)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment leftover 101', 'repaying', entities)
  }

  return null
}
