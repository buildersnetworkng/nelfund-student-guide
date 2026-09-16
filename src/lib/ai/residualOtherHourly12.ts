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

/** 16 Sep 21:00 WAT hourly: topUnknownTopics.other 324, pending-status 70. */
export function residualOtherHourly12(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/final\s*year|400\s*level|500\s*level|i\s*(dey|am)\s*(for\s*)?(final|last)\s*year|can\s*final\s*year/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'final-year'], 'Final year leftover', 'exploring', entities)
  }

  if (/freshers?\s*only|only\s*(100|first)\s*level|100\s*level\s*only|only\s*new\s*students/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'level-rumour'], 'Level rumour leftover', 'exploring', entities)
  }

  if (/\bsiwes\b|industrial\s*training|\bit\s*attachment\b|siwes\s*(allowance|stipend)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.82, ['upkeep', 'other', 'siwes'], 'SIWES leftover', 'exploring', entities)
  }

  if (/i\s*(don|have|already)\s*pay(s|ed)?\s*(my\s*)?(school\s*)?fees?|refund\s*(my\s*)?(fees?|money)|school\s*go\s*refund/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('refund', 0.88, ['fees', 'other', 'refund'], 'Already paid / refund leftover', 'exploring', entities, true)
  }

  if (/change\s*(of\s*)?name|i\s*change\s*(my\s*)?name|maiden\s*name|name\s*(no|not)\s*match/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'name-change'], 'Name change leftover', 'applying', entities, true)
  }

  if (/two\s*(schools?|institutions?)|double\s*admission|i\s*(get|have)\s*two\s*(admission|school)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'two-schools'], 'Two schools leftover', 'exploring', entities)
  }

  if (/nelfund\s*(app|apk)|mobile\s*app|play\s*store|app\s*store|download\s*(the\s*)?app/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('official-sources', 0.86, ['other', 'mobile-app'], 'Mobile app leftover', 'exploring', entities)
  }

  if (/matric\s*(no|number)\s*(invalid|wrong|no|not)|invalid\s*matric/i.test(q)) {
    return hit('missing-information', 0.84, ['missing', 'other', 'matric'], 'Invalid matric leftover', 'applying', entities, true)
  }

  if (/interest[\s-]*free|no\s*interest|dem\s*go\s*add\s*interest|is\s*it\s*interest/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('what-is-nelfund', 0.88, ['what-is', 'other', 'interest-free'], 'Interest-free leftover', 'exploring', entities)
  }

  if (/academic\s*suspension|i\s*(dey|am)\s*(on\s*)?suspension| rusticat/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'suspension'], 'Suspension leftover', 'exploring', entities)
  }

  if (/school\s*clearance|i\s*(don|have)\s*(do|done)\s*clearance|final\s*clearance/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.8, ['eligibility', 'other', 'clearance'], 'Clearance leftover', 'exploring', entities)
  }

  if (/vocational|innovation\s*enterprise|\biei\b|skills\s*acquisition\s*centre/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'vocational'], 'Vocational leftover', 'exploring', entities)
  }

  return null
}
