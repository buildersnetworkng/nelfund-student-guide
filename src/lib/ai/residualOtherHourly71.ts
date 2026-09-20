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

/**
 * Hour-71 leftover catcher.
 * Live 2026-09-20 18:12Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: vague Pidgin / help-me "other" shapes, plus leftover pending, jamb, repay, open, school, login.
 */
export function residualOtherHourly71(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /^(abeg|pls|please|bros|sis)?\s*(help|assist|guide)\s*(me|us)?\s*(abeg|pls|please|small|now)?[!?.]*$|i\s*(just\s*)?(need|wan|want)\s*(help|assist)|wetin\s*(i\s*)?(fit|can|go)\s*(ask|do)\s*(here|here\s*now)?|help\s*me\s*(with\s*)?(this|dis)\s*(thing|matter|issue)|una\s*(fit|can)\s*help\s*me|i\s*dey\s*confused(\s*abeg)?|make\s*una\s*help\s*me|i\s*no\s*know\s*where\s*to\s*start|guide\s*me\s*(abeg|pls)|wetin\s*una\s*fit\s*do\s*for\s*me|i\s*need\s*orientation|how\s*una\s*take\s*help\s*students?|what\s*can\s*you\s*help\s*(me\s*)?(with)?[!?.]*$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help 71', 'exploring', entities)
  }

  if (
    /my\s*(loan|file|app(lication)?)\s*(still\s*)?(dey|is)\s*(there|same|static)|nothing\s*(don|has)\s*(change|changed|move)|e\s*never\s*comot\s*(from|for)\s*(pending|review)|una\s*forget\s*my\s*(file|own)|batch\s*(never|no)\s*(reach|cover)\s*me|i\s*still\s*dey\s*wait\s*(since|from)|no\s*movement\s*(for|on)\s*(my\s*)?(portal|dashboard)|status\s*no\s*gree\s*change|e\s*still\s*write\s*(pending|submitted)|dem\s*never\s*touch\s*my\s*(own|file)|how\s*long\s*(go|will)\s*(this|dis)\s*(pending|wait)\s*take/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 71', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg(istration)?|no|number)\s*(wahala|issue|problem)|caps?\s*(no|not)\s*(gree|match)|old\s*jamb\s*(no|not)\s*(work|gree)|direct\s*entry\s*jamb\s*(fail|invalid)|portal\s*(say|said)\s*jamb\s*(invalid|wrong)|my\s*jamb\s*(no|number)\s*(wrong|reject)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 71', 'applying', entities, true)
  }

  if (
    /when\s*(dem|they|una)\s*(go|will)\s*(open|reopen)\s*(the\s*)?(loan|upkeep|portal)|loan\s*(window|cycle)\s*(still|stil)\s*(dey|open|close)|una\s*don\s*open\s*(am|loan)\s*(this|dis)\s*(year|session)|is\s*(the\s*)?(window|cycle)\s*(still|stil)\s*(on|open)|closing\s*date\s*(for\s*)?(loan|upkeep)|fit\s*i\s*still\s*apply\s*(today|now)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'current'], 'Open leftover 71', 'exploring', entities)
  }

  if (
    /how\s*(i\s*)?(go|will)\s*pay\s*(back|am)|when\s*(repay|repayment)\s*(start|begin)|salary\s*(go|will)\s*cut|gsi\s*(wahala|issue)|i\s*no\s*wan\s*go\s*jail|dem\s*go\s*jail\s*person|how\s*to\s*repay\s*(this|dis)\s*loan|after\s*nysc\s*(how|wetin)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repay leftover 71', 'repaying', entities)
  }

  if (
    /school\s*(name|list)\s*(no|not)\s*(dey|show|appear)|search\s*(my\s*)?school\s*(no|not)\s*(work|show)|institution\s*(no|not)\s*(listed|showing)|poly\s*(no|not)\s*dey\s*(the\s*)?list|coe\s*(no|not)\s*on\s*(the\s*)?list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 71', 'applying', entities, true)
  }

  if (
    /i\s*use\s*(this|dis)\s*mail\s*(last|last\s*year)|email\s*don\s*exist|account\s*already\s*(dey|exists)|cannot\s*sign\s*up\s*(again|with\s*same)|forgot\s*(my\s*)?(old|last\s*year)\s*(mail|password)|last\s*year\s*(i\s*)?(register|registered)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 71', 'applying', entities, true)
  }

  return null
}
