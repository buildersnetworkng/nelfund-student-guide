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
 * Hourly 147 2026-09-23: residual other / vague Pidgin help menu.
 * Formal, casual, fragments, typos. Never invent policy or dates.
 */
export function residualOtherHourly147(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /i\s*dey\s*find\s*road|una\s*get\s*short\s*list|e\s*plenty\s*(for|on)\s*my\s*head|i\s*just\s*open\s*(this|dis)\s*site|na\s*student\s*loan\s*i\s*wan\s*ask|make\s*una\s*give\s*me\s*compass|i\s*no\s*know\s*(the\s*)?right\s*question|help\s*me\s*pick\s*(a\s*)?topic|wetin\s*students\s*dey\s*ask|i\s*need\s*simple\s*orientation|biko\s*help|oga\s*abeg|sir\s*\/?\s*ma\s*help|good\s*day[,\s]+i\s*require\s*guidance|kindly\s*point\s*me|i\s*am\s*new\s*to\s*(this\s*)?(scheme|loan)|what\s*topics\s*(can|do)\s*you\s*cover|list\s*what\s*you\s*can\s*help|menu\s*please|options\s*\??$|start\s*here\s*\??$|where\s*do\s*i\s*begin\s*with\s*nelfund|confused\s*student\s*here|how\s*to\s*phrase|just\s*onboard\s*me|give\s*me\s*(the\s*)?topics|what\s*can\s*this\s*bot\s*do|wetin\s*this\s*bot\s*fit\s*answer|i\s*no\s*even\s*know\s*how\s*to\s*ask|start\s*me\s*small|orient\s*me\s*quick|road\s*map\s*abeg|give\s*me\s*headings|i\s*just\s*land\s*for\s*(here|site)|first\s*timer\s*(here|abeg)|i\s*be\s*new\s*student\s*here/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague other menu 147', 'exploring', entities)
  }

  if (
    /email\s*(i\s*)?(use|used)\s*(last\s*)?(year|session)|last\s*year\s*(i\s*)?(use|used)\s*(this\s*)?(mail|email)|same\s*mail\s*(from|as)\s*last\s*year|old\s*nelfund\s*(mail|email|account)|i\s*register\s*2024|i\s*register\s*last\s*cycle/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['login'], 'Email used last year 147', 'applying', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|not|never)\s*(gree|enter|accept)|utme\s*reg\s*(wrong|fail)|caps\s*say\s*(invalid|error)|jamb\s*keep\s*(reject|bounce)|verify\s*jamb\s*abeg/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB residual 147', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*dropdown|dropdown\s*no\s*get\s*(my\s*)?school|institution\s*search\s*(empty|blank)|i\s*type\s*my\s*school\s*(e\s*)?no\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list 147', 'applying', entities, true)
  }

  if (
    /when\s*i\s*go\s*start\s*pay\s*back|repay\s*after\s*service|gsi\s*mandate|salary\s*go\s*cut|how\s*dem\s*take\s*collect\s*the\s*loan/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment 147', 'repaying', entities)
  }

  if (
    /my\s*status\s*no\s*change|still\s*on\s*pending\s*abeg|file\s*still\s*pending|loan\s*still\s*pending\s*for\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.91, ['pending-status'], 'Pending 147', 'waiting', entities, true)
  }

  return null
}
