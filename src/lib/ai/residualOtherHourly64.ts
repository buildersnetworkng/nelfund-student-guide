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
 * Hour-64 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: disbursement / how-far-my-own / batch / processing that still leak as other.
 */
export function residualOtherHourly64(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(nelfund|this|dis)\s*(mean|be)|nelfund\s*(na\s*)?(wetin|kwa)|explain\s*(am|this\s*thing)|why\s*(this|dis)\s*loan\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is'], 'Purpose leftover 64', 'exploring', entities)
  }

  if (
    /(loan|upkeep|application)\s*(window|portal)\s*(open|close)|dem\s*don\s*announce|as\s*of\s*today.{0,20}(open|close)|una\s*still\s*dey\s*receive|deadline\s*(for\s*)?(apply|loan)|closing\s*date/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'current'], 'Open leftover 64', 'exploring', entities)
  }

  if (
    /how\s*far\s*(na\s*)?(my\s*)?(own|loan|application|file|upkeep)|my\s*(own|loan|money|upkeep)\s*(never|no)\s*(show|enter|drop|land|come)|dem\s*don\s*approve.{0,24}(no|never)\s*(pay|alert)|approved\s*but\s*(no|not|never)\s*(pay|disburse)|disburse(ment)?|which\s*batch|next\s*batch|processing\s*(since|still)|under\s*review\s*(since|still)|i\s*don\s*apply\s*since|submitted\s*(last|since)|alert\s*never\s*(come|drop|enter)|money\s*never\s*(show|enter|drop)|when\s*(dem|una|they)\s*(go|will)\s*(pay|release|send)|no\s*credit\s*(alert|enter)|status\s*(na|is)\s*(processing|submitted|received)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 64', 'waiting', entities, true)
  }

  if (
    /invalid\s*(jamb|utme)|jamb\s*(verification|verify)\s*(fail|failed|error)|jamb\s*(no|not)\s*(verify|match|correct)|registration\s*number\s*(invalid|wrong)|caps\s*(reject|mismatch)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 64', 'applying', entities, true)
  }

  if (
    /email\s*(already|has\s*been)\s*(used|taken|registered)|registered\s*last\s*year|use\s*(the\s*)?old\s*(mail|email|account)|cannot\s*create\s*(new\s*)?account/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 64', 'applying', entities, true)
  }

  if (
    /my\s*school\s*(name\s*)?(no|not|never)\s*(dey|show)|school\s*search\s*(empty|blank)|institution\s*dropdown\s*(empty|blank)|select\s*institution\s*(no|not)\s*(gree|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 64', 'applying', entities, true)
  }

  return null
}
