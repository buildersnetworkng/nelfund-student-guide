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
 * Hour-68 leftover catcher.
 * Live 2026-09-20 16:01Z: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Extra sentence shapes: formal, casual, Pidgin, fragments, typos.
 */
export function residualOtherHourly68(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /how\s*fa+r+|e\s*neva\s*(move|change|enter)|my\s*(loan|app|file)\s*(still|stil)\s*(there|dey|pending)|una\s*don\s*see\s*my\s*(file|own)|batch\s*(never|neva|no)\s*(enter|drop)|processing\s*(tire|taya)\s*me|status\s*dey\s*same|i\s*apply\s*since|wetin\s*sup\s*(with|wit)\s*my\s*(loan|own)|no\s*credit\s*alert|money\s*neva\s*show/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.95, ['pending-status'], 'Pending leftover 68', 'waiting', entities, true)
  }

  if (
    /jam[b]?\s*(no|not|neva|never)\s*(correct|gree|work)|utme\s*(no|not)\s*valid|caps\s*issue|jamb\s*(error|errror|wahala)|my\s*jamb\s*(no|not)\s*dey\s*work|verify\s*jamb\s*abeg|jamb\s*reg(istration)?\s*(fail|invalid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.94, ['jamb'], 'JAMB leftover 68', 'applying', entities, true)
  }

  if (
    /loan\s*(window|portal)\s*(still|stil)\s*(open|close)|dem\s*still\s*dey\s*(open|collect)|una\s*still\s*dey\s*collect\s*form|deadline\s*(abeg|pls|please)|when\s*(dem|una)\s*go\s*open\s*(am|again)|is\s*application\s*still\s*on|closing\s*date\s*abeg/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.94, ['open-status'], 'Open leftover 68', 'exploring', entities)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*repay|pay\s*back\s*(the\s*)?loan|after\s*service\s*(year|nysc)|interest\s*rate\s*(abeg|pls)|when\s*(i\s*)?(go|will)\s*start\s*(to\s*)?pay|repayment\s*plan|salary\s*deduct/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.94, ['repayment'], 'Repay leftover 68', 'repaying', entities)
  }

  if (
    /my\s*school\s*(no|not|neva)\s*(dey|show)|institution\s*(missing|absent)|list\s*no\s*carry\s*(my\s*)?school|search\s*school\s*empty|school\s*name\s*no\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.94, ['school-list'], 'School leftover 68', 'applying', entities, true)
  }

  if (
    /mail\s*(don\s*)?(already\s*)?(use|used)|email\s*already\s*taken|i\s*sign\s*up\s*last\s*session|last\s*year\s*account|password\s*no\s*gree|otp\s*no\s*dey\s*come|cannot\s*sign\s*in\s*abeg/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.94, ['login'], 'Login leftover 68', 'applying', entities, true)
  }

  if (
    /^(pls|plz|please|abeg)\s*(help|assist|guide)\s*(me)?\.?$|help\s*(me\s*)?(out|now)\s*(abeg|pls)?\.?$|i\s*need\s*(una|your)\s*help|una\s*fit\s*guide\s*me|make\s*una\s*help\s*me|i\s*no\s*sabi\s*(wetin|where)\s*(to\s*)?start|i\s*just\s*dey\s*confused|assist\s*me\s*abeg|guide\s*me\s*pls|wetin\s*i\s*fit\s*do\s*now\??$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague help leftover 68', 'exploring', entities)
  }

  return null
}
