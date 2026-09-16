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

/** 16 Sep 12:00 WAT hourly: admin topUnknownTopics.other still 324. */
export function residualOtherHourly6(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/name\s*(no|not|never)\s*(match|correct|the\s*same)|mismatch\s*(name|nin|jamb)|different\s*name|name\s*on\s*(jamb|nin|bvn)\s*(no|not)|spelling\s*(of\s*)?name/i.test(q)) {
    return hit('nin-verification', 0.86, ['other', 'name-mismatch'], 'Name / NIN-JAMB mismatch leftover', 'applying', entities, true)
  }

  if (/i\s*(don|have|just)\s*(submit|submitted)|application\s*(successful|complete|done)|i\s*don\s*finish\s*(the\s*)?(form|apply)|after\s*(i\s*)?submit|wetin\s*after\s*submit/i.test(q)) {
    if (/pending|how\s*far|money\s*(never|no)/.test(low)) {
      return hit('pending-application', 0.86, ['pending-status', 'other'], 'Submitted then waiting leftover', 'waiting', entities, true)
    }
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other', 'after-submit'], 'Submitted / what next leftover', 'applying', entities)
  }

  if (/two\s*account|duplicate\s*(account|profile|application)|second\s*email|i\s*open\s*another\s*account|double\s*apply/i.test(q)) {
    return hit('portal-login', 0.86, ['other', 'duplicate-account'], 'Duplicate account leftover', 'applying', entities, true)
  }

  if (/who\s*(collect|get|receive)\s*(the\s*)?(money|loan|fees)|school\s*or\s*(me|student)|dem\s*pay\s*(school|me)|una\s*dey\s*pay\s*who/i.test(q)) {
    return hit('loan-or-scholarship', 0.84, ['other', 'who-gets-paid'], 'Who receives the money leftover', 'exploring', entities)
  }

  if (/foreign\s*student|international\s*student|i\s*no\s*be\s*nigerian|non[\s-]*nigerian|study\s*abroad/i.test(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'foreign'], 'Foreign / abroad leftover', 'exploring', entities)
  }

  if (/\bnce\b|national\s*certificate\s*of\s*education|ordinary\s*national\s*diploma|\bond\b|higher\s*national\s*diploma|\bhnd\b/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'nce-hnd'], 'NCE / ND / HND leftover', 'exploring', entities)
  }

  if (/dem\s*(no|never)\s*call\s*me|they\s*(didn.?t|never)\s*(call|email)|no\s*(mail|email|sms|call)\s*(from\s*)?nelfund|when\s*(dem|they)\s*(go|will)\s*contact/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'other', 'no-contact'], 'No call / email leftover', 'waiting', entities, true)
  }

  if (/physical\s*(verification|office)|come\s*to\s*(abuja|office)|visit\s*nelfund|walk[\s-]*in/i.test(q)) {
    return hit('contact-support', 0.84, ['other', 'office-visit'], 'Physical office leftover', 'exploring', entities)
  }

  if (/who\s*(go|will)\s*pay\s*(back|am)|parent\s*(go|will)\s*pay|my\s*papa\s*(go|will)\s*pay/i.test(q)) {
    return hit('repayment', 0.86, ['repayment', 'other'], 'Who repays leftover', 'repaying', entities)
  }

  return null
}
