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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|take)|is\s*the\s*loan\s*still\s*on/i.test(
    q,
  )
}

/**
 * Hour-119 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual "other" Pidgin + vague help, plus leftover pending / jamb / login / school.
 */
export function residualOtherHourly119(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(
      q,
    )
  )
    return null

  if (
    /^(abeg|pls|please|una)?\s*(help|assist|guide)\s*(me|us)?[.!?\s]*$/i.test(q) ||
    /^(i\s*)?(need|wan(t)?|dey\s*need)\s*(help|assist(ance)?)[.!?\s]*$/i.test(q) ||
    /una\s*fit\s*help(\s*me)?(\s*(abeg|pls|please))?[.!?\s]*$/i.test(q) ||
    /^(help\s*me\s*(abeg|pls|please)|abeg\s*help|pls\s*help\s*me)[.!?\s]*$/i.test(q) ||
    /wetin\s*una\s*fit\s*do(\s*for\s*me)?[.!?\s]*$/i.test(q) ||
    /i\s*just\s*need\s*(someone|una)\s*to\s*help[.!?\s]*$/i.test(q) ||
    /make\s*una\s*help\s*me\s*(abeg)?[.!?\s]*$/i.test(q) ||
    /^(assist\s*me|guide\s*me|i\s*dey\s*confused)[.!?\s]*$/i.test(q)
  ) {
    return hit('official-sources', 0.92, ['other', 'greeting-vague'], 'Vague help leftover 119', 'exploring', entities)
  }

  if (
    /how\s*far\s*(with|on)\s*(my|dis|this)\s*(loan|file|own|application)|e\s*never\s*pay\s*(me|am)|dem\s*never\s*pay\s*(me|am)|una\s*never\s*release\s*(my|am)|status\s*(still\s*)?(pending|review)|under\s*review\s*(since|for)|nothing\s*don\s*happen\s*(since|after)\s*i\s*apply|i\s*submit(ted)?\s*(since|last).{0,20}(nothing|no\s*news)|wetin\s*dey\s*happen\s*to\s*my\s*(loan|file|own)|my\s*own\s*never\s*(enter|drop|show)|loan\s*never\s*leave\s*(pending|review)|processing\s*(since|for)\s*(weeks|months)|batch\s*(never|no)\s*(reach|include)\s*me|i\s*don\s*wait\s*(too\s*)?(long|plenty)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 119', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never)\s*(work|verify|dey|correct)|invalid\s*jamb|jamb\s*(number|reg)\s*(no|not)\s*(correct|accept)|utme\s*(error|fail|invalid)|jamb\s*wahala|cannot\s*verify\s*jamb|jamb\s*reject|jamb\s*don\s*fail|my\s*jamb\s*(no|not)\s*dey\s*go|jamb\s*verification\s*(fail|error)|reg\s*number\s*(no|not)\s*(work|correct)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 119', 'applying', entities, true)
  }

  if (
    /how\s*(do\s*i|i\s*go|to)\s*repay|when\s*(do\s*i|i\s*go)\s*(start\s*)?repay|repayment\s*(plan|start|begin)|gsi\s*(mandate|debit)|how\s*una\s*take\s*collect\s*(the\s*)?money\s*back|after\s*nysc.{0,16}(pay|repay)|interest\s*(on\s*)?(the\s*)?loan|how\s*much\s*(i\s*)?(go|will)\s*pay\s*back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.94, ['repayment'], 'Repay leftover 119', 'exploring', entities)
  }

  if (
    /this\s*email\s*(don|already)\s*(dey|exist|used)|i\s*use(d)?\s*(this\s*)?(mail|email)\s*last\s*(year|session)|last\s*year\s*(i\s*)?(register|apply)|account\s*already\s*created|cannot\s*sign\s*up\s*(again|with\s*this)|mail\s*don\s*dey\s*use|email\s*already\s*registered|i\s*don\s*get\s*account\s*before/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['other'], 'Email used leftover 119', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on|in)\s*(the\s*)?(list|portal|dropdown)|i\s*no\s*see\s*my\s*school|institution\s*(no|not)\s*listed|poly\s*(no|not)\s*dey\s*(the\s*)?list|college\s*(no|not)\s*on\s*(the\s*)?list|select\s*institution\s*(empty|blank)|my\s*school\s*name\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list leftover 119', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|fit|do)\s*(take\s*)?(apply|register)|i\s*wan(t)?\s*apply(\s*abeg)?|steps\s*to\s*(apply|register)|where\s*(i\s*)?(go|do)\s*start|beginner\s*(for|to)\s*(nelfund|loan)|first\s*time\s*(applicant|apply)|i\s*never\s*apply\s*before/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.91, ['other'], 'Apply leftover 119', 'applying', entities)
  }

  if (
    /^(pls|please|abeg)?\s*(hello|hi|hey|good\s*(day|morning|afternoon|evening)|how\s*far)[.!?\s]*$/i.test(q) ||
    /^(what\s*can\s*you\s*do|who\s*are\s*you|wetin\s*you\s*fit\s*do|wetin\s*una\s*dey\s*do)[.!?\s]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['greeting-vague'], 'Greeting leftover 119', 'exploring', entities)
  }

  return null
}
