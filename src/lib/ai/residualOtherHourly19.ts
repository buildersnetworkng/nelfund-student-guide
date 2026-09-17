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

/** 17 Sep 04:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly19(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/transfer\s*student|inter[\s-]*university\s*transfer|i\s*(don|have)\s*transfer|change\s*of\s*institution/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'transfer'], 'Transfer / change of institution leftover', 'applying', entities, true)
  }

  if (/change\s*of\s*course|i\s*(don|have)\s*change\s*(my\s*)?course|new\s*course\s*(different|no\s*match)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.84, ['missing', 'other', 'course-change'], 'Change of course leftover', 'applying', entities, true)
  }

  if (/hostel|accommodation\s*(loan|money|allowance)|house\s*rent\s*(loan|nelfund)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.84, ['upkeep', 'other', 'hostel'], 'Hostel / rent leftover', 'exploring', entities)
  }

  if (/foreign\s*student|international\s*student|i\s*no\s*be\s*nigerian|not\s*a\s*nigerian|i\s*be\s*(togo|ghana|cameroon)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.88, ['eligibility', 'other', 'foreign'], 'Non-Nigerian leftover', 'exploring', entities)
  }

  if (/official\s*(mobile\s*)?app|play\s*store|app\s*store|nelfund\s*app\s*(dey|exist)|download\s*(the\s*)?app/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('official-sources', 0.86, ['other', 'app'], 'Official app leftover', 'exploring', entities)
  }

  if (/official\s*(whatsapp|telegram)|nelfund\s*(whatsapp|telegram)\s*group|join\s*(the\s*)?(whatsapp|telegram)/i.test(q)) {
    return hit('scam-safety', 0.88, ['scam', 'other', 'group'], 'Unofficial group leftover', 'exploring', entities)
  }

  if (/i\s*use\s*(my\s*)?(broda|brother|sister|friend|oga)\s*(email|account)|another\s*person\s*(email|account)|shared\s*email/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'shared-email'], 'Shared email leftover', 'applying', entities, true)
  }

  if (/vocational|skills\s*(acquisition|school)|nbtc|nbte\s*vocational|innovation\s*enterprise/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'vocational'], 'Vocational leftover', 'exploring', entities)
  }

  if (/\bhnd\b|\bnd\b|higher\s*national\s*diploma|ordinary\s*national\s*diploma|i\s*dey\s*poly/i.test(q) && !/pending|how\s*far|jamb/.test(low)) {
    return hit('eligibility', 0.8, ['eligibility', 'other', 'hnd-nd'], 'HND/ND leftover', 'exploring', entities)
  }

  if (/i\s*no\s*get\s*nin|no\s*nin|nin\s*(no|not)\s*(dey|ready)|nin\s*slip\s*(lost|missing)/i.test(q)) {
    return hit('nin-verification', 0.88, ['nin', 'other'], 'No NIN leftover', 'applying', entities, true)
  }

  if (/two\s*bvn|double\s*bvn|i\s*get\s*(two|2)\s*bvn|old\s*bvn/i.test(q)) {
    return hit('nin-verification', 0.88, ['bvn', 'other', 'two-bvn'], 'Two BVN leftover', 'applying', entities, true)
  }

  if (/screenshot|i\s*(send|don\s*send)\s*(pic|picture|photo|image)|see\s*(the\s*)?(pic|photo|image)|look\s*(this|dis)\s*(pic|photo)/i.test(q)) {
    if (/jamb|invalid/i.test(low)) {
      return hit('jamb-verification', 0.86, ['jamb', 'other', 'screenshot'], 'Screenshot JAMB leftover', 'applying', entities, true)
    }
    return hit('pending-application', 0.78, ['pending-status', 'other', 'screenshot'], 'Screenshot leftover', 'waiting', entities, true)
  }

  if (/i\s*wan\s*(apply|register)\s*for\s*(my\s*)?(broda|brother|sister|pikin|child)|apply\s*on\s*behalf/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other', 'on-behalf'], 'Apply on behalf leftover', 'preparing', entities)
  }

  if (/nysc\s*batch|i\s*dey\s*nysc|i\s*(don|have)\s*(start|begin)\s*nysc/i.test(q) && /pending|how\s*far|money|upkeep|loan/.test(low)) {
    return hit('pending-application', 0.84, ['pending-status', 'other', 'nysc-now'], 'NYSC now + pending leftover', 'waiting', entities, true)
  }

  if (/nysc\s*batch|i\s*dey\s*nysc|after\s*nysc|repay/i.test(q)) {
    return hit('repayment', 0.84, ['repayment', 'other', 'nysc'], 'NYSC / repayment leftover', 'repaying', entities)
  }

  return null
}
