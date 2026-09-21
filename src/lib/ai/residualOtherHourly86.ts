import type { IntentId, IntentResult } from './types'
import { residualOtherHourly87 } from './residualOtherHourly87'

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
 * Hour-86 leftover catcher for residual other bucket.
 * Chains hour-87 pending/JAMB shapes first.
 */
export function residualOtherHourly86(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  const later = residualOtherHourly87(text, entities)
  if (later) return later

  if (
    /pending|under\s*review|money\s*(never|no)|how\s*far\s*(my|with)|jamb|utme|school\s*(not|no)\s*(show|dey)|email\s*(already|used)|repay/i.test(
      low,
    )
  ) {
    return null
  }

  if (
    /abeg\s*(help|assist|guide|yarn)\s*(me)?\s*(small|na|abeg)?|help\s*me\s*(small|abeg|na)|i\s*no\s*sabi\s*(how|wetin|anything)?|i\s*dey\s*(lost|confused|blank)|make\s*una\s*(help|guide|yarn)|yarn\s*me\s*(the\s*)?(gist|brief|thing)|wetin\s*i\s*(suppose|go|fit)\s*do\s*(first|now|sef)?|how\s*e\s*take\s*(start|be)|kindly\s*assist(\s*me)?(\s*wrt|\s*with)?|i\s*just\s*(wan|want|need)\s*(ask|help|guide)|orient(ate)?\s*me|brief\s*me\s*(small|quick|short)?|show\s*me\s*(the\s*)?(way|menu|steps)\s*(abeg)?|any\s*(small\s*)?help\s*(on|with)?\s*(nelfund|dis|this)?|guide\s*me\s*(small|abeg)|i\s*need\s*(ya|your)?\s*assistance|una\s*fit\s*help\s*me\s*(small)?|pls\s*help\s*me\s*(understand|start)|please\s*just\s*(help|guide)\s*me/i.test(
      q,
    )
  ) {
    return hit(
      'official-sources',
      0.92,
      ['other', 'vague-help'],
      'Vague Pidgin or help leftover 86',
      'exploring',
      entities,
      false,
    )
  }

  if (
    /^(help|assist|guide|confused|lost|orient|brief)\s*(me|abeg|pls|please)?\??$|^i\s*need\s*help\??$|^help\s*abeg\??$|^wetin\s*(now|sef)\??$/i.test(
      q,
    )
  ) {
    return hit(
      'official-sources',
      0.91,
      ['other', 'greeting-vague'],
      'Tiny vague help leftover 86',
      'exploring',
      entities,
      false,
    )
  }

  if (
    /how\s*(do\s*i|to)\s*(start|begin)\s*(with\s*)?(nelfund|this|dis)?|where\s*(do\s*i|i\s*go)\s*begin|first\s*thing\s*(to\s*)?do\s*(for|with)\s*(nelfund|loan)|i\s*wan\s*start\s*(nelfund|am)\s*(abeg)?/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.93, ['other', 'how-to-apply'], 'Start NELFUND leftover 86', 'applying', entities, false)
  }

  return null
}
