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

  if (PURPOSE_RE.test(raw) || PURPOSE_RE.test(expanded)) {
    return hitIntent('what-is-nelfund', 0.94, ['what-is'], 'What / why NELFUND', 'exploring', entities)
  }

  if (liveOpenRe().test(raw) || liveOpenRe().test(expanded)) {
    return hitIntent('current-information', 0.92, ['open-status', 'current'], 'Live open / deadline', 'exploring', entities)
  }

  if (isPortalDump(raw) || isPortalDump(expanded)) {
    if (/pending|under\s*review|how\s*far|approved|declin/i.test(raw)) {
      return hitIntent('pending-application', 0.86, ['pending-status'], 'Portal dump with status', 'waiting', entities, true)
    }
    if (/invalid\s*jamb|jamb/i.test(raw)) {
      return hitIntent('jamb-verification', 0.86, ['jamb'], 'Portal dump with JAMB', 'applying', entities, true)
    }
    if (/missing\s*information|not\s*on\s*(the\s*)?list/i.test(raw)) {
      return hitIntent('missing-information', 0.86, ['missing'], 'Portal dump missing info', 'applying', entities, true)
    }
  }

  if (/invalid\s*jamb|jamb\s*(no|not|never|invalid|fail)|utme\s*(no|not|invalid)/i.test(raw)) {
    return hitIntent('jamb-verification', 0.9, ['jamb'], 'JAMB invalid / verification', 'applying', entities, true)
  }

  if (/repay|after\s*nysc|nysc.*pay|scholarship|loan\s*or\s*scholarship|na\s*scholarship/i.test(raw) && !/pending|how\s*far|never\s*enter/i.test(raw)) {
    if (/scholarship|grant|free\s*money|loan\s*or\s*scholarship/i.test(raw)) {
      return hitIntent('loan-or-scholarship', 0.88, ['scholarship', 'loan'], 'Loan vs scholarship', 'exploring', entities)
    }
    return hitIntent('repayment', 0.88, ['repayment'], 'Repayment / NYSC', 'repaying', entities)
  }

  if (
    /how\s*far|money\s*(never|no)\s*(enter|drop|show)|still\s*pending|under\s*review|i\s*don\s*apply|when\s*(dem|they|una)\s*(go|will)\s*pay|no\s*alert|approved.{0,24}(no|never|not).{0,16}(money|alert|upkeep)/i.test(
      raw,
    )
  ) {
    return hitIntent('pending-application', 0.9, ['pending-status'], 'Pending / payout wait', 'waiting', entities, true)
  }

  if (/create\s*(account|profile)|sign\s*up|how\s*(to|i\s*go)\s*apply|step\s*by\s*step|walk\s*me/i.test(raw)) {
    return hitIntent('how-to-apply', 0.88, ['how-to-apply'], 'How to apply', 'preparing', entities)
  }

  const soft = residualSoftRoute(expanded || raw, entities)
  if (soft && soft.intent !== 'unknown') return soft

  if (prior && prior !== 'unknown' && raw.length < 48) {
    return hitIntent(prior, 0.55, ['follow-up'], 'Short follow-up keeps prior intent', 'unknown', entities)
  }

  return hitIntent('official-sources', 0.4, ['other'], 'Unclassified residual', 'exploring', entities)
}
