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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hour-94 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending payout / mates-got-paid / dashboard-zero sentence shapes.
 */
export function residualOtherHourly94(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /dem\s*never\s*pay\s*(me|us)|una\s*never\s*(pay|credit)\s*(me|us)|my\s*mates?\s*(don|have|has)\s*(collect|collect am|receive|get\s*paid|see\s*money)|mates?\s*don\s*(collect|receive)|nothing\s*(don|has)\s*drop|no\s*(credit\s*)?alert(\s*yet)?|dashboard\s*(still\s*)?(zero|0|blank)|batch\s*(never|no)\s*(reach|come|drop)|when\s*(will|go)\s*(they|dem|una)\s*pay\s*me|when\s*(will|go)\s*i\s*(get|collect|see)\s*(my\s*)?(money|upkeep|alert)|approved\s*but\s*(money|alert|account)|account\s*(still\s*)?(empty|zero)|i\s*apply\s*(last\s*year|since).{0,20}(still|dey)\s*(pending|wait)|check\s*(my\s*)?(application|status|loan)\s*(abeg|please)?|wetin\s*dey\s*happen\s*to\s*my\s*(own|loan|file|application)|una\s*don\s*pay\s*my\s*mates|people\s*don\s*collect\s*(i|i\s*)never|i\s*never\s*see\s*(my\s*)?(money|alert|upkeep)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 94', 'waiting', entities, true)
  }

  if (
    /^(dem\s*never\s*pay\s*me|una\s*never\s*pay\s*me|nothing\s*don\s*drop|no\s*alert|dashboard\s*zero|mates\s*don\s*collect|check\s*my\s*application)[.!?]*$/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Short pending leftover 94', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number\s*)?(no|not|never)\s*(valid|correct|dey\s*work)|verification\s*(failed|fail)\s*(on\s*)?jamb|invalid\s*(utme|jamb\s*reg)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 94', 'applying', entities, true)
  }

  if (
    /i\s*register(ed)?\s*last\s*year|email\s*(already|don)\s*(used|use|exist)|cannot\s*create\s*account\s*with\s*this\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 94', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing|my\s*school\s*no\s*dey\s*list|institution\s*(no|not)\s*(dey|on)\s*(the\s*)?list/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 94', 'applying', entities, true)
  }

  return null
}
