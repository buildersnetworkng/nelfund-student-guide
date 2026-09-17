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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(
    q,
  )
}

/** 17 Sep 23:05 WAT: other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly26(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /glitch|system\s*(fail|failure|down)|portal\s*(issue|problem|error)|two\s*months?\s*(no|never|without)\s*(pay|upkeep|allowance|stipend)|upkeep\s*(delay|delayed|hold|on\s*hold)|allowance\s*(delay|delayed|no\s*dey)|nans|stipend\s*(never|no)\s*(enter|drop|come)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other', 'upkeep-delay'],
      'Upkeep delay / portal glitch leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /change\s*(my\s*)?(school|institution|course)|i\s*(don|have)\s*transfer|transfer\s*(to|from)\s*(another|new)\s*school|wrong\s*school\s*(on|for)\s*(portal|profile)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.84,
      ['school', 'other', 'transfer'],
      'School / transfer leftover',
      'applying',
      entities,
      true,
    )
  }

  if (/nin\s*(no|not|never|mismatch|wrong|invalid)|nin\s*(and|with)\s*(name|bvn)|bvn\s*(no|not|never)\s*(match|correct)/i.test(q)) {
    return hit('documents-needed', 0.86, ['nin', 'bvn', 'other'], 'NIN / BVN leftover', 'preparing', entities, true)
  }

  if (/2026\s*\/\s*2027|new\s*session\s*(apply|application)|next\s*session\s*(apply|loan)|apply\s*again\s*(this|next)\s*(year|session)/i.test(q)) {
    return hit(
      'how-to-apply',
      0.82,
      ['apply', 'other', 'cycle'],
      'New session apply leftover',
      'applying',
      entities,
    )
  }

  if (/life\s*(jail|imprison)|jail\s*for\s*life|prison\s*for\s*(loan|default)|fake\s*(news|headline)/i.test(q)) {
    return hit('repayment', 0.93, ['repayment', 'other', 'life-jail-rumour'], 'Life-jail rumour leftover', 'repaying', entities)
  }

  if (/wetin\s*dey\s*happen|una\s*dey\s*do\s*wetin|nelfund\s*wahala|e\s*no\s*clear/i.test(q) && !/pending|how\s*far|money/.test(low)) {
    return hit('official-sources', 0.5, ['other', 'vague'], 'Vague wahala leftover', 'unknown', entities)
  }

  if (/change\s*(my\s*)?(email|phone|number)|wrong\s*(email|phone)\s*(on|for)\s*(portal|account)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'profile'], 'Change email / phone leftover', 'applying', entities, true)
  }

  return null
}
