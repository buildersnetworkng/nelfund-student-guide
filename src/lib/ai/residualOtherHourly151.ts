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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 151 2026-09-24: leftover other + pending-status shapes.
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly151(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /loan\s*(no|not|never)\s*(drop|enter|land)|nothing\s*don\s*drop|i\s*don\s*apply\s*(but|since)\s*(nothing|no\s*money)|they\s*approved\s*my\s*mates|classmates?\s*(got|have)\s*(paid|payment)|i\s*apply\s*last\s*year\s*(still|nothing)|file\s*(no|not)\s*dey\s*move|una\s*forget\s*my\s*own|my\s*name\s*no\s*dey\s*(the\s*)?list|tinubu\s*list|pay\s*list\s*(abeg|pls)?|i\s*wan\s*check\s*if\s*dem\s*don\s*pay|has\s*(the\s*)?(money|loan)\s*(been\s*)?(paid|sent)|has\s*nelfund\s*paid\s*(me|us)|did\s*they\s*(already\s*)?pay|any\s*disbursement\s*(yet|abeg)|stipend\s*two\s*months|allowance\s*(no|never)\s*(enter|drop)|glitch\s*(dey|on)\s*(the\s*)?portal/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 151', 'waiting', entities, true)
  }

  if (
    /explain\s*(this|dis)\s*loan|why\s*(una|they|dem)\s*(set|set\s*up|form)\s*(am|this)|wetin\s*be\s*(this|dis)\s*(scheme|loan)|na\s*wetin\s*nelfund\s*be|define\s*nelfund|nelfund\s*meaning|what\s*does\s*nelfund\s*stand\s*for|who\s*own\s*nelfund|government\s*loan\s*(be|na)\s*wetin|why\s*this\s*scheme\s*dey/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is'], 'Purpose leftover 151', 'exploring', entities)
  }

  if (
    /which\s*mail\s*i\s*use\s*before|i\s*forget\s*(the\s*)?(mail|email)|otp\s*(no|not)\s*reach|reset\s*no\s*gree|sign\s*up\s*say(s)?\s*exist|cannot\s*create\s*another|previous\s*session\s*account|old\s*nelfund\s*mail|i\s*get\s*account\s*before|email\s*taken|mail\s*don\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email leftover 151', 'applying', entities, true)
  }

  if (
    /jamb\s*(reject|rejected|failed|fail)|utme\s*(reject|fail)|caps\s*no\s*match|admission\s*letter\s*(and|vs)\s*jamb|i\s*enter\s*wrong\s*jamb|jamb\s*no\s*gree\s*verify|verification\s*failed\s*on\s*jamb|jamb\s*number\s*not\s*valid/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 151', 'applying', entities, true)
  }

  if (
    /poly\s*(no|not)\s*(show|dey)|college\s*of\s*edu(cation)?\s*(no|not)|my\s*campus\s*no\s*dey|institution\s*search\s*(empty|blank)|dropdown\s*no\s*carry\s*(my\s*)?school|i\s*type\s*(unilag|lasu|oou|yabatech|unilorin).{0,20}(nothing|no\s*show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School leftover 151', 'applying', entities, true)
  }

  if (
    /how\s*(person|student)\s*go\s*take\s*apply|walk\s*me\s*through\s*(the\s*)?(form|apply)|i\s*need\s*apply\s*steps|register\s*how\s*now|fill\s*(the\s*)?loan\s*form|request\s*for\s*student\s*loan\s*(how|mean)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['other', 'apply'], 'Apply leftover 151', 'applying', entities)
  }

  if (
    /can\s*(nd|hnd|nce|part\s*time|masters?|phd|pg|postgraduate)\s*(students?)?\s*(apply|qualify)|freshers?\s*qualify|final\s*year\s*qualify|direct\s*entry\s*qualify|private\s*(uni|university)\s*(fit|can)\s*apply/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.91, ['other', 'eligibility'], 'Eligibility leftover 151', 'exploring', entities)
  }

  if (
    /how\s*(dem|they)\s*go\s*collect\s*(the\s*)?money\s*back|repay\s*after\s*nysc|gsi\s*cut\s*salary|i\s*go\s*pay\s*interest|tenor\s*how\s*many\s*years|when\s*i\s*start\s*work\s*dem\s*go\s*cut/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.91, ['repayment'], 'Repay leftover 151', 'repaying', entities)
  }

  if (
    /i\s*already\s*pay\s*(school\s*)?fees?\s*(myself|from\s*pocket)|self\s*pay|refund\s*(my\s*)?(fees?|school)/i.test(q)
  ) {
    return hit('refund', 0.9, ['other'], 'Refund leftover 151', 'waiting', entities, true)
  }

  if (
    /which\s*bank|wallet\s*(no|not)\s*gree|opay|palmpay|moniepoint|account\s*name\s*(no|not)\s*match|change\s*(my\s*)?bank/i.test(
      q,
    )
  ) {
    return hit('bank-information', 0.9, ['other'], 'Bank leftover 151', 'applying', entities, true)
  }

  if (
    /i\s*just\s*wan\s*understand\s*(this|dis)\s*page|wetin\s*this\s*chat\s*fit\s*do|show\s*me\s*the\s*menu\s*again|i\s*land\s*wrong|i\s*no\s*know\s*where\s*i\s*dey|brief\s*orientation|compass\s*abeg|topics\s*una\s*cover/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague menu leftover 151', 'exploring', entities)
  }

  if (/^(hmm+|ehn+|abi|shey|k+|yo+|help\s*oo+)\s*[.!?]*$/i.test(q)) {
    return hit('official-sources', 0.76, ['other', 'greeting-vague'], 'Fragment leftover 151', 'exploring', entities)
  }

  return null
}
