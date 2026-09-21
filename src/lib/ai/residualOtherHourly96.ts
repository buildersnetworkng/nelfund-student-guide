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
 * Hour-96 leftover catcher.
 * Live 2026-09-21 17:16Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other / vague Pidgin help that still lands unknown.
 */
export function residualOtherHourly96(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(hi|hello|hey|yo|abeg|pls|please|good\s*(day|morning|evening|afternoon))?[\,\s]*(help|assist|guide|orientate|direction)\s*(me|us|am)?\s*(abeg|pls|please|now|sharp)?[.!?]*$|una\s*fit\s*(help|assist|guide|orientate)\s*(me|us|am)?|i\s*(just\s*)?(need|wan|want|dey\s*need)\s*(ya|your|una)?\s*(help|guide|assistance)|i\s*no\s*sabi\s*(wetin|where|how)\s*(to\s*)?(start|begin|take\s*am)|i\s*dey\s*(lost|confused|blank)|make\s*una\s*(guide|help|show)\s*me|how\s*i\s*(go|fit)\s*(take\s*)?(start|begin)|una\s*fit\s*show\s*me\s*(the\s*)?way|give\s*me\s*(brief|short|small)\s*(guide|menu|direction)|kindly\s*(assist|help|guide)|can\s*(u|you)\s*(pls\s*)?help|help\s*me\s*(abeg|pls|please)|wetin\s*i\s*(suppose|go|fit)\s*do(\s*now)?|i\s*no\s*know\s*where\s*to\s*start|how\s*e\s*take\s*be(\s*abeg)?|orientate\s*me|show\s*me\s*wetin\s*to\s*do|i\s*need\s*(small|quick)\s*guide|abeg\s*orientate|how\s*person\s*take\s*start|wetin\s*be\s*first\s*(tin|thing)|i\s*wan\s*apply\s*but\s*i\s*no\s*sabi|abeg\s*direct\s*me|make\s*una\s*yarn\s*me\s*how|i\s*just\s*dey\s*come|first\s*timer\s*(here|abeg)|how\s*una\s*take\s*run\s*am|wetin\s*i\s*go\s*click|una\s*fit\s*break\s*am\s*down|break\s*am\s*down\s*abeg|i\s*need\s*direction\s*abeg|help\s*a\s*newbie|guide\s*a\s*beginner|i\s*no\s*understand\s*the\s*portal|wetin\s*una\s*fit\s*do\s*for\s*me|can\s*somebody\s*help\s*me|pls\s*i\s*need\s*help\s*with\s*nelfund|help\s*with\s*nelfund\s*abeg|nelfund\s*help\s*me|abeg\s*i\s*need\s*una/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 96', 'exploring', entities)
  }

  if (
    /e\s*still\s*dey\s*(pending|same|process|processing)|my\s*tin\s*(no|never)\s*move|file\s*(no|never)\s*move|una\s*see\s*my\s*(own|file)\s*at\s*all|how\s*far\s*now\s*my\s*(loan|own|file)|i\s*don\s*wait\s*(pass|too)|weeks\s*(don|has)\s*pass.{0,24}(pending|processing)|processing\s*since|submitted\s*since|status\s*no\s*gree\s*change|e\s*no\s*gree\s*move|dem\s*pay\s*others\s*i\s*never|class\s*don\s*collect\s*i\s*never|how\s*far\s*una\s*with\s*my\s*(file|loan)|my\s*application\s*dey\s*sleep|e\s*never\s*leave\s*pending|still\s*on\s*pending\s*abeg|pending\s*since\s*(january|february|march|april|may|june|july|august|september|last)|no\s*update\s*for\s*my\s*(loan|file)|my\s*dashboard\s*still\s*(zero|0)|nothing\s*don\s*enter\s*since|mates\s*don\s*collect\s*i\s*never|how\s*far\s*my\s*own\s*abeg|una\s*never\s*pay\s*me|under\s*review\s*since/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 96', 'waiting', entities, true)
  }

  if (
    /jamb\s*(dey\s*)?(invalid|fail|failed|reject|rejected)|utme\s*(no|not)\s*(gree|work|match)|caps\s*(no|not)\s*(gree|match)|jamb\s*wahala|portal\s*reject\s*jamb|wrong\s*jamb\s*(number|no)|jamb\s*(no|not)\s*(dey|work|gree)|invalid\s*jamb|jamb\s*verification\s*(fail|error)|my\s*jamb\s*(no|not)\s*(correct|correctly)|jamb\s*reg\s*(no|number)\s*(invalid|reject)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 96', 'applying', entities, true)
  }

  if (
    /how\s*(i|to)\s*(go\s*)?pay\s*(back|am)|when\s*(i|to)\s*start\s*(to\s*)?repay|repayment\s*(plan|start|begin)|after\s*nysc\s*(i\s*)?(go\s*)?pay|gsi\s*(go\s*)?(cut|deduct)|loan\s*na\s*scholarship|how\s*dem\s*take\s*collect\s*(the\s*)?money\s*back|wetin\s*be\s*repayment|when\s*una\s*go\s*start\s*to\s*deduct|10\s*%\s*(salary|pay)|pay\s*back\s*after\s*(school|nysc)/i.test(
      q,
    )
  ) {
    if (/scholarship|grant|free\s*money/i.test(q)) {
      return hit('loan-or-scholarship', 0.9, ['repayment'], 'Loan vs scholarship 96', 'exploring', entities)
    }
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 96', 'repaying', entities)
  }

  if (
    /school\s*no\s*dey\s*(for\s*)?(the\s*)?(drop\s*)?down|school\s*missing\s*(for\s*)?portal|dem\s*no\s*put\s*my\s*school|institution\s*no\s*show|my\s*school\s*(no|not)\s*(dey|on)\s*(the\s*)?list|school\s*not\s*(on|in)\s*(the\s*)?list|cannot\s*find\s*(my\s*)?(school|institution)|dropdown\s*(no|not)\s*(show|carry)\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 96', 'applying', entities, true)
  }

  if (
    /this\s*mail\s*(don|already)\s*(dey|been)\s*use[d]?|email\s*used\s*last\s*year|i\s*use[d]?\s*this\s*mail\s*last\s*year|account\s*already\s*dey\s*for\s*this\s*mail|email\s*already\s*(in\s*use|registered)|this\s*email\s*(has\s*)?already\s*been\s*used|i\s*register(ed)?\s*last\s*year\s*with\s*(this|dis)\s*(mail|email)|mail\s*don\s*dey\s*use/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 96', 'applying', entities, true)
  }

  return null
}
