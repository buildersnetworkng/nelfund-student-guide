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

/** 17 Sep 01:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40. */
export function residualOtherHourly16(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/nelfund\s*(mobile\s*)?app|download\s*(the\s*)?(nelfund\s*)?app|play\s*store|app\s*store|ussd/i.test(q)) {
    return hit('official-sources', 0.86, ['other', 'app'], 'Mobile app / USSD leftover', 'exploring', entities)
  }

  if (/\btin\b|tax\s*identification|tax\s*id/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.84, ['documents', 'other', 'tin'], 'TIN leftover', 'preparing', entities)
  }

  if (/\bwaec\b|\bneco\b|\bnabteb\b|o[\s-]*level|olevel|awaiting\s*result|i\s*no\s*get\s*result/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'olevel'], 'O-level / awaiting result leftover', 'exploring', entities)
  }

  if (/direct\s*entry|\bde\s*student\b|i\s*be\s*de\b/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('jamb-verification', 0.86, ['jamb', 'other', 'direct-entry'], 'Direct Entry leftover', 'preparing', entities, true)
  }

  if (/i\s*(dey|am)\s*(for\s*)?(abroad|uk|usa|canada|overseas)|apply\s*from\s*abroad|international\s*campus/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'abroad'], 'Apply from abroad leftover', 'exploring', entities)
  }

  if (/i\s*no\s*get\s*bvn|no\s*bvn|without\s*bvn|bvn\s*(no|not)\s*ready/i.test(q)) {
    return hit('nin-verification', 0.88, ['bvn', 'other'], 'No BVN leftover', 'preparing', entities, true)
  }

  if (/i\s*no\s*get\s*nin|no\s*nin|without\s*nin|nin\s*(no|not)\s*ready/i.test(q)) {
    return hit('nin-verification', 0.88, ['nin', 'other'], 'No NIN leftover', 'preparing', entities, true)
  }

  if (/wetin\s*(be|mean)\s*under\s*review|what\s*(does|is)\s*under\s*review|under\s*review\s*(mean|meaning)/i.test(q)) {
    return hit('pending-application', 0.9, ['pending-status', 'other', 'under-review'], 'Under review meaning leftover', 'waiting', entities, true)
  }

  if (/how\s*(i|do\s*i|to)\s*(know|confirm)\s*(say\s*)?(i\s*)?(qualify|eligible)|wetin\s*(go\s*)?make\s*i\s*qualify/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'qualify-check'], 'How do I know I qualify leftover', 'exploring', entities)
  }

  if (/na\s*(loan|grant|scholarship)\s*or\s*(loan|grant|scholarship)|nelfund\s*na\s*(loan|grant)|fg\s*(dey\s*)?sponsor/i.test(q)) {
    return hit('loan-or-scholarship', 0.9, ['loan', 'other', 'grant'], 'Loan vs grant leftover', 'exploring', entities)
  }

  if (/400\s*level|\b400l\b|final\s*year|i\s*dey\s*final/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'final-year'], '400L / final year leftover', 'exploring', entities)
  }

  if (/statement\s*of\s*result|admission\s*list\s*only|no\s*offer\s*letter/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.84, ['documents', 'other', 'statement'], 'Statement of result leftover', 'preparing', entities)
  }

  if (/sponsor|who\s*(dey|will)\s*stand\s*for\s*me|parent\s*must\s*sign/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('guarantor', 0.84, ['guarantor', 'other', 'sponsor'], 'Sponsor leftover', 'preparing', entities)
  }

  if (/virtual\s*(naira\s*)?account|opay\s*(fit|can)|palmpay\s*(fit|can)|use\s*(opay|palmpay|moniepoint)/i.test(q)) {
    return hit('bank-information', 0.86, ['bank', 'other', 'wallet'], 'Wallet account leftover', 'preparing', entities, true)
  }

  if (/i\s*don\s*see\s*approved|e\s*don\s*show\s*approved|status\s*na\s*approved/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'other', 'approved-wait'], 'Approved but wait leftover', 'waiting', entities, true)
  }

  return null
}
