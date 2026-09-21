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
 * Hour-85 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes (formal, Pidgin, fragments, money-wait).
 */
export function residualOtherHourly85(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|pay|show)|processing|money/.test(low)) return null

  if (
    /my\s*(application|loan|file|own)\s*(is|na|dey|still)\s*(pending|processing|under\s*review)|application\s*(is\s*)?(still\s*)?(pending|processing)|status\s*(is\s*)?(still\s*)?(pending|processing|under\s*review)|still\s*(pending|processing)\s*(abeg|pls|please|now)?|e\s*still\s*dey\s*(pending|process)|na\s*(pending|processing)\s*(i\s*)?(see|dey)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending or processing leftover 85', 'waiting', entities, true)
  }

  if (
    /how\s*far\s*(my\s*)?(own|one|application|loan|file|nelfund)|my\s*(own|one)\s*how\s*far|wetin\s*(dey\s*)?happen\s*(to\s*)?(my\s*)?(own|loan|file|application)|any\s*(news|update)\s*(on|for)\s*(my\s*)?(loan|application|own)|una\s*see\s*my\s*(file|own)\s*(at\s*all)?/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'how-far'], 'How far my own leftover 85', 'waiting', entities, true)
  }

  if (
    /money\s*(never|no|not)\s*(enter|drop|show|come|dey|land)|e\s*never\s*(enter|drop|land)|nothing\s*don\s*(drop|enter|show|land)|no\s*(money|alert|credit)\s*(don\s*)?(enter|drop|show)|account\s*(still\s*)?(quiet|empty|zero)|mates?\s*(don|have)\s*(collect|receive|see)\s*(i|me)\s*(never|no)|everybody\s*(don|has)\s*(collect|receive)\s*(except\s*)?(me|i)/i.test(
      q,
    ) && !liveish(q)
  ) {
    return hit('pending-application', 0.94, ['pending-status', 'money-never-enter'], 'Money never enter leftover 85', 'waiting', entities, true)
  }

  if (
    /batch\s*(no|not|never)\s*(reach|come|include)\s*me|i\s*(no|not)\s*(dey|am)\s*(for|in)\s*(the\s*)?batch|dem\s*(skip|forget|leave)\s*(my\s*)?(name|file|own)|zero\s*(for|on)\s*(dashboard|portal)|dashboard\s*(still\s*)?(0|zero|blank)|total\s*loans?\s*(na\s*)?(0|zero)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'batch'], 'Batch or dashboard zero leftover 85', 'waiting', entities, true)
  }

  if (
    /submitted\s*(but|and)\s*(no|never|nothing)\s*(news|update|pay|alert)|i\s*don\s*submit\s*(but|and)\s*(nothing|no\s*news)|apply\s*(finish|done)\s*(but|and)\s*(e\s*)?(never|no)\s*(move|pay)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'submitted-quiet'], 'Submitted no news leftover 85', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|number|reg)\s*(is\s*)?(invalid|not\s*valid|wrong)|invalid\s*jamb|verification\s*(failed|fail)\s*(on\s*)?(jamb|utme)|jamb\s*(verification\s*)?(failed|fail)|utme\s*(no|number)\s*(no|not)\s*(valid|gree)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'Invalid JAMB leftover 85', 'applying', entities, true)
  }

  if (
    /email\s*(already|don)\s*(used|exist|dey)|i\s*registered\s*(last\s*)?(year|session)|cannot\s*create\s*(an?\s*)?account\s*(with\s*)?(this|dis)\s*(email|mail)|this\s*email\s*(is\s*)?(already|taken)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Email used leftover 85', 'applying', entities, true)
  }

  if (
    /school\s*(not|no)\s*(showing|dey|show)|my\s*school\s*(no|not)\s*dey\s*(list|there)|institution\s*(missing|no\s*dey)\s*(on\s*)?(portal|list)|i\s*no\s*see\s*my\s*school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School not showing leftover 85', 'applying', entities, true)
  }

  return null
}
