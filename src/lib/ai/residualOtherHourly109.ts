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
 * Hour-109 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70.
 * Focus: pending-status sentence shapes that still leak to other, plus short fragments.
 */
export function residualOtherHourly109(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*(application|loan|file|own)\s*(is|dey|still)\s*(pending|processing|on\s*hold)/i.test(q) ||
    /application\s*(is\s*)?(still\s*)?(pending|processing)/i.test(q) ||
    /status\s*(still\s*)?(processing|pending)/i.test(q) ||
    /how\s*far\s*(with\s*)?(my\s*)?(own|loan|application|file)/i.test(q) ||
    /how\s*far\s*my\s*own/i.test(q) ||
    /money\s*(never|no|not)\s*(enter|drop|show|land)/i.test(q) ||
    /e\s*never\s*(enter|drop|land|show)\s*(for|in)?\s*(my\s*)?(account|bank)?/i.test(q) ||
    /account\s*(still\s*)?(empty|blank|zero|0)/i.test(q) ||
    /no\s*(kobo|naira|money)\s*(don\s*)?(enter|drop|show)/i.test(q) ||
    /i\s*(don|have)\s*(dey\s*)?wait\s*(since|tire)/i.test(q) ||
    /waiting\s*tire/i.test(q) ||
    /file\s*(no|not|never)\s*(move|change|update)/i.test(q) ||
    /dem\s*forget\s*(my\s*)?(own|file|loan)/i.test(q) ||
    /any\s*hope\s*(for|on)\s*(my\s*)?(loan|file|own)/i.test(q) ||
    /hope\s*remain\s*(for|on)\s*(this\s*)?(loan|file)/i.test(q) ||
    /una\s*see\s*(my\s*)?(file|application)\s*(at\s*all)?/i.test(q) ||
    /check\s*(this\s*)?(my\s*)?(status|file)\s*(abeg|pls)?/i.test(q) ||
    /abeg\s*(check|look)\s*(my\s*)?(loan|file|status)/i.test(q) ||
    /i\s*apply\s*(finish|done|already)\s*(na|abeg)?/i.test(q) ||
    /after\s*i\s*submit\s*(wetin|what)\s*(next|happen)/i.test(q) ||
    /submit(ted)?\s*(but|and)\s*(nothing|no\s*news)/i.test(q) ||
    /processing\s*(since|for)\s*(weeks?|months?|days?)/i.test(q) ||
    /pending\s*(for|since)\s*(weeks?|months?|days?)/i.test(q) ||
    /e\s*dey\s*(there\s*)?since/i.test(q) ||
    /my\s*matter\s*(no|not)\s*(move|change)/i.test(q) ||
    /loan\s*matter\s*(still\s*)?(dey|pending)/i.test(q) ||
    /wetin\s*sup\s*(with|for)\s*(my\s*)?(loan|file|application)/i.test(q) ||
    /wetin\s*dey\s*sup\s*(with|for)\s*(my\s*)?(loan|own)/i.test(q) ||
    /any\s*movement\s*(for|on)\s*(my\s*)?(loan|file)/i.test(q) ||
    /has\s*(my\s*)?(loan|application)\s*(been\s*)?(approved|paid)/i.test(q) ||
    /has\s*anything\s*(moved|changed)\s*(on|for)\s*(my\s*)?(file|loan)/i.test(q) ||
    /please\s*(confirm|check)\s*(my\s*)?(application\s*)?status/i.test(q) ||
    /kindly\s*(advise|tell)\s*(me\s*)?(on\s*)?(the\s*)?status/i.test(q) ||
    /i\s*need\s*(an?\s*)?(update|status)\s*(on\s*)?(my\s*)?(application|loan)/i.test(q) ||
    /update\s*(on|for)\s*my\s*(application|loan|file)/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 109', 'waiting', entities, true)
  }

  if (
    /^(pls|plz|abeg)?\s*(wetin\s*)?(una\s*)?(fit|can)\s*help\s*with/i.test(q) ||
    /what\s*(topics?|things?)\s*(can|fit)\s*(i|you)\s*(ask|cover)/i.test(q) ||
    /i\s*no\s*know\s*wetin\s*to\s*type/i.test(q) ||
    /i\s*no\s*sabi\s*wetin\s*to\s*ask/i.test(q) ||
    /just\s*(show|gimme|give)\s*(me\s*)?(options|topics)/i.test(q) ||
    /start\s*me\s*(small|up)/i.test(q) ||
    /where\s*i\s*(go|suppose)\s*begin/i.test(q) ||
    /i\s*dey\s*new\s*here/i.test(q) ||
    /first\s*timer\s*(abeg|here)/i.test(q) ||
    /brief\s*me/i.test(q) ||
    /talk\s*to\s*me\s*(small|abeg)/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help / short menu 109', 'exploring', entities)
  }

  if (
    /jamb\s*(no\s*)?gree\s*(work|enter)/i.test(q) ||
    /e\s*reject\s*(my\s*)?jamb/i.test(q) ||
    /verification\s*(failed|fail)\s*(on\s*)?(jamb|utme)/i.test(q) ||
    /jamb\s*(verification\s*)?(failed|fail)/i.test(q) ||
    /cannot\s*verify\s*(my\s*)?jamb/i.test(q) ||
    /jamb\s*number\s*(not|no)\s*valid/i.test(q) ||
    /reg\s*(no|number)\s*(invalid|wrong)\s*.{0,12}jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 109', 'applying', entities, true)
  }

  if (
    /email\s*(already\s*)?(used|taken|exist)/i.test(q) ||
    /this\s*mail\s*(no|not)\s*(gree|work)\s*(again)?/i.test(q) ||
    /i\s*don\s*use\s*(this\s*)?(mail|email)\s*before/i.test(q) ||
    /registered\s*last\s*year/i.test(q) ||
    /cannot\s*create\s*(account|acct).{0,24}email/i.test(q) ||
    /account\s*(already\s*)?exist(s)?/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email / last-year 109', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*(the\s*)?(list|dropdown)/i.test(q) ||
    /my\s*school\s*no\s*dey\s*list/i.test(q) ||
    /institution\s*missing/i.test(q) ||
    /cannot\s*find\s*(my\s*)?(school|institution)/i.test(q) ||
    /school\s*not\s*showing/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 109', 'applying', entities, true)
  }

  return null
}
