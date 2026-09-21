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
 * Hour-84 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: other -> official-sources (Pidgin + vague help). Never invent policy.
 */
export function residualOtherHourly84(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|pay|show)|processing/.test(low)) return null

  if (
    /^(abeg|pls|please|biko|oga)?\s*(una\s*)?(fit\s*)?(help|assist|guide|yarn)\s*(me|us)?\s*(small|now|abeg|pls)?\.?$|^i\s*(just\s*)?wan(t)?\s*(make\s*)?(una\s*)?help\s*(me)?\.?$|^wetin\s*i\s*go\s*type\??$|^wetin\s*person\s*suppose\s*ask\??$|^i\s*no\s*know\s*wetin\s*to\s*write\.?$|^i\s*just\s*land\s*(here|for\s*here)\.?$|^na\s*so\s*i\s*enter\.?$|^show\s*me\s*(the\s*)?(things|stuff)\s*una\s*fit\s*do\.?$|^list\s*(am|options)\s*(abeg|pls)?\.?$|^i\s*need\s*direction\.?$|^point\s*me\s*(to\s*)?(where\s*)?(to\s*)?start\.?$|^make\s*i\s*ask\s*una\s*something\.?$|^any\s*info\s*(on\s*)?(nelfund|dis\s*loan)?\??$|^tell\s*me\s*wetin\s*to\s*do\s*first\.?$|^i\s*dey\s*confused\s*(small)?\.?$|^confused\s*abeg\.?$|^help\s*me\s*navigate\.?$|^how\s*una\s*take\s*dey\s*help\s*people\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.91, ['other', 'greeting-vague'], 'Vague Pidgin help leftover 84', 'exploring', entities)
  }

  if (
    /abeg\s*(una\s*)?(explain|yarn|break)\s*(am|this|dis)\s*(small|down)|break\s*(nelfund|am)\s*down\s*(for\s*me)?|simplify\s*(nelfund|this\s*loan)|i\s*no\s*understand\s*(this|dis)\s*(app|site|chat)|wetin\s*this\s*bot\s*(fit|can)\s*do|wetin\s*you\s*(fit|can)\s*answer|na\s*which\s*kind\s*question\s*una\s*take|i\s*wan\s*use\s*una\s*but\s*i\s*no\s*sabi|first\s*timer\s*(here|for\s*nelfund)|i\s*just\s*hear\s*of\s*nelfund\s*(now|today)|somebody\s*send\s*me\s*(this|dis)\s*link/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague orient leftover 84', 'exploring', entities)
  }

  if (
    /my\s*(own|loan|file)\s*(still\s*)?(dey|is)\s*(there|there\s*only)|e\s*just\s*dey\s*there|nothing\s*don\s*change\s*(at\s*all)?|status\s*no\s*move\s*(at\s*all)?|una\s*forget\s*my\s*(file|own)|dem\s*forget\s*my\s*(application|file)|i\s*still\s*dey\s*wait\s*(una|am)|waiting\s*since\s*(january|feb|march|april|may|june|july|august|sept)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Still waiting leftover 84', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg|number|no)\s*(wey\s*)?(dem|una)\s*say\s*(wrong|invalid)|portal\s*reject\s*(my\s*)?jamb|utme\s*(no|not)\s*valid\s*(abeg|pls)?|caps\s*wahala\s*(with\s*)?(jamb|nelfund)|direct\s*entry\s*jamb\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 84', 'applying', entities, true)
  }

  if (
    /i\s*use\s*(the\s*)?(same\s*)?(mail|email)\s*last\s*session|last\s*session\s*(i\s*)?(register|use)\s*(this|dis)\s*(mail|email)|email\s*na\s*the\s*one\s*i\s*use\s*before|cannot\s*sign\s*up\s*(the\s*)?old\s*(mail|email)|old\s*email\s*(don|has)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email leftover 84', 'applying', entities, true)
  }

  if (
    /my\s*(poly|coe|college|uni|university)\s*(no|not)\s*(dey|show)|school\s*option\s*(no|not)\s*(dey|show)|dropdown\s*(empty|blank)|list\s*of\s*schools?\s*(no|not)\s*(complete|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 84', 'applying', entities, true)
  }

  if (
    /when\s*(dem|they|una)\s*(go|will)\s*collect\s*(the\s*)?money\s*back|how\s*repayment\s*dey\s*work|salary\s*deduction\s*(start|begin)|gsi\s*(how|when)|after\s*service\s*(i\s*)?(go|will)\s*pay/i.test(
      low,
    ) && !/pending|how\s*far|never\s*enter/.test(low)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 84', 'repaying', entities)
  }

  return null
}
