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

/** 17 Sep 05:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly20(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/awaiting\s*result|i\s*(never|no)\s*(get|collect)\s*(waec|neco|nabteb)|result\s*(no|not)\s*(dey|ready)|apply\s*with\s*awaiting/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'awaiting-result'], 'Awaiting result leftover', 'exploring', entities)
  }

  if (/\bdirect\s*entry\b|\bde\s*(student|number)|i\s*be\s*de\s*student|i\s*enter\s*with\s*de/i.test(q) && !/pending|how\s*far/.test(low)) {
    if (/jamb|invalid|utme/i.test(low)) {
      return hit('jamb-verification', 0.88, ['jamb', 'other', 'direct-entry'], 'DE + JAMB leftover', 'applying', entities, true)
    }
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other', 'direct-entry'], 'Direct Entry leftover', 'preparing', entities)
  }

  if (/portal\s*(keep|dey)\s*(load|hang|spin)|page\s*(no|not)\s*(open|load)|spinner|keep\s*loading|e\s*no\s*open|site\s*(no|not)\s*load/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'portal-hang'], 'Portal hang leftover', 'applying', entities, true)
  }

  if (/captcha|i\s*no\s*be\s*robot|recaptcha|human\s*check\s*(no|not)\s*(work|gree)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'captcha'], 'Captcha leftover', 'applying', entities, true)
  }

  if (/two\s*jamb|double\s*jamb|old\s*jamb\s*(and|with)\s*new|i\s*get\s*(two|2)\s*jamb/i.test(q)) {
    return hit('jamb-verification', 0.88, ['jamb', 'other', 'two-jamb'], 'Two JAMB leftover', 'applying', entities, true)
  }

  if (/old\s*(email|mail)|last\s*year\s*(email|account)|email\s*from\s*202[45]|i\s*use\s*(the\s*)?same\s*email/i.test(q)) {
    return hit('portal-login', 0.84, ['login', 'other', 'old-email'], 'Old email leftover', 'applying', entities, true)
  }

  if (/\b(200|300|400|500)\s*level\b|\b(200|300|400)l\b|i\s*dey\s*(200|300|400)l/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'level'], 'Upper-level leftover', 'exploring', entities)
  }

  if (/faculty\s*(no|not|never)\s*(dey|show|appear)|college\s*(no|not)\s*(dey|show)|department\s*dropdown/i.test(q)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'faculty'], 'Faculty missing leftover', 'applying', entities, true)
  }

  if (/\bwaec\s*only\b|only\s*waec|i\s*no\s*write\s*jamb|i\s*use\s*waec\s*alone/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('jamb-verification', 0.84, ['jamb', 'other', 'waec-only'], 'WAEC-only leftover', 'applying', entities, true)
  }

  if (/school\s*don\s*resume|lecture\s*(don|has)\s*start|resumption|we\s*don\s*resume/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.78, ['how-to-apply', 'other', 'resumed'], 'School resumed leftover', 'preparing', entities)
  }

  if (/\b(gtb|gtbank|uba|access|zenith|first\s*bank|fcmb|opay|palmpay)\b/i.test(q) && /account|bank|upkeep|alert/i.test(low)) {
    return hit('bank-information', 0.86, ['bank', 'other'], 'Named bank leftover', 'preparing', entities, true)
  }

  if (/i\s*don\s*pay\s*acceptance|acceptance\s*(don|has)\s*(pay|paid)|school\s*acceptance/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('school-fees', 0.84, ['fees', 'other', 'acceptance'], 'Acceptance paid leftover', 'exploring', entities)
  }

  if (/ticket\s*(already|don)\s*(open|dey)|i\s*(don|have)\s*open\s*(a\s*)?ticket|esupport\s*(no|not)\s*(reply|respond)/i.test(q)) {
    return hit('contact-support', 0.86, ['contact', 'other', 'ticket-open'], 'Existing ticket leftover', 'waiting', entities)
  }

  if (/i\s*dey\s*(use\s*)?(phone|mobile|chrome|safari|infinix|tecno)|browser\s*(no|not)\s*(work|gree)|try\s*(am\s*)?(for|on)\s*(laptop|desktop)/i.test(q)) {
    return hit('portal-login', 0.8, ['login', 'other', 'device'], 'Device / browser leftover', 'applying', entities, true)
  }

  if (/statement\s*of\s*result|upload\s*(my\s*)?(result|certificate)|o[\s-]*level\s*upload/i.test(q)) {
    return hit('documents-needed', 0.86, ['documents', 'other', 'olevel'], 'O-level upload leftover', 'preparing', entities)
  }

  return null
}
