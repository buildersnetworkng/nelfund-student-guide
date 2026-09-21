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
 * Hour-104 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes that still land as other.
 */
export function residualOtherHourly104(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /my\s*(application|app|loan|file)\s*(is|na|dey)\s*(still\s*)?(pending|processing|under\s*review)/i.test(q) ||
    /application\s*(is|na)\s*pending/i.test(q) ||
    /how\s*far\s*(with\s*)?(my\s*)?(own|loan|app|application|file)/i.test(q) ||
    /how\s*far\s*my\s*own/i.test(q) ||
    /money\s*(never|no|not)\s*(enter|drop|land|show)/i.test(q) ||
    /status\s*(still|stil)\s*(processing|pending|same|review)/i.test(q) ||
    /status\s*still\s*processing/i.test(q) ||
    /e\s*never\s*(enter|drop|land)\s*(my\s*)?(account|bank|phone)/i.test(q) ||
    /nothing\s*(has\s*)?(entered|dropped|shown)\s*(since|after)/i.test(q) ||
    /i\s*(applied|submitted)\s*.{0,20}(still|nothing|no\s*update)/i.test(q) ||
    /waiting\s*(for|on)\s*(payment|disbursement|upkeep|approval)/i.test(q) ||
    /any\s*(news|update)\s*(on|about)\s*my\s*(loan|application|file)/i.test(q) ||
    /has\s*(my\s*)?(loan|application)\s*(been\s*)?(approved|paid|processed)/i.test(q) ||
    /they\s*(have\s*)?(not|never)\s*(paid|credited)\s*me/i.test(q) ||
    /roommate|course\s*mates?\s*(don|have)\s*(collect|receive|get)/i.test(q) ||
    /dashboard\s*(still\s*)?(shows?|showing)\s*(0|zero|pending)/i.test(q) ||
    /upkeep\s*(never|no|not)\s*(enter|drop|land|show)/i.test(q) ||
    /school\s*fees?\s*(never|no)\s*(clear|pay|paid)/i.test(q)
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 104', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number|reg|regno|reg\s*no)\s*(is|na|not|no)\s*(valid|invalid|wrong)/i.test(q) ||
    /invalid\s*jamb/i.test(q) ||
    /jamb\s*number\s*not\s*valid/i.test(q) ||
    /verification\s*failed\s*(on\s*)?jamb/i.test(q) ||
    /jamb\s*verification\s*(fail|failed|error)/i.test(q)
  ) {
    return hit('jamb-verification', 0.95, ['jamb'], 'JAMB leftover 104', 'applying', entities, true)
  }

  if (
    /email\s*(already|has\s*already)\s*(been\s*)?(used|taken|registered)/i.test(q) ||
    /cannot\s*create\s*(an?\s*)?account\s*with\s*(this|that)\s*email/i.test(q) ||
    /i\s*registered\s*(last\s*)?year/i.test(q) ||
    /this\s*mail\s*(don|already)\s*(dey|exist)/i.test(q)
  ) {
    return hit('portal-login', 0.94, ['login', 'email-used'], 'Email used leftover 104', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing/i.test(q) ||
    /my\s*school\s*no\s*dey\s*(the\s*)?list/i.test(q) ||
    /institution\s*(missing|not\s*on)\s*(the\s*)?(portal|list)/i.test(q)
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 104', 'applying', entities, true)
  }

  return null
}
