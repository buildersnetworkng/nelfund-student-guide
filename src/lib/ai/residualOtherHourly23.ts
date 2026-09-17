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

/** 17 Sep 14:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly23(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/no\s*(get|have)\s*(matric|admission)|i\s*(do\s*not|don't|dont)\s*have\s*(a\s*)?(matric|admission)|matric\s*(number\s*)?(no|not|never)|admission\s*(letter\s*)?(no|not|never)/i.test(q)) {
    return hit('documents-needed', 0.86, ['other', 'matric', 'admission'], 'No matric / admission leftover', 'preparing', entities, true)
  }

  if (/\bnoun\b|national\s*open\s*university|distance\s*learning|part[\s-]*time|sandwich\s*(programme|student)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'noun-distance'], 'NOUN / distance leftover', 'exploring', entities)
  }

  if (/i\s*(don|have)\s*(graduate|finish)|after\s*graduation|alumni|i\s*don\s*leave\s*school|already\s*(graduate|graduated)/i.test(q) && !/repay|nysc/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'graduate'], 'Already graduated leftover', 'exploring', entities)
  }

  if (/\bnysc\b.*(apply|eligible|loan)|can\s*(nysc|corper)s?\s*apply|serving\s*(nysc|corper)/i.test(q) && !/repay/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'nysc'], 'NYSC apply leftover', 'exploring', entities)
  }

  if (/mobile\s*app|nelfund\s*app|play\s*store|app\s*store|download\s*(the\s*)?app/i.test(q)) {
    return hit('official-sources', 0.84, ['other', 'app'], 'Mobile app leftover', 'exploring', entities)
  }

  if (/life\s*(jail|imprisonment)|go\s*to\s*jail|prison\s*for\s*(loan|debt)|defaulter/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'other', 'penalty-rumour'], 'Jail / defaulter rumour leftover', 'repaying', entities)
  }

  if (/how\s*long\s*(does|go|will).{0,20}(approval|review|pending)|approval\s*take|processing\s*time|sla/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'how-long'], 'How long approval leftover', 'waiting', entities, true)
  }

  if (/change\s*(my\s*)?(bank|account)|wrong\s*(bank|account)|update\s*(bank|account)|account\s*number\s*(wrong|mistake)/i.test(q)) {
    return hit('bank-information', 0.88, ['other', 'bank'], 'Change bank leftover', 'applying', entities, true)
  }

  if (/session\s*(dropdown|list|option).{0,16}(empty|blank|no\s*dey|not\s*show)|no\s*session\s*(dey|show|appear)/i.test(q)) {
    return hit('academic-session', 0.88, ['missing', 'other', 'session'], 'Empty session leftover', 'applying', entities, true)
  }

  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|i\s*(don|have)\s*pay\s*(school\s*)?fee|self[\s-]*pay|paid\s*from\s*pocket|refund\s*(my\s*)?(fee|money)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('refund', 0.86, ['other', 'refund', 'fees'], 'Already paid fees leftover', 'exploring', entities)
  }

  if (/355|1\.66\s*million|how\s*many\s*(students|beneficiar)|total\s*(disburse|loan)|una\s*don\s*pay\s*how\s*much/i.test(q) && !/my\s*(money|upkeep|account)/.test(low)) {
    return hit('official-sources', 0.8, ['other', 'totals'], 'National totals leftover', 'exploring', entities)
  }

  if (/i\s*(send|don\s*send|upload).{0,12}(screenshot|pic|photo|image)|look\s*(this|dis)\s*(pic|photo|screenshot)|see\s*(the\s*)?(pic|photo|screenshot)/i.test(q) && /pending|review|approved|declin|invalid|missing/i.test(low) === false) {
    return hit('pending-application', 0.72, ['pending-status', 'other', 'screenshot'], 'Bare screenshot leftover', 'waiting', entities, true)
  }

  if (/invalid\s*(jamb|utme)|jamb\s*(no|not|never|wrong|mismatch)|utme\s*(no|not)\s*(dey|work|verify)/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb', 'other'], 'JAMB invalid leftover hourly23', 'applying', entities, true)
  }

  if (/^(pls|please|abeg|sir|ma|hello|hi)[.!? ]*$/i.test(q)) {
    return hit('official-sources', 0.5, ['empty', 'greeting-vague'], 'Bare greeting leftover', 'unknown', entities)
  }

  return null
}
