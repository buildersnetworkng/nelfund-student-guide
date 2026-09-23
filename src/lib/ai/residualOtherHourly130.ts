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
 * Hourly 130 2026-09-23: residual "other" (Pidgin + vague help) first.
 * Named leftovers still route to concrete intents, never unknown.
 */
export function residualOtherHourly130(text: string, entities: string[]): IntentResult | null {
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
    /^(abeg|pls|please|kindly)?\s*(una\s*)?(fit|can|please)?\s*(help|assist|guide|orientate|yarn|explain)\s*(me|am)?\s*(abeg|small|jare|jo|now)?\.?$|^i\s*(just\s*)?(dey|am)\s*(lost|confused|stranded|blank|here)$|^wetin\s*(i|una)\s*(suppose|fit|go)\s*(ask|do|yarn)\s*(here|now)?\??$|^make\s*una\s*(help|guide|show)\s*(me|am)\s*(abeg)?$|^i\s*no\s*sabi\s*(anything|wetin\s*to\s*do|where\s*to\s*start)$|^help\s*(me\s*)?(with\s*)?(this|dis)?\s*(nelfund)?\s*(matter|thing)?\s*(abeg|pls)?$|^how\s*(e|this|dis)\s*(matter|thing)\s*(dey\s*)?work\??$|^gimme\s*(short\s*)?(menu|list|options)$|^show\s*options$|^i\s*need\s*(una|your)\s*help\s*(abeg)?$|^una\s*dey\??$|^who\s*fit\s*help\s*me\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help 130', 'exploring', entities)
  }

  if (
    /how\s*far\s*(na|now|abeg|biko)?|e\s*never\s*(enter|drop|show|move)|kobo\s*(never|no)\s*(enter|drop)|wallet\s*(still\s*)?(empty|blank|zero)|approved\s*but\s*(no|never)\s*(money|alert|kobo)|i\s*don\s*apply\s*(since|long|before)|when\s*(una|dem|they)\s*go\s*pay\s*(me|am)|status\s*(check|update)\s*(abeg|pls|biko)|track\s*(am|my\s*file)\s*(abeg|for\s*me)|my\s*own\s*never\s*(show|enter|drop)|nothing\s*for\s*(my\s*)?(dashboard|wallet)|batch\s*(no|never)\s*(reach|come)\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 130', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never|dey)\s*(gree|work|pass|correct|valid)|invalid\s*jamb|jamb\s*(reg|number|regno)\s*(wrong|fail|error)|utme\s*(no|not)\s*(gree|work|valid)|portal\s*reject\s*(my\s*)?jamb|cannot\s*verify\s*jamb|jamb\s*verification\s*(fail|error)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 130', 'applying', entities, true)
  }

  if (
    /email\s*(don|already|has)\s*(use|used|exist|taken)|i\s*register(ed)?\s*(last\s*year|last\s*session|before)|mail\s*already\s*in\s*use|cannot\s*create\s*(new\s*)?account|sign\s*up\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 130', 'applying', entities, true)
  }

  if (
    /school\s*(no|not)\s*(dey|show|showing)|my\s*school\s*missing|institution\s*(no|not)\s*(on|dey)\s*(the\s*)?list|cannot\s*find\s*(my\s*)?(school|uni|poly)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 130', 'applying', entities, true)
  }

  if (
    /when\s*(do|will|go)\s*(i|we)\s*(start\s*)?repay|how\s*(do|i\s*go)\s*pay\s*(back|am)|after\s*nysc\s*(i\s*)?(go|will)\s*pay|repayment\s*(start|begin|plan)|payback\s*(period|plan)|gsi\s*(go|will)\s*take/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.93, ['repayment'], 'Repayment leftover 130', 'repaying', entities)
  }

  return null
}
