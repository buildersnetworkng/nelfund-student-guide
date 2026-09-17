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

/** 17 Sep 03:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly18(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/rusticat|suspend(ed)?\s*(from\s*)?school|i\s*(don|have)\s*(comot|leave)\s*school\s*by\s*force/i.test(q) && !/how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'rustication'], 'Rustication / suspension leftover', 'exploring', entities)
  }

  if (/two\s*jamb|double\s*jamb|i\s*get\s*(two|2)\s*jamb|old\s*jamb\s*(and|&)\s*new\s*jamb/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb', 'other', 'two-jamb'], 'Two JAMB numbers leftover', 'applying', entities, true)
  }

  if (/\bjupeb\b|\bijmb\b|pre[\s-]*degree|remedial\s*(class|student|programme)|foundation\s*programme/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'predegree'], 'Pre-degree / JUPEB leftover', 'exploring', entities)
  }

  if (/\basuu\b|school\s*(dey|is)\s*(on\s*)?strike|strike\s*(dey|no\s*dey)|lecturers?\s*(dey\s*)?strike/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'other', 'strike'], 'Strike leftover', 'waiting', entities, true)
  }

  if (/nelfund\s*(office|hq|head\s*office)|visit\s*(una|your|the)\s*office|physical\s*office|where\s*(una|una\s*office|office)\s*dey|office\s*address/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('official-sources', 0.86, ['other', 'office'], 'Physical office leftover', 'exploring', entities)
  }

  if (/i\s*no\s*get\s*(smart\s*)?phone|no\s*android|only\s*computer\s*lab|cyber\s*cafe|i\s*dey\s*use\s*cafe/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.8, ['how-to-apply', 'other', 'no-phone'], 'No smartphone leftover', 'preparing', entities)
  }

  if (/two\s*(admission|schools?)|double\s*admission|i\s*get\s*(two|2)\s*(schools?|admission)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.84, ['missing', 'other', 'dual-school'], 'Two schools leftover', 'applying', entities, true)
  }

  if (/name\s*(no|not|never)\s*(match|correct|the\s*same)|surname\s*(different|no\s*match)|middle\s*name\s*(missing|no\s*dey)/i.test(q)) {
    return hit('jamb-verification', 0.86, ['jamb', 'other', 'name-mismatch'], 'Name mismatch leftover', 'applying', entities, true)
  }

  if (/i\s*(don|have)\s*defer|deferment|i\s*wan\s*defer\s*(my\s*)?(admission|session)/i.test(q) && !/how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'defer'], 'Deferment leftover', 'exploring', entities)
  }

  if (/convocation|i\s*(don|have)\s*graduate|i\s*don\s*finish\s*(school|uni)|alumni/i.test(q) && !/pending|how\s*far|nysc/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'graduated'], 'Already graduated leftover', 'exploring', entities)
  }

  if (/petition|i\s*wan\s*write\s*(una|nelfund)|complaint\s*letter|formal\s*complaint/i.test(q)) {
    return hit('email-draft', 0.84, ['email', 'other', 'petition'], 'Petition leftover', 'waiting', entities)
  }

  if (/i\s*don\s*pay\s*(school\s*)?fees?\s*(myself|by\s*myself)|self[\s-]*sponsor\s*fees|paid\s*out\s*of\s*pocket/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'self-paid'], 'Already paid fees leftover', 'waiting', entities, true)
  }

  if (/\bpgde\b|post\s*graduate\s*diploma|pgd\s*student/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'pgde'], 'PGDE leftover', 'exploring', entities)
  }

  if (/mature\s*student|i\s*(don|be)\s*(pass|above)\s*\d{2}\s*years|age\s*limit|too\s*old\s*to\s*apply/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'age'], 'Age / mature leftover', 'exploring', entities)
  }

  if (/^(una\s*see\s*am|see\s*am|look\s*am|check\s*this|check\s*dis)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.68, ['pending-status', 'other', 'look-am'], 'Look-am leftover', 'waiting', entities, true)
  }

  return null
}
