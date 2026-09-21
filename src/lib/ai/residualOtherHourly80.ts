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
 * Hour-80 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other + Pidgin vague help + pending/jamb/login/school.
 */
export function residualOtherHourly80(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop|pay)|processing|under\s*review|approved|empty|zero|alert/.test(low)) {
    return null
  }

  if (
    /^(pls|please|abeg|kindly)?\s*(help|assist|guide)\s*(me)?\s*(out|now|abeg|pls|please)?\.?$|una\s*fit\s*help\s*me\s*(small|now|abeg)?|i\s*need\s*(una|your)\s*help|wetin\s*i\s*suppose\s*do\s*(now|abeg)?|i\s*no\s*sabi\s*wetin\s*to\s*do|make\s*una\s*help\s*me|orientate\s*me\s*abeg|brief\s*me\s*(on\s*)?(nelfund|dis\s*loan)?|i\s*just\s*dey\s*confused|where\s*i\s*go\s*start\s*(from)?|show\s*me\s*(the\s*)?way\s*abeg/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 80', 'exploring', entities)
  }

  if (
    /my\s*own\s*(still\s*)?(dey\s*)?(pending|review)|e\s*never\s*(enter|reflect|drop|show)|dem\s*pay\s*people\s*i\s*never|i\s*never\s*see\s*(my\s*)?(own|alert|money)|batch\s*(no|not)\s*(include|cover)\s*me|file\s*(still\s*)?(dey\s*)?(pending|sleep)|status\s*(remain|still)\s*(pending|same)|processing\s*(for\s*)?(weeks|months)|under\s*review\s*(for\s*)?(weeks|months)|dashboard\s*(still\s*)?(show|showing)\s*(0|zero)|approved\s*no\s*(pay|alert)|when\s*go\s*my\s*own\s*enter/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 80', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg|no|number)?\s*(invalid|reject|rejected)|utme\s*(no|not)\s*(gree|match)|caps\s*no\s*show\s*admission|direct\s*entry\s*(no|not)\s*(gree|work)|jamb\s*profile\s*(no|not)\s*(gree|load)|verification\s*(of\s*)?jamb\s*(fail|failed)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 80', 'applying', entities, true)
  }

  if (
    /email\s*(i\s*)?(use|used)\s*(last\s*)?year|last\s*year\s*(i\s*)?register|mail\s*already\s*(dey|used|exist)|old\s*account\s*(no|not)\s*(open|gree)|cannot\s*create\s*(new\s*)?account|forgot\s*portal\s*password|otp\s*no\s*dey\s*come/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['login'], 'Login leftover 80', 'applying', entities, true)
  }

  if (
    /my\s*school\s*(no|not)\s*(dey|appear|show)\s*(for\s*)?(the\s*)?list|institution\s*(missing|absent)|school\s*not\s*on\s*(the\s*)?dropdown|polytechnic\s*(no|not)\s*dey\s*(the\s*)?list|college\s*of\s*edu(cation)?\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 80', 'applying', entities, true)
  }

  if (
    /how\s*(dem|they)\s*(take\s*)?repay|when\s*(i|we)\s*(go|will)\s*start\s*(to\s*)?pay\s*back|after\s*nysc\s*(i\s*)?(go|will)\s*pay|interest\s*(rate|on\s*the\s*loan)|salary\s*deduct/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repay leftover 80', 'repaying', entities)
  }

  return null
}
