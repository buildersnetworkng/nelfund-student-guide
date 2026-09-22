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
 * Hourly 124 2026-09-22: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other = more Pidgin + vague help, never live-status dump.
 */
export function residualOtherHourly124(text: string, entities: string[]): IntentResult | null {
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
    /^(help|assist|guide)\s*(me)?\s*(na|joor|jo|abeg|pls|please)?\s*[?.!]*$|help\s*me\s*na|guide\s*me\s*joor|kindly\s*assist(\s*me)?|i\s*need\s*assistance\s*(with\s*(this|dis)\s*thing)?|i\s*no\s*sabi\s*anything\s*(for\s*here)?|can\s*you\s*help\s*a\s*student|pls\s*talk\s*to\s*me|make\s*una\s*help\s*me\s*small|how\s*(does\s*)?(this|dis)\s*chat\s*work|what\s*can\s*you\s*do\s*for\s*me|assist\s*abeg|i\s*come\s*for\s*help|hello\s*how\s*(you|una)\s*fit\s*help|una\s*dey\s*\??$|wetin\s*i\s*suppose\s*do\s*first|how\s*una\s*take\s*work|i\s*wan\s*use\s*(this|una)\s*guide|show\s*me\s*where\s*to\s*start\s*abeg|i\s*just\s*need\s*direction|talk\s*me\s*through\s*(am|this)|break\s*am\s*down\s*for\s*me|i\s*dey\s*confused\s*for\s*here|student\s*we\s*no\s*sabi|help\s*confused\s*person|una\s*fit\s*direct\s*me|gimme\s*first\s*step\s*only|short\s*menu\s*abeg|wetin\s*dey\s*for\s*here|i\s*no\s*know\s*wetin\s*to\s*type|what\s*do\s*i\s*ask\s*you|how\s*do\s*i\s*use\s*this\s*(bot|guide|chat)|kindly\s*direct\s*me|i\s*need\s*a\s*nudge|point\s*me\s*small/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.91, ['other', 'greeting-vague'], 'Vague help leftover 124', 'exploring', entities)
  }

  if (
    /my\s*(own|loan|file)\s*(still|stil)\s*(pending|stand|dey)|dem\s*never\s*pay\s*me|i\s*still\s*dey\s*wait\s*(money|alert|cash)|nothing\s*don\s*show\s*(for\s*)?(account|bank)|status\s*(still|stil)\s*(same|pending)|how\s*far\s*my\s*(money|loan|file)|una\s*forget\s*my\s*(own|file)|mates\s*don\s*collect\s*i\s*never|processing\s*since|under\s*review\s*since|no\s*credit\s*alert\s*yet|money\s*no\s*enter\s*at\s*all/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 124', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never)\s*(gree|match|verify)|utme\s*(wahala|error|fail)|admission\s*letter\s*(reject|no\s*gree)|jamb\s*reg\s*(no|number)\s*(wrong|invalid)|caps\s*(no|not)\s*gree|verify\s*my\s*jamb|jamb\s*details\s*(incorrect|reject)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 124', 'applying', entities, true)
  }

  if (
    /email\s*(has\s*been|is)\s*(used|taken)|mail\s*already\s*exist|i\s*use[d]?\s*(this|dat|that)\s*mail\s*last\s*year|register(ed)?\s*last\s*(year|session)|cannot\s*sign\s*up\s*(again|with\s*old\s*mail)|old\s*email\s*(no|not)\s*work|forgot\s*(the\s*)?(login|password)\s*from\s*last\s*year/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 124', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show)\s*(for\s*)?(list|dropdown)|institution\s*(missing|absent)|i\s*no\s*see\s*my\s*(school|uni|poly)|search\s*school\s*(no|nothing)|my\s*campus\s*no\s*dey\s*there/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School missing leftover 124', 'applying', entities, true)
  }

  if (
    /how\s*i\s*go\s*pay\s*(back|am)|repay\s*(the\s*)?(loan|am)|salary\s*deduct|after\s*i\s*graduate\s*(i\s*)?(go|will)\s*pay|nysc\s*finish\s*(how|when)\s*pay|gsi\s*wahala|payback\s*start\s*when/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 124', 'repaying', entities)
  }

  return null
}
