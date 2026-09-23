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
 * Hourly 143 2026-09-23: pending-status (70) plus leftover other.
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly143(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.55, ['empty'], 'Empty residual 143', 'exploring', entities)
  if (liveish(q)) return hit('current-information', 0.93, ['open-status', 'current'], 'Open/deadline residual 143', 'exploring', entities)

  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan|why\s*(was|is)\s*nelfund\s*(created|set\s*up)|nelfund\s*na\s*wetin|aim\s*of\s*(the\s*)?scheme/i.test(
      q,
    )
  )
    return null

  if (
    /^(hi+|hlo|hello+|hey+|how\s*far|gm|ga|ge|good\s*(morn|aft|even)|yo+|sup|suh)\s*[!.?]*$/i.test(q) ||
    /^(help+|asist|assist|guide|pls+|plz|please|abeg+|jare|jo)\s*[!.?]*$/i.test(q) ||
    /^(menu|options?|start|begin|info|information)\s*[!.?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['greeting-vague', 'other'], 'Greeting or one-word help 143', 'exploring', entities)
  }

  if (
    /my\s*application\s*(is|dey|still)\s*(pending|processing|under\s*review)|application\s*still\s*(pending|processing)|status\s*(still|dey)\s*(pending|processing)|how\s*far\s*(with\s*)?(my\s*)?(own|loan|file|application)|money\s*(never|no)\s*(enter|drop|show|land)|kobo\s*(never|no)\s*(enter|drop)|account\s*(still\s*)?(empty|zero|blank)|una\s*never\s*pay\s*(me|am)|dem\s*never\s*pay\s*(me|am)|i\s*never\s*see\s*(my\s*)?(money|alert|upkeep)|nothing\s*don\s*(enter|drop|show)|wetin\s*(dey\s*)?happen\s*to\s*my\s*(loan|application|own)|e\s*never\s*(move|change|enter)|still\s*dey\s*wait\s*(for\s*)?(nelfund|loan|upkeep)|i\s*apply\s*(finish|don\s*finish|since)|submitted\s*(but|and)\s*(nothing|no\s*update)|no\s*disbursement\s*yet|disbursement\s*(pending|delay)|payment\s*(still\s*)?(pending|processing)|loan\s*(still\s*)?(pending|processing)|file\s*(still\s*)?(pending|under\s*review)|how\s*far\s*now\s*(abeg|pls)?|abeg\s*how\s*far\s*(my\s*)?(own|loan)|any\s*news\s*(on|about)\s*my\s*(loan|application)|has\s*(my\s*)?(loan|application)\s*(been\s*)?(paid|approved)|when\s*will\s*(my\s*)?(money|upkeep|loan)\s*(enter|drop|come)|i\s*don\s*wait\s*(pass|too\s*much)|waiting\s*since\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d+)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending paraphrase 143', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|correct|gree)|verification\s*failed\s*(on\s*)?jamb|jamb\s*verification\s*(fail|error)|jamb\s*no\s*(dey|gree)|utme\s*(no|not)\s*(valid|gree)|wrong\s*jamb|jamb\s*reject/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB paraphrase 143', 'applying', entities, true)
  }

  if (
    /email\s*(already\s*)?(used|taken|exist)|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*(with\s*)?(this\s*)?email|mail\s*we\s*y\s*i\s*use\s*last\s*year|same\s*email\s*as\s*last\s*year|forgot\s*(my\s*)?password|otp\s*(no|not|never)\s*(come|dey)|cannot\s*(login|sign\s*in)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used / last year 143', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*(dey|on|show|appear)|institution\s*(missing|no\s*dey)|my\s*school\s*(no|not)\s*(showing|listed)|cannot\s*find\s*(my\s*)?school|uni\s*no\s*dey\s*(the\s*)?list|schol\s*no\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list paraphrase 143', 'applying', entities, true)
  }

  if (
    /repay|pay\s*back|after\s*nysc|when\s*(i|we)\s*(go|will)\s*pay\s*(the\s*)?loan|interest\s*(rate|free)|loan\s*deduction|gsi|global\s*standing|wen\s*i\s*go\s*pay\s*back/i.test(
      q,
    ) &&
    !/pending|how\s*far|never\s*enter/i.test(q)
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment paraphrase 143', 'repaying', entities)
  }

  return null
}
