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
 * Hour-110 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual `other` Pidgin + vague help, then pending/jamb/login leftovers.
 */
export function residualOtherHourly110(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /^(abeg|pls|plz|please)?\s*(una\s*)?(fit|can|gimme|give)\s*(small\s*)?(help|guide|hand)\s*(na|abeg|pls)?\.?$/i.test(q) ||
    /i\s*(just\s*)?wan(t)?\s*(una|you)\s*(to\s*)?(help|guide)\s*me/i.test(q) ||
    /make\s*una\s*(yarn|talk|explain)\s*(am\s*)?(small|abeg)/i.test(q) ||
    /how\s*(this|dis)\s*(thing|matter)\s*(dey\s*)?work\s*(abeg|pls)?/i.test(q) ||
    /wetin\s*(una|you)\s*(fit|can)\s*(do|help)\s*(me\s*)?(with)?/i.test(q) ||
    /i\s*no\s*know\s*where\s*to\s*(begin|start|enter)/i.test(q) ||
    /orientate\s*me(\s*abeg)?/i.test(q) ||
    /gimme\s*(the\s*)?(short\s*)?(list|menu|options)/i.test(q) ||
    /show\s*(me\s*)?(wetin|what)\s*(i\s*)?(fit|can)\s*ask/i.test(q) ||
    /i\s*dey\s*(lost|confused|blank)\s*(for\s*here)?/i.test(q) ||
    /^help\s*(me\s*)?(with\s*)?(this|dis)?\s*(nelfund)?\s*(abeg|pls)?\.?$/i.test(q) ||
    /na\s*how\s*(e|this|dis)\s*take\s*be/i.test(q) ||
    (/explain\s*(am|this|dis)\s*(small|abeg)/i.test(q) && !/pending|jamb|repay|login/i.test(q))
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help / Pidgin menu 110', 'exploring', entities)
  }

  if (
    /my\s*(own|matter|file)\s*(still\s*)?(dey|is)\s*(there|same|pending)/i.test(q) ||
    /nothing\s*(don|has)\s*(happen|change)\s*(for|on)\s*(my\s*)?(own|file|loan)/i.test(q) ||
    /e\s*still\s*dey\s*(the\s*)?same\s*(place|status)?/i.test(q) ||
    /una\s*forget\s*(my\s*)?(own|file)/i.test(q) ||
    /dem\s*no\s*(remember|see)\s*(my\s*)?(own|file)/i.test(q) ||
    /i\s*don\s*apply\s*(since|long|last\s*month)/i.test(q) ||
    /apply\s*finish\s*(but|and)\s*(e\s*)?(no|never)\s*(move|pay)/i.test(q) ||
    /no\s*news\s*(since|at\s*all)/i.test(q) ||
    /silence\s*(since|on)\s*(my\s*)?(file|loan)/i.test(q) ||
    /when\s*(go|will)\s*(my\s*)?(own|money)\s*(enter|drop|show)/i.test(q) ||
    /una\s*go\s*pay\s*(me|us)\s*(when|how)/i.test(q) ||
    /batch\s*(never|no)\s*(reach|include)\s*me/i.test(q) ||
    /name\s*no\s*dey\s*(any\s*)?(list|batch)/i.test(q) ||
    /track\s*(my\s*)?(application|loan)\s*(abeg|pls)?/i.test(q) ||
    /follow\s*up\s*(on\s*)?(my\s*)?(application|loan)/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 110', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not)\s*(dey|work|gree)/i.test(q) ||
    /utme\s*(no|not)\s*(dey|work|gree)/i.test(q) ||
    /my\s*jamb\s*(reg|number|no)\s*(wrong|invalid|reject)/i.test(q) ||
    /portal\s*(no|not)\s*(accept|gree)\s*(my\s*)?jamb/i.test(q) ||
    /jamb\s*caps\s*(issue|problem|error)/i.test(q) ||
    /direct\s*entry\s*(jamb|issue|problem)/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 110', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|already)\s*(use|used|register)/i.test(q) ||
    /mail\s*(don|already)\s*(dey|exist)/i.test(q) ||
    (/i\s*register\s*last\s*(year|session)/i.test(q) && /email|mail|account|login|sign/i.test(q)) ||
    /old\s*(mail|email)\s*(no|not)\s*(gree|work)/i.test(q) ||
    /cannot\s*use\s*(this\s*)?(same\s*)?(mail|email)/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email / last-year leftover 110', 'applying', entities, true)
  }

  if (
    /my\s*school\s*(no|not)\s*(show|appear|dey)/i.test(q) ||
    /school\s*(no|not)\s*for\s*(the\s*)?(dropdown|list)/i.test(q) ||
    /institution\s*(no|not)\s*(show|appear)/i.test(q) ||
    /cannot\s*select\s*(my\s*)?school/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 110', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*(back|am)/i.test(q) ||
    /when\s*(i\s*)?(go|to)\s*start\s*(repay|repayment)/i.test(q) ||
    /repayment\s*(plan|start|begin)/i.test(q) ||
    /after\s*nysc\s*(wetin|how|pay)/i.test(q)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 110', 'repaying', entities)
  }

  return null
}
