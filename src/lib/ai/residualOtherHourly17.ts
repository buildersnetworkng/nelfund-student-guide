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

/** 17 Sep 02:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly17(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/change\s*of\s*course|i\s*(don|just)\s*change\s*(my\s*)?course|new\s*course\s*(for|on)\s*(portal|nelfund)|course\s*(no|not)\s*(match|correct)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'course'], 'Change of course leftover', 'applying', entities, true)
  }

  if (/\bnd\b|\bhnd\b|national\s*diploma|higher\s*national|i\s*dey\s*poly|polytechnic\s*student/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'nd-hnd'], 'ND/HND / poly leftover', 'exploring', entities)
  }

  if (/\bsiwes\b|\bit\s*attachment\b|industrial\s*training|industrial\s*attachment/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'siwes'], 'SIWES leftover', 'exploring', entities)
  }

  if (/hostel|accommodation|school\s*housing|i\s*need\s*hostel/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.8, ['upkeep', 'other', 'hostel'], 'Hostel leftover', 'exploring', entities)
  }

  if (/parent(s)?\s*(fit|can|wan|go)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter|ward)|guardian\s*apply|somebody\s*apply\s*for\s*me|my\s*(broda|brother|sister|friend)\s*apply\s*for\s*me/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'parent-apply'], 'Parent / proxy apply leftover', 'preparing', entities)
  }

  if (/use\s*(another|my\s*(broda|brother|sister|friend)|someone).{0,20}jamb|borrow\s*jamb|fake\s*jamb|another\s*person\s*jamb/i.test(q)) {
    return hit('jamb-verification', 0.9, ['jamb', 'other', 'proxy-jamb'], 'Someone else JAMB leftover', 'applying', entities, true)
  }

  if (/change\s*(my\s*)?bank|new\s*account\s*number|wrong\s*account|i\s*wan\s*change\s*(the\s*)?(account|bank)/i.test(q)) {
    return hit('bank-information', 0.88, ['bank', 'other'], 'Change bank leftover', 'applying', entities, true)
  }

  if (/second\s*semester|first\s*semester\s*only|one\s*semester|this\s*semester\s*fees/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('academic-session', 0.84, ['session', 'other', 'semester'], 'Semester leftover', 'preparing', entities)
  }

  if (/forgot\s*(my\s*)?email|lose\s*(my\s*)?email|lost\s*(my\s*)?email|old\s*gmail\s*(no|not)\s*(dey|work)|email\s*(no|not)\s*(dey|work|open)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'lost-email'], 'Lost email leftover', 'applying', entities, true)
  }

  if (/drop\s*out|i\s*(wan|want\s*to)\s*withdraw|leave\s*school|i\s*no\s*go\s*school\s*again/i.test(q) && !/how\s*far/.test(low)) {
    return hit('repayment', 0.8, ['repayment', 'other', 'dropout'], 'Dropout leftover', 'repaying', entities)
  }

  if (/how\s*(i|do\s*i)\s*(go\s*)?know\s*(say\s*)?(school|una)\s*(don|has)\s*(collect|receive|pay)|confirm\s*(school\s*)?(fees?\s*)?(payment|paid)/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'school-paid'], 'Confirm school paid leftover', 'waiting', entities, true)
  }

  if (/20,?000|25,?000|una\s*dey\s*pay\s*(twenty|25|20)|upkeep\s*(na|is)\s*(20|25)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.84, ['upkeep', 'other', 'amount-rumour'], '20k/25k rumour leftover', 'exploring', entities)
  }

  if (/vocational|innovation\s*enterprise|\biei\b|skills\s*acquisition\s*centre/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'vocational'], 'Vocational leftover', 'exploring', entities)
  }

  if (/i\s*(don|have)\s*(start|finish(ed)?)\s*nysc|after\s*nysc|nysc\s*(don|has)\s*finish/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('repayment', 0.86, ['repayment', 'other', 'after-nysc'], 'After NYSC leftover', 'repaying', entities)
  }

  if (/^(pls|please|abeg)\s*(help|check|look)[.!? ]*$/i.test(q) || /^(wetin\s*i\s*go\s*do|what\s*i\s*go\s*do|what\s*next)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.7, ['how-to-apply', 'other', 'vague-next'], 'Vague next-step leftover', 'preparing', entities)
  }

  return null
}
