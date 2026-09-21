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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-91 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Extra pending / how-far / no-alert shapes. Skip live-status and purpose.
 */
export function residualOtherHourly91(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*file\s*(no|not|never)\s*(move|change|update)|i\s*dey\s*wait\s*since|processing\s*since|submitted\s*(last\s*)?(year|session|week).{0,24}(wait|pending|nothing)|no\s*credit\s*alert|dashboard\s*(still\s*)?(zero|0|empty)|wetin\s*happen\s*to\s*my\s*own|una\s*don\s*pay\s*(others|everybody|class).{0,20}(i|me)\s*(never|no)|my\s*own\s*still\s*(dey|is)\s*(there|same)|check\s*(my\s*)?(application\s*)?status\s*(abeg|pls|please)|i\s*never\s*see\s*(my\s*)?(upkeep|alert|credit)|loan\s*still\s*(dey|is)\s*(processing|pending)|nothing\s*show\s*for\s*(my\s*)?(bank|account)|status\s*word\s*(no|not|never)\s*(change|move)|they\s*have\s*not\s*paid\s*me|has\s*not\s*been\s*paid|still\s*waiting\s*for\s*(the\s*)?(money|upkeep|loan)|my\s*application\s*has\s*not\s*moved/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 91', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(is\s*)?(saying|say|shows?)\s*(invalid|wrong)|invalid\s*jamb(\s*reg)?|jamb\s*verification\s*(fail|failed|error)|my\s*jamb\s*(no|not)\s*(dey|work)|utme\s*no\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 91', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(is\s*)?(already\s*)?(in\s*use|taken)|registered\s*with\s*(this\s*)?(same\s*)?email|cannot\s*create\s*(an?\s*)?account\s*with\s*(this\s*)?(mail|email)|mail\s*don\s*already\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 91', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?(dropdown|select|list)|institution\s*missing|i\s*cannot\s*find\s*(my\s*)?school|my\s*uni\s*(no|not)\s*(dey|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 91', 'applying', entities, true)
  }

  return null
}
