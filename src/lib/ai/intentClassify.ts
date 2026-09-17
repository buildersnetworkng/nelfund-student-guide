import type { IntentResult, ConversationTurn } from './types'
import {
  detectEntities,
  expandWithContext,
  isPortalDump,
  lastUserIntent,
  residualSoftRoute,
} from './residualRoute'
import { PURPOSE_RE, liveOpenRe, lastUtterance } from './intent'

export function isPurposeAsk(text: string): boolean {
  const q = lastUtterance(text)
  if (!q) return false
  if (liveOpenRe().test(q) && !PURPOSE_RE.test(q)) return false
  return PURPOSE_RE.test(q)
}

function hitIntent(
  intent: IntentResult['intent'],
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

export function classifyIntent(text: string, history?: ConversationTurn[]): IntentResult {
  const raw = lastUtterance(text)
  const expanded = expandWithContext(raw, history)
  const entities = detectEntities(`${raw} ${expanded}`)
  const prior = lastUserIntent(history)

  if (!raw.trim()) {
    return hitIntent('official-sources', 0.4, ['empty'], 'Empty message', 'unknown', entities)
  }

  // Live open/closed must beat purpose (e.g. is nelfund loan application open)
  if (liveOpenRe().test(raw) || liveOpenRe().test(expanded)) {
    return hitIntent('current-information', 0.92, ['open-status', 'current'], 'Live open / deadline', 'exploring', entities)
  }

  if (PURPOSE_RE.test(raw) || PURPOSE_RE.test(expanded)) {
    return hitIntent('what-is-nelfund', 0.94, ['what-is'], 'What / why NELFUND', 'exploring', entities)
  }

  if (isPortalDump(raw) || isPortalDump(expanded)) {
    if (/pending|under\s*review|how\s*far|approved|declin/i.test(raw)) {
      return hitIntent('pending-application', 0.86, ['pending-status'], 'Portal dump with status', 'waiting', entities, true)
    }
    if (/invalid\s*jamb|jamb/i.test(raw)) {
      return hitIntent('jamb-verification', 0.86, ['jamb'], 'Portal dump with JAMB', 'applying', entities, true)
    }
    if (/missing\s*information|not\s*on\s*(the\s*)?list/i.test(raw)) {
      return hitIntent('missing-information', 0.84, ['missing-info'], 'Portal dump missing info', 'applying', entities, true)
    }
  }

  const residual = residualSoftRoute(expanded || raw, entities)
  if (residual) return residual

  if (prior && prior !== 'unknown') {
    return hitIntent(prior, 0.55, ['follow-up'], 'Follow-up on prior intent', 'exploring', entities)
  }

  return hitIntent('unknown', 0.35, ['unknown'], 'Unclassified', 'unknown', entities)
}
