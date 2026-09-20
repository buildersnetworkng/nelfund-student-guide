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

/**
 * Hour-67 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: other-bucket Pidgin + vague help (short menu), never a live status dump.
 */
export function residualOtherHourly67(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /how\s*far(\s*(with|about|on))?\s*(my\s*)?(loan|application|file|own)|e\s*still\s*dey\s*(pending|review)|my\s*file\s*(never|no)\s*(move|change)|una\s*don\s*process\s*my\s*own|when\s*go\s*my\s*own\s*enter|status\s*no\s*gree\s*change|processing\s*since\s*(january|last|weeks)|check\s*am\s*for\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 67', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not|never)\s*(gree|work|verify)|utme\s*(number\s*)?(invalid|fail)|caps\s*(no|not)\s*gree|jamb\s*wahala|verify\s*my\s*jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 67', 'applying', entities, true)
  }

  if (
    /is\s*(the\s*)?(loan|portal|window)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*collect\s*(form|application)|closing\s*date\s*for\s*(nelfund|loan)|when\s*nelfund\s*go\s*open\s*again/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.94, ['open-status'], 'Open leftover 67', 'exploring', entities)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*(back|am)|repay(ment)?\s*(start|begin)|after\s*nysc\s*(i\s*)?(go\s*)?pay|interest\s*on\s*(the\s*)?loan|when\s*repayment\s*start/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.94, ['repayment'], 'Repay leftover 67', 'repaying', entities)
  }

  if (
    /school\s*(no|not)\s*dey\s*(the\s*)?(list|portal)|institution\s*no\s*show|search\s*(my\s*)?school\s*(no|not)\s*(show|come)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School leftover 67', 'applying', entities, true)
  }

  if (
    /email\s*(don\s*)?(already\s*)?(use|used|exist)|i\s*register(ed)?\s*last\s*year|sign\s*in\s*no\s*gree|forgot\s*password\s*abeg/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Login leftover 67', 'applying', entities, true)
  }

  if (
    /^(abeg\s*)?(help|assist|guide)\s*(me)?\s*(abeg|pls|please)?\.?$|una\s*fit\s*(help|assist)|i\s*(just\s*)?(need|wan|want)\s*help|pls\s*assist|wetin\s*i\s*(suppose|go)\s*do(\s*now)?\??$|i\s*dey\s*lost|help\s*abeg|i\s*no\s*know\s*where\s*to\s*start|make\s*una\s*guide\s*me|can\s*you\s*help\s*me\??$|i\s*need\s*assistance/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 67', 'exploring', entities)
  }

  return null
}
