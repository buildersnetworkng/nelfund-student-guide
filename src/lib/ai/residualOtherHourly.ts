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

/** Hourly expansion of admin unknown topic `other`. */
export function residualOtherHourly(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/upload\s*(my\s*)?(admission|offer)\s*letter|admission\s*letter\s*(no|not|never)|offer\s*letter\s*(upload|missing)/i.test(q)) {
    return hit('documents-needed', 0.86, ['documents', 'admission-letter'], 'Admission letter upload leftover', 'preparing', entities)
  }
  if (/awaiting\s*result|result\s*(never|no)\s*(dey|ready)|i\s*dey\s*await\s*result|waec\s*(no|not)\s*ready|neco\s*(no|not)\s*ready/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'awaiting-result'], 'Awaiting result leftover', 'exploring', entities)
  }
  if (/lost\s*(my\s*)?phone|change\s*(my\s*)?phone|new\s*sim|sim\s*(swap|change)|phone\s*(no|not)\s*(dey|work)/i.test(q) && /otp|login|account|nelfund|portal/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'phone-change'], 'Lost phone / change number leftover', 'applying', entities, true)
  }
  if (/captcha|i\s*am\s*not\s*a\s*robot|recaptcha|robot\s*check/i.test(q)) {
    return hit('portal-login', 0.84, ['login', 'captcha'], 'Captcha leftover', 'applying', entities, true)
  }
  if (/use\s*(another|someone|my\s*friend).{0,24}account|login\s*(with|use)\s*(my\s*)?(friend|bro|sister)|share\s*(the\s*)?account/i.test(q)) {
    return hit('portal-login', 0.88, ['login', 'shared-account'], 'Shared / borrowed account leftover', 'applying', entities, true)
  }
  if (/laptop|phone\s*allowance|gadget|they\s*(go|will)\s*give\s*(phone|laptop)/i.test(q) && !/pending|how\s*far/.test(q)) {
    return hit('what-is-nelfund', 0.8, ['what-is', 'gadget-rumour'], 'Laptop / gadget rumour leftover', 'exploring', entities)
  }
  if (/wrong\s*email|email\s*(no|not)\s*correct|i\s*use\s*wrong\s*(mail|email)|change\s*(my\s*)?email/i.test(q)) {
    return hit('profile-update', 0.86, ['profile', 'email'], 'Wrong / change email leftover', 'applying', entities, true)
  }
  if (/how\s*(do\s*i|to|i\s*go)\s*upload|cannot\s*upload|upload\s*(no|not)\s*(gree|work|dey)/i.test(q)) {
    return hit('documents-needed', 0.82, ['documents', 'upload'], 'Cannot upload leftover', 'preparing', entities, true)
  }
  if (/can\s*(nd|nce|hnd)\s*(student)?s?\s*apply|nd\s*student\s*(fit|can)|nce\s*(fit|can)\s*apply/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'nd-nce'], 'ND/NCE can apply leftover', 'exploring', entities)
  }
  if (/does\s*(nelfund|it)\s*pay\s*(hostel|accommodation|rent)|hostel\s*(fee|money)\s*(include|cover)/i.test(q)) {
    return hit('upkeep', 0.84, ['upkeep', 'hostel'], 'Does NELFUND pay hostel leftover', 'exploring', entities)
  }
  if (/i\s*(wan|want)\s*(know|hear)\s*(about\s*)?(nelfund|the\s*loan)|more\s*(info|information)\s*(about\s*)?nelfund/i.test(q) && !liveish(q)) {
    return hit('what-is-nelfund', 0.82, ['what-is'], 'Want to know about NELFUND leftover', 'exploring', entities)
  }
  if (/how\s*(do\s*i|to)\s*(create|open)\s*(the\s*)?(account|profile)|account\s*creation\s*step/i.test(q)) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'signup'], 'How to create account leftover', 'preparing', entities)
  }

  // 16 Sep hourly: leftover `other` that still fell through to official-sources
  if (/passport\s*(photo|picture)|passport\s*photograph|upload\s*(my\s*)?(photo|picture|passport)|profile\s*picture\s*(no|not)/i.test(q)) {
    return hit('documents-needed', 0.86, ['documents', 'passport'], 'Passport photo leftover', 'preparing', entities, true)
  }
  if (/signature\s*(no|not|never)|upload\s*(my\s*)?signature|sign(ature)?\s*(field|box)/i.test(q)) {
    return hit('documents-needed', 0.84, ['documents', 'signature'], 'Signature upload leftover', 'preparing', entities, true)
  }
  if (/state\s*of\s*origin|indigene|lga\s*(no|not)|local\s*government\s*(no|not|wrong)|origin\s*(no|not)\s*(dey|match)/i.test(q)) {
    return hit('profile-update', 0.84, ['profile', 'indigene'], 'State of origin / LGA leftover', 'applying', entities, true)
  }
  if (/disabilit|special\s*need|physically\s*challenged|i\s*be\s*disabled|wheelchair/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'disability'], 'Disability leftover', 'exploring', entities)
  }
  if (/another\s*(bank\s*)?loan|existing\s*loan|i\s*(don|have)\s*(a\s*)?(bank\s*)?loan|student\s*loan\s*already|two\s*loans\s*same\s*time/i.test(q) && !liveish(q) && !/pending|how\s*far/.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other-loan'], 'Already have another loan leftover', 'exploring', entities)
  }
  if (/evening\s*(class|programme|program|student)|night\s*class|after\s*work\s*(class|school)|working\s*and\s*school/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'evening'], 'Evening / working student leftover', 'exploring', entities)
  }
  if (/married|i\s*(get|have)\s*(wife|husband)|i\s*be\s*married/i.test(q) && /eligib|qualify|fit\s*apply|can\s*i\s*apply/i.test(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'married'], 'Married student leftover', 'exploring', entities)
  }
  if (/how\s*(do\s*i|to|i\s*go)\s*(check|see)\s*(am|my\s*)?(loan|file|dashboard)|where\s*(i|to)\s*see\s*(my\s*)?(loan|file)|check\s*(my\s*)?(loan|file)\s*(status)?/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'check-file'], 'Check my loan / file leftover', 'waiting', entities, true)
  }
  if (/dem\s*don\s*(approve|pay)\s*(my\s*)?school|school\s*(don|has)\s*(collect|receive)\s*(the\s*)?(money|fee)|institutional\s*(don|has)\s*pay/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'school-paid'], 'School already received leftover', 'waiting', entities, true)
  }
  if (/how\s*many\s*(students?|people)\s*(don|have|una)\s*(pay|collect|benefit)|how\s*much\s*(don|have)\s*(una|they|dem)\s*disburse|total\s*(loan|disburse)/i.test(q)) {
    return hit('official-sources', 0.78, ['disbursement-totals'], 'Disbursement totals leftover', 'exploring', entities)
  }
  if (/gtbank|zenith|uba|access\s*bank|first\s*bank|fidelity|kuda|which\s*bank\s*(dey|work|accept)/i.test(q) && /upkeep|account|alert|pay/i.test(q)) {
    return hit('bank-information', 0.84, ['bank', 'which-bank'], 'Which bank leftover', 'preparing', entities)
  }
  if (/next\s*of\s*kin|emergency\s*contact|who\s*(i|to)\s*put\s*(as\s*)?(kin|contact)/i.test(q)) {
    return hit('documents-needed', 0.8, ['documents', 'nok'], 'Next of kin leftover', 'preparing', entities)
  }

  return null
}
