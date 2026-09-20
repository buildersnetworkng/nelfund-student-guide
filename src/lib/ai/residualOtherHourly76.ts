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
 * Hour-76 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other = Pidgin + vague help fragments / typos.
 */
export function residualOtherHourly76(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop)|processing|under\s*review|approved/.test(low)) {
    return null
  }

  if (
    /abeg\s*(una\s*)?(help|assist|guide)|help\s*me\s*(now|abeg|pls|please)|i\s*just\s*dey\s*(ask|yarn)|wetin\s*una\s*fit\s*yarn|make\s*i\s*ask\s*(una|you)|i\s*no\s*get\s*(idea|direction)|no\s*idea\s*(wetin|what)\s*(to|i)\s*do|teach\s*me\s*(small|how)|break\s*am\s*down\s*(abeg|pls)|simple\s*(steps?|guide)\s*(abeg|pls)?|i\s*wan\s*learn\s*(how|am)|una\s*fit\s*explain\s*small|explain\s*small\s*(abeg|pls)|i\s*dey\s*blank|my\s*head\s*no\s*gree|i\s*don\s*lost|i\s*lost\s*(pass|well)|where\s*person\s*go\s*start|from\s*where\s*now|wetin\s*first|first\s*tin\s*(abeg|pls)|i\s*need\s*orientation|orient\s*me\s*(abeg|pls)|talk\s*to\s*me\s*like\s*newbie|i\s*be\s*newbie|new\s*here\s*(abeg|pls)|just\s*landed|i\s*just\s*come\s*(here|online)|any\s*help\s*(at\s*all|abeg)|help\s*a\s*student|student\s*dey\s*ask|una\s*dey\s*there\s*\??$|who\s*fit\s*help\s*me\s*(here|abeg)|pls\s*i\s*need\s*(direction|guidance)|kindly\s*point\s*me|point\s*me\s*abeg|i\s*no\s*understand\s*(anything|anytin)|anytin\s*una\s*fit\s*do/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague Pidgin help leftover 76', 'exploring', entities)
  }

  if (
    /how\s*far\s*(now|abeg|una)|my\s*own\s*(still|stil)\s*(dey|na)\s*(same|pending)|stil\s*pending|e\s*no\s*move\s*(at\s*all|since)|nothing\s*change\s*(since|at\s*all)|i\s*check\s*(am|status)\s*(everyday|every\s*day)|everyday\s*(same|pending)|week\s*don\s*pass\s*(nothing|no\s*pay)|month\s*don\s*pass\s*(nothing|no\s*pay)|dem\s*pay\s*my\s*mate\s*(i\s*)?never|mates\s*don\s*see\s*(theirs|theirs\s*own)|class\s*mates?\s*don\s*(collect|receive)|i\s*remain\s*(one|only)|only\s*me\s*never\s*(see|collect)|batch\s*(never|no)\s*(enter|drop)|zero\s*naira\s*(enter|drop)|acct\s*still\s*empty|account\s*still\s*empty/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Pending leftover 76', 'waiting', entities, true)
  }

  if (
    /jamb\s*(numba|no|number)\s*(no|not)\s*(gree|work|correct)|wrong\s*jamb\s*(numba|no)|utme\s*reg\s*(no|not)\s*(work|gree)|caps\s*wahala|admission\s*no\s*gree\s*jamb|jamb\s*portal\s*(no|not)\s*(match|gree)|old\s*jamb\s*(no|not)\s*(work|gree)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 76', 'applying', entities, true)
  }

  if (
    /my\s*(uni|university|poly|coe)\s*(no|not)\s*(dey|show)|school\s*no\s*appear|list\s*no\s*carry\s*(my\s*)?school|cannot\s*locate\s*(my\s*)?(school|institution)|institution\s*search\s*(fail|empty)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list'], 'School list leftover 76', 'applying', entities, true)
  }

  if (
    /that\s*email\s*(don|already)\s*(exist|dey)|mail\s*i\s*use\s*last\s*(year|session)|last\s*year\s*register|i\s*register\s*before\s*(na|with)\s*(this|dis)\s*mail|cannot\s*sign\s*up\s*(again|anoda)|signup\s*(no|not)\s*gree\s*(because|cos)\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['email-used'], 'Email used leftover 76', 'applying', entities, true)
  }

  if (
    /how\s*(dem|they)\s*(go|will)\s*collect\s*(the\s*)?money\s*back|salary\s*cut|dem\s*go\s*cut\s*(my\s*)?pay|when\s*repayment\s*(go|will)\s*start|payback\s*(time|period)|after\s*nysc\s*(wetin|what)/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment leftover 76', 'repaying', entities)
  }

  return null
}
