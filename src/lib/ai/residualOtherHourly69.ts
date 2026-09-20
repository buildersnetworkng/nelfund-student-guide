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
 * Hour-69 leftover catcher.
 * Live 2026-09-20 16:04Z: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30.
 * New shapes for pending (largest named unknown after other), plus leftover jamb / open / login / school.
 */
export function residualOtherHourly69(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /dashboard\s*(still\s*)?(show(ing)?|dey)\s*(0|zero|nil)|mates?\s*(don|have)\s*(collect|collecte|collecte?d|receive)|under\s*review\s*(for\s*)?(months?|weeks?)|approval\s*dey\s*sleep|have\s*they\s*paid\s*my\s*school|has\s*nelfund\s*released\s*my\s*(money|upkeep|loan)|nothing\s*don\s*show\s*(for|on)\s*(my\s*)?(account|bank)|e\s*still\s*dey\s*review|status\s*no\s*change\s*since|they\s*paid\s*my\s*school\s*but|school\s*don\s*collect\s*(but\s*)?i\s*never|no\s*alert\s*since\s*i\s*apply|file\s*still\s*under\s*review|when\s*go\s*my\s*(own|money)\s*enter/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 69', 'waiting', entities, true)
  }

  if (
    /jamb\s*(number|reg|regno)\s*(reject|rejected|no\s*gree)|invalid\s*utme|verification\s*failed\s*(on\s*)?(jamb|utme)|caps\s*no\s*align|old\s*year\s*jamb\s*(no|not)\s*work|direct\s*entry\s*jamb\s*(fail|wahala)|jamb\s*dem\s*say\s*invalid/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 69', 'applying', entities, true)
  }

  if (
    /as\s*of\s*today\s*(is\s*)?(am|it)\s*open|loan\s*application\s*open\s*as\s*of|dem\s*still\s*dey\s*accept|una\s*still\s*dey\s*take\s*(form|application)|window\s*don\s*close\s*or\s*not|when\s*be\s*the\s*deadline\s*(for\s*)?(this\s*)?(year|cycle)|is\s*2026\s*(loan|upkeep)\s*open/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.94, ['open-status'], 'Open leftover 69', 'exploring', entities)
  }

  if (
    /email\s*(already\s*)?(used|exist|exists)|i\s*registered\s*last\s*year|cannot\s*create\s*account\s*with\s*this\s*email|mail\s*don\s*dey\s*for\s*system|old\s*account\s*no\s*gree\s*open|forgot\s*last\s*year\s*password/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Login leftover 69', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*list|my\s*school\s*no\s*dey\s*(the\s*)?list|institution\s*missing\s*on\s*portal|search\s*no\s*bring\s*(my\s*)?school|poly\s*no\s*dey\s*show|coe\s*no\s*dey\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School leftover 69', 'applying', entities, true)
  }

  if (
    /^(help|assist|guide)\s*(me)?\s*(abeg|pls|please)?\.?$|i\s*no\s*know\s*where\s*to\s*start|wetin\s*i\s*suppose\s*do\s*first|point\s*me\s*where\s*to\s*start|confused\s*about\s*nelfund/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 69', 'exploring', entities)
  }

  return null
}
