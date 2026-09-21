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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply/i.test(
    q,
  )
}

/**
 * Hour-95 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other / vague Pidgin help that still lands unknown.
 */
export function residualOtherHourly95(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|please)?\s*(help|assist|guide|orientate)\s*(me|us)?\s*(abeg|pls|please|now)?[.!?]*$|una\s*fit\s*(help|assist|guide)\s*(me)?|i\s*(just\s*)?(need|wan|want)\s*(ya\s*)?help|i\s*no\s*sabi\s*(wetin|where)\s*(to\s*)?(start|begin)|i\s*dey\s*(lost|confused)|make\s*una\s*(guide|help)\s*me|how\s*i\s*(go|fit)\s*(take\s*)?start|una\s*fit\s*show\s*me\s*(the\s*)?way|give\s*me\s*(brief|short)\s*(guide|menu)|kindly\s*assist|can\s*u\s*help|help\s*me\s*abeg|wetin\s*i\s*(suppose|go)\s*do(\s*now)?|i\s*no\s*know\s*where\s*to\s*start|how\s*e\s*take\s*be(\s*abeg)?|orientate\s*me|show\s*me\s*wetin\s*to\s*do|i\s*need\s*small\s*guide|abeg\s*orientate|how\s*person\s*take\s*start|wetin\s*be\s*first\s*tin/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 95', 'exploring', entities)
  }

  if (
    /e\s*still\s*dey\s*(pending|same|process)|my\s*tin\s*(no|never)\s*move|file\s*(no|never)\s*move|una\s*see\s*my\s*(own|file)\s*at\s*all|how\s*far\s*now\s*my\s*(loan|own)|i\s*don\s*wait\s*(pass|too)|weeks\s*(don|has)\s*pass.{0,24}(pending|processing)|processing\s*since|submitted\s*since|status\s*no\s*gree\s*change|e\s*no\s*gree\s*move|dem\s*pay\s*others\s*i\s*never|class\s*don\s*collect\s*i\s*never|how\s*far\s*una\s*with\s*my\s*(file|loan)|my\s*application\s*dey\s*sleep/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 95', 'waiting', entities, true)
  }

  if (
    /jamb\s*(dey\s*)?(invalid|fail|failed)|utme\s*(no|not)\s*(gree|work)|caps\s*(no|not)\s*(gree|match)|jamb\s*wahala|portal\s*reject\s*jamb|wrong\s*jamb\s*number/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 95', 'applying', entities, true)
  }

  if (
    /how\s*(i|to)\s*(go\s*)?pay\s*(back|am)|when\s*(i|to)\s*start\s*(to\s*)?repay|repayment\s*(plan|start)|after\s*nysc\s*(i\s*)?(go\s*)?pay|gsi\s*(go\s*)?(cut|deduct)|loan\s*na\s*scholarship/i.test(
      q,
    )
  ) {
    if (/scholarship|grant|free\s*money/i.test(q)) {
      return hit('loan-or-scholarship', 0.9, ['repayment'], 'Loan vs scholarship 95', 'exploring', entities)
    }
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 95', 'repaying', entities)
  }

  if (
    /school\s*no\s*dey\s*(for\s*)?(the\s*)?(drop\s*)?down|school\s*missing\s*(for\s*)?portal|dem\s*no\s*put\s*my\s*school|institution\s*no\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 95', 'applying', entities, true)
  }

  if (
    /this\s*mail\s*(don|already)\s*(dey|been)\s*use[d]?|email\s*used\s*last\s*year|i\s*use[d]?\s*this\s*mail\s*last\s*year|account\s*already\s*dey\s*for\s*this\s*mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 95', 'applying', entities, true)
  }

  return null
}
