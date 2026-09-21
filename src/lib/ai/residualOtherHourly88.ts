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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-88 leftover catcher for residual other.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Pidgin + vague help first. Never dump live status on greetings.
 */
export function residualOtherHourly88(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /email\s*(i\s*)?(used|use)\s*(last|las)\s*year|last\s*year\s*(i\s*)?(register|registered|sign)/i.test(q) ||
    /already\s*(get|got|have)\s*(an?\s*)?account|i\s*don\s*(register|sign\s*up)\s*(before|last)/i.test(q)
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used last year leftover 88', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on|in)\s*(the\s*)?(list|portal)|my\s*school\s*(no|not)\s*(there|dey)|institution\s*(not|no)\s*(found|listed)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 88', 'applying', entities, true)
  }

  if (
    /\brepay(ment)?\b|how\s*(do\s*i|to)\s*pay\s*(back|am)|when\s*(do\s*i|to)\s*(start\s*)?pay(ing)?\s*back|gsi|salary\s*deduct/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 88', 'repaying', entities, false)
  }

  if (
    /i\s*dey\s*(stranded|lost|confused|blank|here)|una\s*fit\s*(yarn|help|guide)\s*me\s*(small|abeg)?|i\s*no\s*get\s*(idea|clue)|make\s*(you|una)\s*help\s*me|i\s*just\s*enter\s*(here|this\s*place)|wetin\s*dey\s*(this|dis)\s*place|i\s*wan\s*ask\s*(something|one\s*thing)|kindly\s*attend\s*to\s*me|i\s*need\s*(orientation|direction)|nelfund\s*help\s*desk|who\s*(i|do\s*i)\s*go\s*ask|i\s*dey\s*find\s*(direction|help)|abeg\s*direct\s*me|i\s*no\s*know\s*where\s*to\s*start|pls\s*orient\s*me|can\s*someone\s*help\s*me\s*(here|abeg)|i\s*just\s*need\s*(guidance|direction)|wetin\s*una\s*dey\s*do\s*here|i\s*dey\s*find\s*who\s*go\s*explain/i.test(
      q,
    )
  ) {
    return hit(
      'official-sources',
      0.92,
      ['other', 'vague-help'],
      'Vague Pidgin help leftover 88',
      'exploring',
      entities,
      false,
    )
  }

  if (
    /^(pls|please|abeg|ehn|ehen|hmm+|ok\s*abeg|help\s*desk|assist)\??$|^i\s*wan\s*ask\??$|^who\s*go\s*help\??$/i.test(
      q,
    )
  ) {
    return hit(
      'official-sources',
      0.9,
      ['other', 'greeting-vague'],
      'Tiny vague leftover 88',
      'exploring',
      entities,
      false,
    )
  }

  if (
    /pending|under\s*review|money\s*(never|no)|how\s*far\s*(my|with)|jamb|utme|school\s*(not|no)\s*(show|dey)|email\s*(already|used)|repay/i.test(
      low,
    )
  ) {
    return null
  }

  return null
}
