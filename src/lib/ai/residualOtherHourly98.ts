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
 * Hour-98 leftover catcher.
 * Live 2026-09-21 18:13Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: other / Pidgin vague help + leftover pending fragments.
 */
export function residualOtherHourly98(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|please|una)\s*(help|assist|guide)\s*(me)?|help\s*me\s*(abeg|pls|please|na)|i\s*(just\s*)?(need|wan|want)\s*(una\s*)?(help|assist)|una\s*fit\s*(help|assist|guide)\s*(me)?|make\s*una\s*(help|guide|show)\s*me|i\s*no\s*sabi\s*(wetin|how|where)|i\s*dey\s*(lost|confused|blank)|kindly\s*(help|assist)|short\s*(menu|guide)|wetin\s*i\s*(suppose|go)\s*do\s*(now|abeg)?|how\s*i\s*(go|fit)\s*(take\s*)?start|orientate\s*me|show\s*me\s*(the\s*)?way|i\s*need\s*assistance|can\s*you\s*help\s*(me)?\s*(with\s*)?(this|nelfund)?|help\s*with\s*nelfund|nelfund\s*help\s*(me)?|abeg\s*una|pls\s*una\s*help/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 98', 'exploring', entities)
  }

  if (
    /how\s*far\s*(now|abeg|pls|my\s*own|na)?|e\s*never\s*(move|change|enter|drop)|file\s*(still\s*)?(dey|is)\s*(there|same|pending)|my\s*loan\s*(no|not|never)\s*(pay|enter)|dem\s*pay\s*(everybody|others)\s*(except|but)\s*me|i\s*never\s*see\s*(anything|alert|kobo)|nothing\s*show\s*(for|on)\s*(my\s*)?(portal|dashboard)|status\s*word\s*(no|not)\s*change|processing\s*for\s*(weeks|months)|pending\s*for\s*(weeks|months)|una\s*forget\s*my\s*(own|file)|when\s*go\s*my\s*own\s*enter|my\s*dashboard\s*still\s*(0|zero)|zero\s*naira\s*(enter|show)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 98', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg|registration|no|number)\s*(wahala|issue|error|fail)|utme\s*(reg|no)\s*(no|not)\s*gree|caps\s*wahala|jamb\s*say\s*(invalid|fail)|portal\s*reject\s*(my\s*)?jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 98', 'applying', entities, true)
  }

  if (
    /this\s*(mail|email)\s*don\s*(dey|use)|last\s*year\s*(i\s*)?register|old\s*email\s*(no|not)\s*gree|cannot\s*sign\s*up\s*(again|with\s*same)|account\s*already\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 98', 'applying', entities, true)
  }

  if (
    /school\s*name\s*(no|not)\s*(dey|show)|list\s*no\s*get\s*(my\s*)?school|institution\s*no\s*dey\s*portal|cannot\s*select\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 98', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*back|when\s*(i\s*)?(go|will)\s*repay|repayment\s*(start|begin)|after\s*(i\s*)?(finish|graduate)\s*(how|when)|gsi\s*(go|will)\s*cut/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repay leftover 98', 'repaying', entities)
  }

  return null
}
