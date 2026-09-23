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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*(collect|open|accept)|nelfund\s+dey\s+(still\s+)?open|dem\s*don\s*open|una\s*don\s*open/i.test(
    q,
  )
}

/**
 * Hourly 142 2026-09-23: residual other (324) plus leftover pending / jamb / login / school.
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly142(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.55, ['empty'], 'Empty residual 142', 'exploring', entities)
  if (liveish(q)) return hit('current-information', 0.93, ['open-status', 'current'], 'Open/deadline residual 142', 'exploring', entities)

  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(
      q,
    )
  )
    return null

  if (
    /^(hi+|hlo|hello+|hey+|how\s*far|gm|ga|ge|good\s*(morn|aft|even)|yo+|sup|suh)\s*[!.?]*$/i.test(q) ||
    /^(help+|asist|assist|guide|pls+|plz|please|abeg+|jare|jo)\s*[!.?]*$/i.test(q) ||
    /^(menu|options?|start|begin|info|information)\s*[!.?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['greeting-vague', 'other'], 'Greeting or one-word help 142', 'exploring', entities)
  }

  if (
    /abeg\s*(una\s*)?(help|asist|assist|guide|yarn)\s*(me)?|una\s*fit\s*(help|yarn|show|tok)\s*me|i\s*(just\s*)?(need|nid|wan|want|wana)\s*(una\s*)?help|wetin\s*i\s*(suppose|go|fit|supose)\s*do\s*(now|here|abeg)?|i\s*dey\s*(lost|lose|confused|confuzed|stranded|blank)|i\s*no\s*sabi\s*(wetin|where|anytin|anything)|make\s*una\s*(guide|help|show)\s*me|kindly\s*(asist|assist)|short\s*(menu|guide|list)|how\s*(this|dis|dis)\s*(tin|thing|matter)\s*(dey\s*)?work|orientate\s*me|direct\s*me\s*(abeg)?|gimme\s*(menu|options)|na\s*how\s*e\s*take\s*be|i\s*need\s*(small\s*)?(orientation|direction)|help\s*me\s*(with\s*)?(this|dis)\s*(nelfund|loan)?\s*(abeg|pls|plz)?|wetin\s*una\s*fit\s*do\s*for\s*me|show\s*me\s*where\s*to\s*start|i\s*no\s*know\s*wetin\s*to\s*ask|just\s*help\s*me\s*abeg|pls\s*i\s*need\s*direction|i\s*no\s*know\s*where\s*to\s*(start|begin)|can\s*u\s*help\s*me|help\s*me\s*jo|abeg\s*orientate|how\s*e\s*take\s*work|i\s*wan\s*una\s*yarn\s*me|make\s*una\s*tok\s*small|i\s*just\s*enter\s*here|first\s*time\s*here|wetin\s*una\s*dey\s*do\s*here|how\s*i\s*go\s*take\s*use\s*(this|dis)\s*(bot|app|guide)/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 142', 'exploring', entities)
  }

  if (
    /how\s*far(\s*(na|now|abeg|my\s*own|my\s*loan|my\s*file|pls|plz))?|my\s*(loan|aplication|application|file|own)\s*(still\s*)?(dey\s*)?(pending|pendin|same|review)|e\s*never\s*(enter|drop|show|move)|money\s*(never|no)\s*(enter|drop)|alert\s*(never|no)\s*(come|drop)|status\s*(no|not|never)\s*(change|move)|under\s*review|when\s*(dem|una|they)\s*(go|will)\s*pay|i\s*don\s*(apply|submit)|nothing\s*don\s*(drop|happen)|mates?\s*don\s*(collect|receive)|dashboard\s*(na\s*)?(0|zero)|una\s*never\s*pay|waiting\s*(for\s*)?(my\s*)?(loan|upkeep)|any\s*update\s*(on\s*)?(my\s*)?(loan|file)|track\s*(my\s*)?(loan|application)|follow\s*up\s*(my\s*)?(loan|application)|wetin\s*(dey\s*)?happen\s*to\s*my|processing\s*(since|still)|no\s*credit\s*alert|kobo\s*never\s*enter|batch\s*\d+|approved\s*but\s*(no|never)\s*(money|alert)|pendin\s*since|stil\s*pendin|e\s*dey\s*there\s*so|no\s*movement/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending paraphrase 142', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never)\s*(valid|correct|gree|work|dey)|jamb\s*(wahala|error|fail|failed|errror)|cannot\s*verify\s*(my\s*)?jamb|utme\s*(invalid|fail|no\s*gree)|portal\s*(reject|no\s*gree)\s*(my\s*)?jamb|e\s*say\s*(my\s*)?jamb\s*(wrong|invalid)|jamb\s*reg\s*(no|number)\s*(wrong|invalid)|jamb\s*and\s*(nin|name)\s*(no|not)\s*match|verify\s*jamb\s*(abeg|pls)|jamb\s*details\s*(no|not)\s*(correct|match)|jamb\s*no\s*gree|jamb\s*number\s*no\s*work|e\s*write\s*invalid\s*jamb|jam\s*number\s*invalid/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB paraphrase 142', 'applying', entities, true)
  }

  if (
    /email\s*(already|don|alredy)\s*(used|exist|dey)|registered\s*(last\s*)?(year|session)|this\s*(mail|email)\s*(don|already)\s*(dey|exist)|account\s*(already|don)\s*exist|cannot\s*create\s*(new\s*)?account|forgot\s*(my\s*)?password|otp\s*(no|not|never)\s*(come|dey)|cannot\s*(login|sign\s*in|log\s*in)|mail\s*we\s*y\s*i\s*use\s*last\s*year|same\s*email\s*as\s*last\s*year|email\s*don\s*dey|i\s*register\s*last\s*year|last\s*year\s*account|old\s*email\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used / last year 142', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*(dey|on|show|appear)\s*(the\s*)?(list|portal)|institution\s*(missing|no\s*dey)|my\s*school\s*(no|not)\s*(showing|listed)|cannot\s*find\s*(my\s*)?school|school\s*list\s*(no|not)\s*(complete|show)|uni\s*no\s*dey\s*the\s*list|schol\s*no\s*dey|my\s*uni\s*no\s*show|school\s*name\s*no\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list paraphrase 142', 'applying', entities, true)
  }

  if (
    /repay|pay\s*back|after\s*nysc|when\s*(i|we)\s*(go|will)\s*pay\s*(the\s*)?loan|how\s*(i|we)\s*(go|to)\s*repay|interest\s*(rate|free)|loan\s*deduction|salary\s*deduct|gsi|global\s*standing|wen\s*i\s*go\s*pay\s*back|dem\s*go\s*cut\s*salary/i.test(
      q,
    ) &&
    !/pending|how\s*far|never\s*enter/i.test(q)
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment paraphrase 142', 'repaying', entities)
  }

  return null
}
