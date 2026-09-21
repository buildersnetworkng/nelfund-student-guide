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
 * Hour-102 leftover catcher.
 * Live 2026-09-21 20:09Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other Pidgin + vague help fragments.
 */
export function residualOtherHourly102(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(una\s*)?(fit\s*)?(help|assist|guide)\s*(me|us)?\s*(small|abeg|now|jare|jo|pls|please)?\.?$|^i\s*just\s*wan(t)?\s*(una\s*)?help\.?$|^wetin\s*una\s*(fit|dey)\s*do\s*(here|for\s*me)?\??$|^i\s*no\s*know\s*wetin\s*to\s*type\.?$|^make\s*i\s*start\s*(from\s*)?where\??$|^where\s*i\s*go\s*begin\??$|^brief\s*me\s*(abeg|pls|please|small)?\.?$|^orientate\s*me\s*(abeg|pls)?\.?$|^i\s*dey\s*blank\.?$|^nothing\s*dey\s*my\s*head\.?$|^una\s*dey\s*(there|here)\??$|^help\s*me\s*navigate\.?$|^i\s*need\s*direction\.?$|^how\s*this\s*(chat|bot|page)\s*work\??$|^wetin\s*this\s*(page|chat|bot)\s*(dey\s*)?do\??$|^i\s*come\s*here\s*for\s*help\.?$|^pls\s*orientate/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help menu 102', 'exploring', entities)
  }

  if (
    /my\s*(loan|file|own)\s*(still|stil)\s*dey\s*(there|pending)|e\s*no\s*comot\s*(from\s*)?(pending|review)|i\s*don\s*wait\s*(pass|since)\s*(two|2|three|3|four|4)\s*(week|month)|dem\s*don\s*settle\s*(my\s*)?(mates|class)|class\s*don\s*see\s*(alert|money)|my\s*dashboard\s*still\s*(0|zero|empty)|status\s*word\s*(no|not|never)\s*(change|move)|processing\s*pass\s*(one|1)\s*month|una\s*don\s*forget\s*this\s*file|how\s*far\s*my\s*disbursement/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 102', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not)\s*(correct|correctly)|utme\s*(no|not)\s*(gree|accept)|caps\s*(no|not)\s*(gree|match)|old\s*jamb\s*(no|not)\s*work|direct\s*entry\s*jamb|they\s*say\s*invalid\s*reg|reg\s*no\s*(no|not)\s*(valid|gree)|jamb\s*wahala\s*(again|still)|portal\s*no\s*gree\s*(my\s*)?utme/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 102', 'applying', entities, true)
  }

  if (
    /that\s*mail\s*(don|has)\s*(already\s*)?(dey|been)\s*(use[d]?|register)|i\s*register\s*(am\s*)?last\s*(year|session)|email\s*from\s*202[0-9]|same\s*gmail\s*(from|as)\s*last\s*year|account\s*already\s*dey\s*for\s*(the\s*)?(mail|email)|cannot\s*create\s*(again|another)\s*with\s*(this|same)\s*mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'email-used'], 'Email used leftover 102', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*(the\s*)?list|institution\s*(no|not)\s*(showing|show)|search\s*box\s*(no|not)\s*bring\s*(my\s*)?(school|uni)|i\s*type\s*(oou|unilag|lasu|yabatech).{0,20}(no|not)\s*(show|come)|school\s*name\s*(missing|no\s*dey)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 102', 'applying', entities, true)
  }

  if (
    /how\s*(dem|they)\s*(go|will)\s*take\s*(the\s*)?loan\s*back|when\s*repayment\s*(go|will)\s*start|salary\s*deduction|after\s*i\s*graduate|i\s*go\s*pay\s*how|interest\s*free\s*true|na\s*true\s*say\s*(i|we)\s*go\s*pay\s*back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment leftover 102', 'repaying', entities)
  }

  return null
}
