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
 * Hour-120 leftover catcher. Live 2026-09-22: unknownAi 438, other 324.
 * New sentence shapes for pending, jamb, email-used, school missing, purpose-safe skip, documents.
 */
export function residualOtherHourly120(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (
    /what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan|why\s*(they|una|fg)\s*(bring|form|start)\s*(am|nelfund)|nelfund\s*for\s*wetin/i.test(
      q,
    )
  )
    return null

  if (
    /money\s*(never|no|not)\s*(enter|show|drop|land|reach)|alert\s*(never|no)\s*(come|enter|drop)|my\s*own\s*(never|no)\s*(move|change|update)|file\s*(still\s*)?(dey|is)\s*(pending|processing)|processing\s*since|dem\s*hold\s*(my|the)\s*(file|application)|i\s*never\s*see\s*(the\s*)?(credit|upkeep|payment)|status\s*no\s*dey\s*change|e\s*still\s*write\s*pending|how\s*far\s*my\s*own|una\s*don\s*see\s*my\s*application/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 120', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never)\s*(valid|correct|work|gree|verify)|invalid\s*jamb|verification\s*(failed|fail)\s*(on|for)\s*jamb|jamb\s*number\s*(no|not)\s*(valid|correct)|reg\s*(no|number)\s*(reject|rejected|invalid)|dem\s*say\s*(my\s*)?jamb\s*(no|not)\s*(correct|valid)|jamb\s*dey\s*reject|cannot\s*verify\s*jamb|jamb\s*mismatch|admission\s*(and|&)\s*jamb\s*(no|not)\s*match/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.96, ['jamb'], 'JAMB leftover 120', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|use|exist|registered)|registered\s*last\s*year|i\s*register(ed)?\s*last\s*(year|session)|cannot\s*create\s*account\s*with\s*(this|dis)\s*(mail|email)|gmail\s*(don|already)\s*dey|this\s*mail\s*no\s*gree\s*sign\s*up|account\s*exist(s)?\s*(for|with)\s*(this|dis)\s*(mail|email)|i\s*don\s*sign\s*up\s*before|old\s*email\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.96, ['other'], 'Email used leftover 120', 'applying', entities, true)
  }

  if (
    /school\s*(not|no|never)\s*(showing|show|dey)|my\s*school\s*no\s*dey\s*(list|portal)|institution\s*(missing|absent)\s*(on|from)\s*(the\s*)?portal|dropdown\s*(no|not)\s*(get|show|carry)\s*(my\s*)?school|i\s*search\s*(my\s*)?school\s*(no|nothing)|school\s*name\s*(no|not)\s*appear|institution\s*search\s*(empty|blank|fail)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.95, ['school-list'], 'School list leftover 120', 'applying', entities, true)
  }

  if (
    /admission\s*letter\s*(where|upload|need)|waec\s*(result|scratch)|neco\s*(result|scratch)|olevel\s*(upload|result)|documents?\s*(i\s*)?(need|wan)|wetin\s*i\s*(go|need)\s*upload|which\s*paper\s*(i\s*)?(go|need)\s*carry|passport\s*and\s*nin/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.9, ['other'], 'Documents leftover 120', 'preparing', entities, true)
  }

  if (
    /school\s*(never|no|not)\s*(upload|send)\s*(my\s*)?(name|data|record)|my\s*name\s*(no|not)\s*dey\s*(their|school)\s*(list|portal)|missing\s*(student\s*)?(record|information)|record\s*(no|not)\s*found\s*(for|on)\s*(portal|school)/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.93, ['missing-info'], 'Missing record leftover 120', 'applying', entities, true)
  }

  if (
    /^(so\s*)?(what|wetin)\s*(will|go|should)\s*i\s*do(\s*now)?[.!?\s]*$/i.test(q) ||
    /^(what'?s|wetin\s*be)\s*next[.!?\s]*$/i.test(q) ||
    /^(first\s*step|what\s*should\s*i\s*do\s*now|wetin\s*i\s*go\s*do)[.!?\s]*$/i.test(q)
  ) {
    return hit('official-sources', 0.88, ['other'], 'Next-step fragment 120', 'exploring', entities)
  }

  if (
    /i\s*just\s*dey\s*ask|una\s*dey\s*there|anybody\s*dey|make\s*una\s*yarn\s*me|i\s*wan\s*ask\s*something|can\s*you\s*help\s*with\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['greeting-vague'], 'Vague leftover 120', 'exploring', entities)
  }

  return null
}
