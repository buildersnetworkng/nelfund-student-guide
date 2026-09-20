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
 * Hour-66 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending paraphrases that still leak as other (how far my own, money never enter,
 * status still processing, check am, e never reflect).
 */
export function residualOtherHourly66(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /how\s*far(\s*(my|na|now|abeg|una|dis|this))?(\s*(own|loan|application|file|nelfund|am|money))?|my\s*own\s*(never|no|not|dey|still)|money\s*(never|no|not|never)\s*(enter|drop|show|land|reflect)|e\s*never\s*(enter|drop|show|reflect|land)|status\s*(still|dey|is)\s*(processing|pending|review|the\s*same)|still\s*(processing|pending|under\s*review)|application\s*(is|dey|still)\s*(pending|processing)|check\s*(my\s*)?(own|status|loan|file)|una\s*don\s*see\s*my\s*(own|file)|wetin\s*sup\s*(with\s*)?(my\s*)?(loan|own|file)|e\s*never\s*show\s*for\s*(account|bank)|account\s*never\s*(alert|credit)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 66', 'waiting', entities, true)
  }

  if (
    /wetin\s*be\s*(this|dis|nelfund)|explain\s*this\s*loan|why\s*dem\s*create\s*am|purpose\s*of\s*(the\s*)?scheme/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is'], 'Purpose leftover 66', 'exploring', entities)
  }

  if (
    /loan\s*application\s*open\s*as\s*of\s*today|dem\s*still\s*dey\s*accept|when\s*is\s*(the\s*)?deadline|is\s*nelfund\s*open/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.94, ['open-status'], 'Open leftover 66', 'exploring', entities)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(not|no)\s*(valid|gree)|verification\s*failed\s*(on\s*)?jamb/i.test(q)
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 66', 'applying', entities, true)
  }

  if (
    /email\s*already\s*used|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*with\s*this\s*email/i.test(q)
  ) {
    return hit('portal-login', 0.94, ['login'], 'Login leftover 66', 'applying', entities, true)
  }

  if (
    /school\s*not\s*showing|my\s*school\s*no\s*dey\s*list|institution\s*missing\s*(on\s*)?portal/i.test(q)
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School leftover 66', 'applying', entities, true)
  }

  return null
}
