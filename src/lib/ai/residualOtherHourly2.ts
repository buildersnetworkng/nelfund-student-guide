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

/** 16 Sep later hourly: leftover admin `other` phrasings that still missed prior residual layers. */
export function residualOtherHourly2(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/interest[\s-]*free|is\s*(there|e get)\s*interest|interest\s*rate|dem\s*go\s*add\s*interest|zero\s*interest/i.test(q)) {
    return hit('loan-or-scholarship', 0.88, ['loan', 'interest'], 'Interest-free leftover', 'exploring', entities)
  }
  if (/how\s*much\s*(dem|they|una|nelfund)?\s*(go|will|dey)\s*(give|pay|send)|how\s*much\s*(be|is)\s*(the\s*)?(upkeep|allowance|loan)|upkeep\s*(na|is)\s*how\s*much/i.test(q) && !liveish(q)) {
    return hit('upkeep', 0.86, ['upkeep', 'amount'], 'How much will they pay leftover', 'exploring', entities)
  }
  if (/parent(s)?\s*(fit|can|wan)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter)|guardian\s*apply|i\s*be\s*parent/i.test(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'parent-apply'], 'Parent applying for child leftover', 'exploring', entities)
  }
  if (/international\s*student|foreign\s*student|i\s*no\s*be\s*nigerian|not\s*a\s*nigerian|i\s*be\s*(ghana|togo|benin)/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'citizenship'], 'Non-Nigerian leftover', 'exploring', entities)
  }
  if (/suspend(ed)?|rusticat|withdraw(n)?\s*from\s*school|i\s*no\s*dey\s*school\s*this\s*session|defer(red)?\s*(my\s*)?(admission|school)/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'not-in-session'], 'Suspended / deferred leftover', 'exploring', entities)
  }
  if (/change\s*of\s*course|i\s*change\s*(my\s*)?course|new\s*department|transfer\s*(to|from)\s*(another\s*)?(dept|department|faculty)/i.test(q)) {
    return hit('profile-update', 0.84, ['profile', 'course-change'], 'Change of course leftover', 'applying', entities, true)
  }
  if (/guarantor|surety|who\s*(go|will)\s*stand\s*for\s*me|i\s*need\s*guarantor/i.test(q)) {
    return hit('guarantor', 0.88, ['guarantor'], 'Guarantor leftover', 'preparing', entities)
  }
  if (/agent\s*(ask|collect|wan)\s*(money|fee)|pay\s*(an?\s*)?agent|whatsapp\s*(agent|link)|telegram\s*portal|processing\s*fee/i.test(q)) {
    return hit('scam-safety', 0.9, ['scam'], 'Agent / processing fee leftover', 'exploring', entities, true)
  }
  if (/how\s*much\s*(be|is)\s*(school\s*)?fee|nelfund\s*(go|will)\s*pay\s*(my\s*)?(full\s*)?school\s*fee|cover\s*(all|full)\s*(my\s*)?fee/i.test(q) && !/upkeep|allowance/.test(q.toLowerCase())) {
    return hit('school-fees', 0.84, ['fees', 'cover-all'], 'Will it cover full fees leftover', 'exploring', entities)
  }
  if (/i\s*dey\s*nysc|serving\s*(now|currently)|corps\s*member\s*(fit|can)\s*apply/i.test(q) && !/repay|after\s*nysc/.test(q.toLowerCase())) {
    return hit('eligibility', 0.84, ['eligibility', 'nysc-now'], 'Corps member apply leftover', 'exploring', entities)
  }
  if (/next\s*of\s*kin|emergency\s*contact|who\s*(i|to)\s*put\s*(as\s*)?(kin|contact)/i.test(q)) {
    return hit('documents-needed', 0.84, ['documents', 'nok'], 'Next of kin leftover', 'preparing', entities)
  }
  if (/screenshot|i\s*send\s*(am|pic)|see\s*(the\s*)?(picture|photo|image)|look\s*(this\s*)?(pic|photo)/i.test(q) && q.length < 80) {
    return hit('pending-application', 0.6, ['pending-status', 'screenshot'], 'Short screenshot leftover', 'waiting', entities, true)
  }

  return null
}
