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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** Extra leftover routes for the admin unknown topic bucket `other`. */
export function residualOtherRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/\bgsi\b|global\s*standing\s*instruction|standing\s*order|auto[\s-]*debit/i.test(q)) {
    return hit('gsi', 0.86, ['repayment', 'gsi'], 'GSI / standing instruction', 'repaying', entities)
  }
  if (/life\s*imprison|prison|jail|go\s*gaol|go\s*jail|criminal\s*(case|charge)|police\s*go\s*arrest/i.test(q)) {
    return hit('repayment', 0.86, ['repayment', 'penalty-rumour'], 'Penalty / imprisonment rumour', 'repaying', entities)
  }
  if (/refund|dem\s*go\s*return\s*(my\s*)?(school\s*)?fee|get\s*(my\s*)?money\s*back|reimburse/i.test(q)) {
    return hit('refund', 0.8, ['refund', 'fees'], 'Refund after self-pay', 'waiting', entities, true)
  }
  if (/no\s*matric|don.?t\s*have\s*(a\s*)?matric|without\s*matric|admission\s*letter\s*only/i.test(q)) {
    return hit('documents-needed', 0.82, ['documents', 'matric'], 'No matric number yet', 'preparing', entities)
  }
  if (/without\s*jamb|no\s*jamb|don.?t\s*have\s*(a\s*)?jamb|apply\s*without\s*utme/i.test(q)) {
    return hit('jamb-verification', 0.8, ['jamb'], 'Apply without JAMB leftover', 'preparing', entities, true)
  }
  if (/2025\s*\/\s*2026|2024\s*\/\s*2025|this\s*academic\s*session|which\s*session/i.test(q) && !liveish(q)) {
    return hit('academic-session', 0.8, ['session'], 'Which academic session leftover', 'preparing', entities)
  }
  if (/apply\s*again|re-?apply|second\s*round|renew\s*(the\s*)?loan/i.test(q) && !liveish(q)) {
    return hit('reapplication', 0.8, ['how-to-apply', 'reapply'], 'Re-apply / next session leftover', 'preparing', entities)
  }
  if (/vocational|skills?\s*acquisition|innovation\s*enterprise|iea|monotechnic/i.test(q)) {
    return hit('eligibility', 0.8, ['eligibility', 'vocational'], 'Vocational / skills school leftover', 'exploring', entities)
  }
  if (/^(abeg(\s*check(\s*am)?)?|check\s*am|look\s*am|una\s*don\s*pay|don\s*pay\s*\??)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.7, ['pending-status'], 'Short pidgin check / pay ask', 'waiting', entities, true)
  }
  return null
}
