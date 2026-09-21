import type { IntentId, IntentResult } from './types'
import { residualOtherHourly84 } from './residualOtherHourly84'

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
 * Hour-83 leftover catcher. Chains hour-84 first.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: pending-status sentence shapes + leftover other. Never invent pay dates.
 */
export function residualOtherHourly83(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly84(text, entities)
  if (newer) return newer

  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /file\s*(still\s*)?(dey|is)\s*(the\s*)?same|my\s*own\s*(never|no)\s*(show|appear|reflect)|processing\s*since|still\s*dey\s*process|e\s*dey\s*process|wallet\s*(still\s*)?(empty|quiet|zero)|no\s*salary\s*(enter|drop|show)|salary\s*never\s*(enter|drop)|check\s*(my\s*)?dashboard|look\s*(my\s*)?dashboard|status\s*page\s*(no|not|never)\s*(change|move)|loan\s*page\s*(still\s*)?(pending|same)|una\s*process\s*am\s*since|dem\s*dey\s*process\s*am|nothing\s*show\s*for\s*(my\s*)?(bank|wallet|acct)|bank\s*(app|alert)\s*(quiet|empty|nothing)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 83', 'waiting', entities, true)
  }

  if (
    /i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*person\s*go\s*ask|just\s*dey\s*here|i\s*just\s*enter|show\s*options|give\s*options|list\s*wetin\s*you\s*fit\s*do|menu\s*abeg|point\s*me\s*small|i\s*no\s*get\s*question\s*yet/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague menu leftover 83', 'exploring', entities)
  }

  if (
    /jamb\s*(no|not)\s*(dey|show)\s*valid|portal\s*say\s*(my\s*)?jamb\s*(wrong|invalid)|utme\s*number\s*(no|not)\s*gree|caps\s*and\s*jamb\s*(no|not)\s*gree/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 83', 'applying', entities, true)
  }

  if (
    /mail\s*don\s*dey\s*use|this\s*mail\s*na\s*old\s*one|i\s*don\s*use\s*(the\s*)?mail\s*before|cannot\s*register\s*(this|dis)\s*(mail|email)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email leftover 83', 'applying', entities, true)
  }

  if (
    /school\s*name\s*(no|not)\s*dey|poly\s*no\s*dey\s*list|college\s*no\s*dey\s*(the\s*)?list|my\s*uni\s*no\s*show/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 83', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*refund|dem\s*go\s*refund|i\s*don\s*pay\s*school\s*myself/i.test(low) &&
    !/pending|how\s*far|never\s*enter/.test(low)
  ) {
    return hit('refund', 0.9, ['refund'], 'Refund leftover 83', 'waiting', entities, true)
  }

  return null
}
