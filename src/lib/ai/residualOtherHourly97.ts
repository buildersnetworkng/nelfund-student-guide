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
 * Hour-97 leftover catcher.
 * Live 2026-09-21 17:21Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending / how-far / money-never-enter sentence shapes that still land unknown.
 */
export function residualOtherHourly97(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*(application|file|loan|own)\s*(is|dey|still)\s*(pending|processing|under\s*review)|application\s*(is\s*)?pending|status\s*(is\s*|still\s*)?(processing|pending|under\s*review)|how\s*far(\s*(my|na)\s*(own|loan|application|file))?|money\s*(never|no|not)\s*(enter|drop|show|land|come)|alert\s*(never|no|not)\s*(enter|drop|show|come)|e\s*(never|no)\s*(drop|enter|show|move)|file\s*(no|never)\s*gree\s*move|dashboard\s*(still\s*)?(0|zero|empty|blank)|total\s*(loan|amount).{0,12}(0|zero)|approved\s*(but|and)\s*(no|never|not)\s*(money|alert|pay)|una\s*(don|have)\s*pay\s*(my\s*)?(mates|class|others)|mates\s*(don|have)\s*(collect|receive)|class\s*(don|have)\s*(collect|receive)|when\s*(dem|they|una)\s*(go|will)\s*(credit|pay|release)\s*(me|am)|processing\s*since|pending\s*since|under\s*review\s*since|status\s*never\s*(change|move)|nothing\s*(don|has)\s*(drop|enter)|i\s*check(ed)?\s*(my\s*)?(portal|dashboard|status)|no\s*credit\s*(alert|yet)|account\s*never\s*credit|upkeep\s*(never|no)\s*(enter|drop)|tuition\s*(never|no)\s*(pay|enter)|school\s*fees?\s*(never|no)\s*(enter|pay)|wetin\s*dey\s*happen\s*to\s*my\s*(loan|file|own)|my\s*own\s*never\s*(show|enter|drop)|how\s*far\s*now\s*(abeg|pls)?|status\s*still\s*the\s*same|e\s*still\s*dey\s*the\s*same\s*place/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 97', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|correct|dey)|verification\s*(failed|fail)\s*(on\s*)?(jamb|utme)|jamb\s*(no|not)\s*gree|utme\s*(no|not)\s*(valid|correct)|caps\s*(no|not)\s*(match|gree)|jamb\s*wahala|wrong\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 97', 'applying', entities, true)
  }

  if (
    /email\s*already\s*(used|in\s*use|registered)|i\s*register(ed)?\s*last\s*year|cannot\s*create\s*account\s*with\s*(this|dis)\s*(email|mail)|mail\s*don\s*dey\s*use|this\s*(email|mail)\s*(has\s*)?already/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 97', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|show|dey)|my\s*school\s*no\s*dey(\s*list)?|institution\s*(missing|not\s*on)|school\s*no\s*dey\s*(the\s*)?list|cannot\s*find\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School list leftover 97', 'applying', entities, true)
  }

  return null
}
