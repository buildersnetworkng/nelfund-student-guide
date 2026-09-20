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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)/i.test(
    q,
  )
}

/**
 * Hour-73 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Extra shapes: Pidgin vague help, repayment fragments, JAMB typos, last-year email.
 */
export function residualOtherHourly73(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show)|processing|under\s*review/.test(low)) {
    return null
  }

  if (
    /^(abeg|pls|plz|please)?\s*(help|assist|aid)\s*(me|us)?\s*(abeg|pls|now)?[!?.]*$/i.test(q) ||
    /^(i\s*)?(need|wan|want)\s*(help|assistance)\s*(abeg|pls|now)?[!?.]*$/i.test(q) ||
    /una\s*fit\s*help|fit\s*una\s*help|help\s*me\s*(with\s*)?(nelfund|dis|this|am)?|i\s*dey\s*(confus(e|ed)|lost)|explain\s*am(\s*abeg)?|wetin\s*i\s*(go|suppose)\s*do(\s*now)?|i\s*no\s*know\s*wetin\s*(to|i\s*go)\s*do|guide\s*me\s*abeg|assist\s*me\s*(abeg|pls)/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.86, ['other', 'greeting-vague'], 'Vague Pidgin / help ask', 'exploring', entities)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*(back|am)|when\s*(i\s*)?(go|will)\s*(start\s*)?(repay|pay\s*back)|after\s*nysc\s*(i\s*)?(go|will)?\s*pay|interest\s*(rate|dey)|loan\s*na\s*(grant|free)|dem\s*go\s*charge\s*interest|repay(ment)?\s*(plan|schedule)|how\s*una\s*dey\s*collect\s*(the\s*)?money\s*back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repay / NYSC / interest leftover 73', 'repaying', entities)
  }

  if (
    /jamb\s*(no|numba|namba|reg)\s*(wrong|invalid|no\s*gree|reject)|utme\s*(no|not)\s*(gree|valid)|caps\s*(no|not)\s*(gree|show)|direct\s*entry\s*(jamb|issue|problem)|jamb\s*(otp|code)\s*(no|not|never)\s*(come|gree)|verify\s*jamb\s*(fail|error)|jamb\s*don\s*expire/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB typo leftover 73', 'applying', entities, true)
  }

  if (
    /i\s*use(d)?\s*(dis|this|that)\s*email\s*(last\s*year|before)|email\s*(i\s*)?(use|used)\s*(last\s*year|before)|register(ed)?\s*(with\s*)?(am|it)\s*last\s*year|account\s*from\s*last\s*(year|cycle)|old\s*portal\s*(mail|email)|cannot\s*sign\s*up.{0,20}(already|exist)|mail\s*don\s*dey\s*for\s*system/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.91, ['email-used'], 'Email used last year leftover 73', 'applying', entities, true)
  }

  if (
    /my\s*poly\s*no\s*dey|my\s*uni\s*no\s*dey|college\s*no\s*dey\s*(the\s*)?list|search\s*school\s*(no|not)\s*(result|show)|institution\s*no\s*appear|school\s*drop\s*down\s*(empty|blank)|dem\s*no\s*add\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list'], 'School list leftover 73', 'applying', entities, true)
  }

  if (
    /file\s*still\s*dey\s*(there|pending|same)|e\s*dey\s*the\s*same\s*place|no\s*progress\s*(for|on)\s*(my\s*)?(own|file)|i\s*submit(ted)?\s*(since|last)|waiting\s*(since|for)\s*(months?|weeks?)|dem\s*forget\s*(my\s*)?(own|file)|batch\s*(never|no)\s*(come|drop)|my\s*mates\s*don\s*(collect|see\s*alert)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.91, ['pending-status'], 'Pending leftover 73', 'waiting', entities, true)
  }

  return null
}
