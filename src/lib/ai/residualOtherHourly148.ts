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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 148 2026-09-23: pending-status leftover + other fragments.
 * Formal, casual, Pidgin, typos. Never invent policy or dates.
 */
export function residualOtherHourly148(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /application\s*still\s*(on\s*)?(hold|queue)|file\s*(still\s*)?(on\s*)?(hold|queue)|queue\s*no\s*move|hold\s*no\s*clear|review\s*no\s*finish|dem\s*never\s*approve\s*me|approval\s*never\s*show|my\s*name\s*never\s*(show|appear)\s*(for|on)\s*(pay|list|batch)|i\s*submit\s*(finish|already).{0,20}(nothing|pending|no\s*money)|submitted\s*(but|and)\s*(nothing|pending)|portal\s*say\s*processing|e\s*dey\s*process\s*since|process\s*no\s*end|how\s*far\s*una\s*go\s*(with\s*)?(my\s*)?(own|file)|any\s*movement\s*(for|on)\s*my\s*(file|own)|my\s*own\s*never\s*leave\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 148', 'waiting', entities, true)
  }

  if (
    /they\s*paid\s*(everyone|everybody|others)\s*(except|but)\s*me|everybody\s*(except|but)\s*me|all\s*my\s*mates\s*(except|but)\s*me|class\s*list\s*(don|has)\s*pay|i\s*remain\s*for\s*pending|left\s*behind\s*for\s*(pay|pending)|una\s*don\s*settle\s*others/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Left behind pending 148', 'waiting', entities, true)
  }

  if (
    /email\s*already\s*in\s*use|this\s*email\s*exists|mail\s*has\s*been\s*taken|cannot\s*create\s*(an?\s*)?account\s*with\s*this\s*email|i\s*registered\s*last\s*year|used\s*this\s*mail\s*last\s*cycle|old\s*portal\s*mail/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email used 148', 'applying', entities, true)
  }

  if (
    /jamb\s*(id|reg)\s*(is\s*)?(invalid|rejected)|verification\s*failed\s*(on|for)\s*jamb|portal\s*reject\s*(my\s*)?jamb|caps\s*verification\s*fail/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB residual 148', 'applying', entities, true)
  }

  if (
    /my\s*school\s*no\s*dey\s*(the\s*)?(list|dropdown)|institution\s*missing\s*on\s*portal|search\s*school\s*(no|not)\s*(show|work)|cannot\s*select\s*(my\s*)?(uni|school|poly)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list 148', 'applying', entities, true)
  }

  if (
    /i\s*no\s*know\s*where\s*to\s*put\s*my\s*mouth|i\s*dey\s*look\s*una|make\s*una\s*open\s*mouth|yarn\s*me\s*something\s*small|i\s*come\s*online\s*now|first\s*time\s*i\s*dey\s*here|show\s*me\s*the\s*menu\s*again|what\s*kind\s*help\s*una\s*get|una\s*cover\s*which\s*topics|i\s*need\s*a\s*map\s*of\s*topics|point\s*the\s*headings|i\s*wan\s*see\s*options\s*again|help\s*desk\s*menu|student\s*help\s*menu/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague other menu 148', 'exploring', entities)
  }

  return null
}
