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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|open|accept)|nelfund\s+dey\s+(still\s+)?open/i.test(
    q,
  )
}

/**
 * Hourly 141 2026-09-23: largest unknown bucket is other (324).
 * Cover Pidgin + vague help, then leftover pending / jamb / login / school / repayment shapes.
 */
export function residualOtherHourly141(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.55, ['empty'], 'Empty residual 141', 'exploring', entities)
  if (liveish(q)) return hit('current-information', 0.93, ['open-status', 'current'], 'Open/deadline residual 141', 'exploring', entities)

  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(
      q,
    )
  )
    return null

  if (
    /^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening)|yo|sup)\s*[!.?]*$/i.test(q) ||
    /^(help|assist|guide|pls|please|abeg)\s*[!.?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['greeting-vague', 'other'], 'Greeting or one-word help 141', 'exploring', entities)
  }

  if (
    /abeg\s*(una\s*)?(help|assist|guide)\s*(me)?|una\s*fit\s*(help|yarn|show)\s*me|i\s*(just\s*)?(need|wan|want)\s*(una\s*)?help|wetin\s*i\s*(suppose|go|fit)\s*do\s*(now|here)?|i\s*dey\s*(lost|confused|stranded)|i\s*no\s*sabi\s*(wetin|where)|make\s*una\s*(guide|help|show)\s*me|kindly\s*assist|short\s*(menu|guide|list)|how\s*(this|dis)\s*(thing|matter)\s*(dey\s*)?work|orientate\s*me|direct\s*me\s*(abeg)?|gimme\s*(menu|options)|na\s*how\s*e\s*take\s*be|i\s*need\s*(small\s*)?(orientation|direction)|help\s*me\s*(with\s*)?(this|dis)\s*(nelfund|loan)?\s*(abeg|pls)?|wetin\s*una\s*fit\s*do\s*for\s*me|show\s*me\s*where\s*to\s*start|i\s*no\s*know\s*wetin\s*to\s*ask|just\s*help\s*me\s*abeg|pls\s*i\s*need\s*direction/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 141', 'exploring', entities)
  }

  if (
    /how\s*far(\s*(na|now|abeg|my\s*own|my\s*loan|my\s*file))?|my\s*(loan|application|file|own)\s*(still\s*)?(dey\s*)?(pending|same|review)|e\s*never\s*(enter|drop|show|move)|money\s*(never|no)\s*(enter|drop)|alert\s*(never|no)\s*(come|drop)|status\s*(no|not|never)\s*(change|move)|under\s*review|when\s*(dem|una|they)\s*(go|will)\s*pay|i\s*don\s*(apply|submit)|nothing\s*don\s*(drop|happen)|mates?\s*don\s*(collect|receive)|dashboard\s*(na\s*)?(0|zero)|una\s*never\s*pay|waiting\s*(for\s*)?(my\s*)?(loan|upkeep)|any\s*update\s*(on\s*)?(my\s*)?(loan|file)|track\s*(my\s*)?(loan|application)|follow\s*up\s*(my\s*)?(loan|application)|wetin\s*(dey\s*)?happen\s*to\s*my|processing\s*(since|still)|no\s*credit\s*alert|kobo\s*never\s*enter|batch\s*\d+|approved\s*but\s*(no|never)\s*(money|alert)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending paraphrase 141', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never)\s*(valid|correct|gree|work|dey)|jamb\s*(wahala|error|fail|failed)|cannot\s*verify\s*(my\s*)?jamb|utme\s*(invalid|fail|no\s*gree)|portal\s*(reject|no\s*gree)\s*(my\s*)?jamb|e\s*say\s*(my\s*)?jamb\s*(wrong|invalid)|jamb\s*reg\s*(no|number)\s*(wrong|invalid)|jamb\s*and\s*(nin|name)\s*(no|not)\s*match|verify\s*jamb\s*(abeg|pls)|jamb\s*details\s*(no|not)\s*(correct|match)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB paraphrase 141', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|exist|dey)|registered\s*(last\s*)?(year|session)|this\s*(mail|email)\s*(don|already)\s*(dey|exist)|account\s*(already|don)\s*exist|cannot\s*create\s*(new\s*)?account|forgot\s*(my\s*)?password|otp\s*(no|not|never)\s*(come|dey)|cannot\s*(login|sign\s*in|log\s*in)|mail\s*we\s*y\s*i\s*use\s*last\s*year|same\s*email\s*as\s*last\s*year/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used / last year 141', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*(dey|on|show|appear)\s*(the\s*)?(list|portal)|institution\s*(missing|no\s*dey)|my\s*school\s*(no|not)\s*(showing|listed)|cannot\s*find\s*(my\s*)?school|school\s*list\s*(no|not)\s*(complete|show)|uni\s*no\s*dey\s*the\s*list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list paraphrase 141', 'applying', entities, true)
  }

  if (
    /repay|pay\s*back|after\s*nysc|when\s*(i|we)\s*(go|will)\s*pay\s*(the\s*)?loan|how\s*(i|we)\s*(go|to)\s*repay|interest\s*(rate|free)|loan\s*deduction|salary\s*deduct|gsi|global\s*standing/i.test(
      q,
    ) &&
    !/pending|how\s*far|never\s*enter/i.test(q)
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment paraphrase 141', 'repaying', entities)
  }

  return null
}
