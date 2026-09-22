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
 * Hour-112 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual "other" Pidgin + vague help. Short menu, never a live status dump.
 */
export function residualOtherHourly112(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|plz|please|bros|sis)?\s*(una\s*)?(fit\s*)?(help|guide|assist)\s*(me\s*)?(small|abeg|now|here)?\.?$/i.test(q) ||
    /i\s*(need|wan(t)?|dey\s*need)\s*(help|assistance|guide|direction)/i.test(q) ||
    /i\s*(no|don'?t)\s*sabi\s*(anything|wetin|how|where)/i.test(q) ||
    /i\s*dey\s*(lost|confused|blank)/i.test(q) ||
    /pls?\s*i\s*wan(t)?\s*(ask|yarn)\s*(something|sometin|one\s*thing)/i.test(q) ||
    /una\s*fit\s*help\s*(me\s*)?(abeg|now)?/i.test(q) ||
    /make\s*una\s*(help|guide)\s*me/i.test(q) ||
    /i\s*no\s*know\s*where\s*to\s*start/i.test(q) ||
    /where\s*(do\s*)?i\s*(even\s*)?begin/i.test(q) ||
    /just\s*(show|tell)\s*me\s*(wetin|what)\s*(to|i\s*(go|should))\s*do/i.test(q) ||
    /any\s*(help|info|information)\s*(abeg|pls|please)?\.?$/i.test(q) ||
    /i\s*come\s*ask\s*(question|sometin)/i.test(q) ||
    /^help\s*(me\s*)?(out|abeg|pls)?\.?$/i.test(q) ||
    /wetin\s*i\s*suppose\s*do\s*(now|first|abeg)?\.?$/i.test(q)
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague Pidgin help 112', 'exploring', entities)
  }

  if (
    /my\s*(own|file|loan)\s*(never|no)\s*(move|change|enter|show)/i.test(q) ||
    /dem\s*never\s*(pay|disburse|approve)\s*(me|my\s*own)/i.test(q) ||
    /how\s*far\s*(with\s*)?(this\s*)?(my\s*)?(nelfund|loan)\s*(na)?/i.test(q) ||
    /e\s*still\s*dey\s*(pending|processing|same\s*place)/i.test(q) ||
    /i\s*don\s*apply\s*(but|since).{0,24}(nothing|no\s*update|no\s*money)/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 112', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no\s*)?(dey|is)\s*(reject|rejected|invalid|wrong)/i.test(q) ||
    /portal\s*(no|not)\s*(gree|accept)\s*(my\s*)?jamb/i.test(q) ||
    /utme\s*(number|no)\s*(no|not)\s*(valid|correct)/i.test(q) ||
    /jamb\s*verification\s*(fail|failed|error)/i.test(q) ||
    /caps\s*(and|vs|with)\s*(nelfund|portal)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 112', 'applying', entities, true)
  }

  if (
    /how\s*(do\s*i|to)\s*(pay\s*back|repay|refund)\s*(the\s*)?(loan|nelfund)/i.test(q) ||
    /repayment\s*(plan|starts?|begin|when)/i.test(q) ||
    /when\s*(do\s*i|i\s*go)\s*(start\s*)?(pay(ing)?|repay)/i.test(q) ||
    /wetin\s*be\s*(the\s*)?repay/i.test(q) ||
    /i\s*wan(t)?\s*(pay|settle)\s*(my\s*)?(loan|nelfund)/i.test(q)
  ) {
    return hit('repayment', 0.94, ['repayment'], 'Repay leftover 112', 'repaying', entities)
  }

  if (
    /school\s*(no|not)\s*(dey|on|in)\s*(the\s*)?(list|portal)/i.test(q) ||
    /i\s*no\s*see\s*(my\s*)?(school|institution)/i.test(q) ||
    /institution\s*(not|no)\s*(found|showing|listed)/i.test(q) ||
    /my\s*(uni|poly|school)\s*(no|not)\s*(show|appear)/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list leftover 112', 'applying', entities, true)
  }

  if (
    /email\s*(i\s*)?(use[d]?|don\s*use)\s*(last\s*year|before)/i.test(q) ||
    /last\s*year\s*(i\s*)?(register|apply|use)/i.test(q) ||
    /old\s*(mail|email|account)\s*(still|dey)/i.test(q) ||
    /forgot(ten)?\s*(my\s*)?(password|login)/i.test(q) ||
    /i\s*don\s*register\s*(before|already|last)/i.test(q)
  ) {
    return hit('portal-login', 0.94, ['login'], 'Login leftover 112', 'applying', entities, true)
  }

  return null
}
