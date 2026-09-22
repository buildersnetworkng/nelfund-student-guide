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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept/i.test(
    q,
  )
}

/**
 * Hour-118 leftover catcher. Live 2026-09-22: unknownAi 438, other 324, pending-status 70.
 * New sentence shapes for pending wait, email-used login, school list, refund after self-pay.
 */
export function residualOtherHourly118(text: string, entities: string[]): IntentResult | null {
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
    /any\s*(news|update|movement)\s*(on|for|about)\s*(my|dis|this|the)\s*(loan|file|application|own)|has\s*(my|the)\s*loan\s*(been\s*)?(approved|paid|disbursed)|when\s*(will|go)\s*(they|dem|una)\s*(pay|release|credit)\s*(me|my\s*(account|upkeep))|school\s*(don|has|have)\s*(confirm|verified|verify)\s*(me|my)|dashboard\s*(still\s*)?(the\s*)?same|no\s*movement\s*(on|for)\s*(my\s*)?(file|loan|own)|still\s*waiting\s*(for\s*)?(disbursement|alert|credit|upkeep)|they\s*haven'?t\s*paid\s*me|havenot\s*paid\s*me|payment\s*(never|no)\s*(show|enter|drop)|alert\s*(never|no)\s*enter|na\s*pending\s*(i\s*)?(still\s*)?dey|application\s*(never|no)\s*move|my\s*dashboard\s*no\s*change|i\s*apply\s*last\s*(month|week|session)\s*nothing|disbursement\s*status|they\s*said\s*pending|no\s*alert\s*since\s*i\s*apply|check\s*(my\s*)?(application|loan)\s*status|has\s*anything\s*changed\s*(on|for)\s*my|e\s*never\s*leave\s*pending|file\s*never\s*leave\s*(review|pending)|una\s*don\s*forget\s*my\s*own|my\s*mates\s*don\s*collect\s*(theirs|theirs\s*own|theirs)|everybody\s*(don|have)\s*collect\s*except\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 118', 'waiting', entities, true)
  }

  if (
    /email\s*(already|don|has)\s*(used|exist|registered|taken)|this\s*(mail|email)\s*(don|already)\s*(exist|dey|used)|account\s*already\s*(exist|exists|dey)|i\s*registered\s*(this\s*)?(mail|email)\s*last\s*year|cannot\s*create\s*(account|profile)\s*with\s*this\s*(email|mail)|mail\s*already\s*in\s*use|email\s*taken/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.95, ['other'], 'Email used leftover 118', 'applying', entities, true)
  }

  if (
    /my\s*(uni|poly|college|school)\s*(no|not|never)\s*dey|they\s*(no|not)\s*put\s*my\s*school|institution\s*missing|school\s*missing\s*(on|in)\s*(the\s*)?(portal|list)|cannot\s*select\s*(my\s*)?(school|institution)|drop\s*down\s*(no|not)\s*(show|carry)\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School list leftover 118', 'applying', entities, true)
  }

  if (
    /i\s*(already|don)\s*pay\s*(school\s*)?fees|school\s*fees\s*(already|don)\s*pay|want\s*(my\s*)?refund|how\s*(i\s*)?(go|fit)\s*collect\s*(the\s*)?refund|bursary\s*(no|not)\s*(refund|pay)\s*(me|am)|parents\s*(don|have)\s*pay\s*(the\s*)?fees/i.test(
      q,
    )
  ) {
    return hit('refund', 0.93, ['other'], 'Self-paid fees refund 118', 'waiting', entities, true)
  }

  if (
    /i\s*just\s*wan(t)?\s*(the\s*)?loan|how\s*i\s*take\s*apply|show\s*me\s*(the\s*)?steps|where\s*(do\s*)?i\s*start(\s*from)?|i\s*never\s*open\s*(account|portal)|make\s*i\s*apply\s*how|how\s*person\s*take\s*register/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.91, ['other'], 'Apply leftover 118', 'applying', entities)
  }

  if (
    /^(pls|please|abeg)?\s*(hello|hi|hey|good\s*(day|morning|afternoon|evening)|how\s*far)[.!?\s]*$/i.test(q) ||
    /^(what\s*can\s*you\s*do|who\s*are\s*you|wetin\s*you\s*fit\s*do)[.!?\s]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['greeting-vague'], 'Greeting leftover 118', 'exploring', entities)
  }

  return null
}
