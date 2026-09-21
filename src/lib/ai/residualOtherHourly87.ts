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
 * Hour-87 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status + JAMB verification sentence shapes that still fall into other/unknown.
 */
export function residualOtherHourly87(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null

  if (
    /application\s*(is\s*)?(still\s*)?(pending|processing)|status\s*(is\s*|still\s*)?(pending|processing)|still\s*processing|file\s*(no|not|never)\s*(move|change)|has\s*(my\s*)?(loan|application)\s*been\s*process|they\s*have\s*not\s*paid\s*me\s*yet|not\s*paid\s*me\s*yet|when\s*(will|go)\s*(the\s*)?(money|alert|upkeep)\s*(reflect|show|enter)|account\s*(no|not|never)\s*(credit|credited)\s*yet|batch\s*(no|not|never)\s*(include|contain)\s*me|i\s*no\s*see\s*(my\s*)?name\s*(for|on|in)\s*(the\s*)?(pay|payment)\s*list|e\s*never\s*show\s*(for|on)\s*(dashboard|portal)|processing\s*(for\s*)?(weeks?|months?)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.92,
      ['pending-status'],
      'Pending processing leftover 87',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /how\s*far\s*(with\s*)?(my\s*)?(own|file|matter)|my\s*own\s*(na\s*)?wetin|wetin\s*(dey\s*)?happen\s*to\s*my\s*own|my\s*matter\s*(no|not|never)\s*(move|clear)|una\s*don\s*see\s*my\s*file|have\s*you\s*(guys\s*)?(seen|processed)\s*my\s*(file|application)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'how-far'],
      'How far my own leftover 87',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no|never)\s*(valid|correct|gree|work)|verification\s*failed\s*(on\s*)?(jamb|utme)|jamb\s*(verification\s*)?(fail|failed|reject)|utme\s*(no|not|never)\s*(valid|gree)|jamb\s*reg\s*(no|not)\s*(valid|correct)|portal\s*(say|says|dey\s*talk)\s*(invalid|wrong)\s*jamb/i.test(
      q,
    )
  ) {
    return hit(
      'jamb-verification',
      0.93,
      ['jamb'],
      'Invalid JAMB leftover 87',
      'applying',
      entities,
      true,
    )
  }

  return null
}
