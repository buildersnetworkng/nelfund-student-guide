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
 * Hour-103 leftover catcher.
 * Live 2026-09-21 21:10Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual "other" Pidgin + vague help, then pending / jamb / login leftovers.
 */
export function residualOtherHourly103(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(pls|please|abeg|jo)\s*(help|assist|guide)\s*(me)?\s*(out|small|now)?\.?$/i.test(q) ||
    /una\s*fit\s*(help|assist|guide)\s*me\s*(small|abeg|now)?/i.test(q) ||
    /i\s*(just\s*)?(wan|want|need)\s*(una|your)?\s*(help|assist)/i.test(q) ||
    /wetin\s*(una|you)\s*(fit|can)\s*(do|help)\s*(for\s*)?me/i.test(q) ||
    /i\s*no\s*sabi\s*(wetin|anything|how)\s*(to\s*)?(do|start)?/i.test(q) ||
    /make\s*una\s*(explain|orientate|show)\s*me\s*(small|this\s*thing)?/i.test(q) ||
    /how\s*(this|dis)\s*(nelfund|loan)\s*(matter|thing)\s*(dey|take)\s*(work|be)/i.test(q) ||
    /i\s*dey\s*(lost|confused|stranded)\s*(here|abeg)?/i.test(q) ||
    /kindly\s*(help|assist)\s*me\s*(with\s*)?(this|dis)?\s*(nelfund|loan)?/i.test(q) ||
    /show\s*me\s*(wetin|what)\s*(i|to)\s*(fit|can)\s*ask/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 103', 'exploring', entities)
  }

  if (
    /e\s*never\s*(enter|drop|show|move)/i.test(q) ||
    /my\s*(loan|app|application|file)\s*(never|no)\s*(move|change|enter)/i.test(q) ||
    /since\s*(i|we)\s*(submit|apply|don\s*apply).{0,24}(nothing|no\s*change|e\s*still)/i.test(q) ||
    /wetin\s*(dey|sup)\s*(with|for)\s*my\s*(loan|app|own|file)/i.test(q) ||
    /una\s*(never|no)\s*(pay|credit|send)\s*(me|us)/i.test(q) ||
    /i\s*check(ed)?\s*(portal|dashboard)\s*(e\s*)?(still|dey)\s*(pending|same)/i.test(q) ||
    /status\s*(word\s*)?(no|not|never)\s*(change|move)/i.test(q) ||
    /people\s*(don|have)\s*(collect|receive)\s*(but|except)\s*me/i.test(q) ||
    /no\s*(credit\s*)?alert\s*(since|after)\s*(i|we)\s*(apply|submit)/i.test(q) ||
    /when\s*(go|will)\s*(dem|they|una)\s*(pay|credit)\s*(me|us)/i.test(q)
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 103', 'waiting', entities, true)
  }

  if (
    /jamb\s*(wahala|problem|issue|error)/i.test(q) ||
    /(portal|form)\s*(say|said|dey\s*talk)\s*(invalid|wrong)\s*jamb/i.test(q) ||
    /my\s*jamb\s*(no|not|never)\s*(gree|work|dey)/i.test(q) ||
    /utme\s*(number|no)\s*(invalid|fail|wrong)/i.test(q) ||
    /link\s*(my\s*)?(nin|nIN)\s*(to|with)\s*jamb/i.test(q) ||
    /jamb\s*(caps|reg)\s*(no|not)\s*(match|gree)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 103', 'applying', entities, true)
  }

  if (
    /mail\s*(don|already)\s*(dey|exist|use)/i.test(q) ||
    /last\s*year\s*(i\s*)?(register|registered|sign\s*up)/i.test(q) ||
    /email\s*(na|is)\s*(already|don)\s*(used|taken)/i.test(q) ||
    /account\s*(don|already)\s*dey\s*(for|with)\s*(that|dis|this)\s*(mail|email)/i.test(q) ||
    /i\s*use(d)?\s*(this|dis)\s*(same\s*)?email\s*(last|before)/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login', 'email-used'], 'Email used leftover 103', 'applying', entities, true)
  }

  if (
    /school\s*(name\s*)?(no|not)\s*(dey|show)\s*(for\s*)?(the\s*)?(list|portal|dropdown)/i.test(q) ||
    /i\s*no\s*see\s*(my\s*)?(school|institution)\s*(for|on)\s*(the\s*)?list/i.test(q) ||
    /institution\s*(no|not)\s*(listed|showing)/i.test(q)
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 103', 'applying', entities, true)
  }

  if (
    /how\s*(i|we)\s*(go|to)\s*pay\s*(back|am)|when\s*(i|we)\s*(go|will)\s*repay/i.test(q) ||
    /repayment\s*(start|begin|begining)|after\s*(i\s*)?(finish|nysc)\s*(how|when)\s*(i\s*)?pay/i.test(q) ||
    /10\s*%|ten\s*percent\s*(salary|pay)/i.test(q)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 103', 'repaying', entities)
  }

  return null
}
