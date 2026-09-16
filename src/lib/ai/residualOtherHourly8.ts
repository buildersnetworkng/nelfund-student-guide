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

/** 16 Sep 14:00 WAT hourly: admin topUnknownTopics.other still 324. */
export function residualOtherHourly8(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/parent(s)?\s*(fit|can|wan|go|to)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter|ward)|guardian\s*apply|i\s*be\s*parent|mama\s*(fit|can)\s*apply|papa\s*(fit|can)\s*apply/i.test(q)) {
    return hit('eligibility', 0.88, ['eligibility', 'other', 'parent-apply'], 'Parent / guardian apply leftover', 'exploring', entities)
  }

  if (/i\s*(don|have|already)\s*(graduate|finish(ed)?\s*(school|uni))|don\s*done\s*nysc|no\s*dey\s*school\s*again|i\s*(be|am)\s*(an?\s*)?alumn/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'graduate'], 'Already graduated leftover', 'exploring', entities)
  }

  if (/change\s*of\s*(course|institution|school|programme|program)|i\s*(wan|want)\s*change\s*(school|course)|transfer\s*(to|from)\s*(another\s*)?(school|uni)/i.test(q)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'change-of-institution'], 'Change of course / school leftover', 'applying', entities, true)
  }

  if (/name\s*(no|not|never)\s*(match|correct|gree)|surname\s*(change|different)|maiden\s*name|nin\s*(and|vs)\s*jamb.{0,20}(name|match)|jamb\s*name\s*(different|no\s*match)/i.test(q)) {
    return hit('nin-verification', 0.86, ['nin', 'other', 'name-mismatch'], 'Name mismatch leftover', 'applying', entities, true)
  }

  if (/two\s*accounts?|double\s*(account|profile|application)|second\s*account|i\s*(don|have)\s*(two|2)\s*(account|profile)|create[d]?\s*(another|new)\s*account\s*by\s*mistake/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'duplicate-account'], 'Duplicate account leftover', 'applying', entities, true)
  }

  if (/hostel|accommodation\s*loan|rent\s*(loan|money)|laptop\s*loan|device\s*loan|buy\s*(laptop|phone)\s*(with|from)\s*nelfund/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.8, ['upkeep', 'other', 'hostel-device'], 'Hostel / device leftover', 'exploring', entities)
  }

  if (/\bsiwes\b|\bit\s*attachment\b|industrial\s*training| intern(ship)?\s*(loan|allowance)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.8, ['eligibility', 'other', 'siwes'], 'SIWES / IT leftover', 'exploring', entities)
  }

  if (/apply\s*(for\s*)?two\s*schools|two\s*institutions|two\s*unis/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.82, ['how-to-apply', 'other', 'two-schools'], 'Two-school leftover', 'preparing', entities)
  }

  if (/hnd\s*(conversion|top\s*up)|nd\s*to\s*hnd|i\s*(be|am)\s*(nd|hnd|nce)\s*student/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'nd-hnd'], 'ND/HND leftover', 'exploring', entities)
  }

  if (/skill\s*acquisition|vocational\s*only|nabteb|innovation\s*enterprise/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'vocational'], 'Vocational leftover', 'exploring', entities)
  }

  return null
}
