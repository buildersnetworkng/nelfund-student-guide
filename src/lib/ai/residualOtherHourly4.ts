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

/** 16 Sep 03:00 WAT hourly: residual admin `other` still dominating unique unknown topics. */
export function residualOtherHourly4(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/whatsapp\s*(number|line|group|link)|nelfund\s*(phone|number|hotline)|customer\s*care|call\s*(nelfund|una)|phone\s*(number|no)\s*(for|of)\s*nelfund|how\s*(i|to)\s*contact/i.test(q)) {
    return hit('contact-support', 0.88, ['other', 'contact'], 'Phone / WhatsApp / contact leftover', 'exploring', entities)
  }
  if (/change\s*(my\s*)?(bank|account)|wrong\s*(bank|account)|update\s*(my\s*)?account\s*number|account\s*number\s*(no|not)\s*(dey|correct)/i.test(q)) {
    return hit('bank-information', 0.88, ['other', 'bank'], 'Change bank leftover', 'applying', entities, true)
  }
  if (/button\s*(no|not|never)\s*(dey|show)|cannot\s*submit|submit\s*(no|not)\s*(work|go)|request\s*for\s*student\s*loan\s*(no|not)|form\s*(no|not)\s*submit/i.test(q) && !liveish(q)) {
    return hit('missing-information', 0.84, ['other', 'submit-fail'], 'Submit / button missing leftover', 'applying', entities, true)
  }
  if (/application\s*(don|has)\s*(disappear|vanish|delete)|my\s*(loan|file)\s*(no|not)\s*(dey|show)\s*(again|anymore)|profile\s*(wipe|empty)/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'other'], 'Application disappeared leftover', 'waiting', entities, true)
  }
  if (/otp\s*(no|not|never)\s*(come|land|drop|arrive)|verification\s*code\s*(no|not)|email\s*(no|not)\s*(verify|confirm)/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'otp'], 'OTP / email verify leftover', 'applying', entities, true)
  }
  if (/hostel|accommodation|campus\s*housing|school\s*hostel/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.8, ['other', 'hostel'], 'Hostel-only leftover', 'exploring', entities)
  }
  if (/law\s*school|nigerian\s*law\s*school|\bnls\b/i.test(q) && !/pending|how\s*far/.test(q.toLowerCase())) {
    return hit('eligibility', 0.84, ['eligibility', 'law-school'], 'Law school leftover', 'exploring', entities)
  }
  if (/wetin\s*i\s*go\s*do\s*now|what\s*should\s*i\s*do\s*now|abeg\s*advise\s*me/i.test(q) && q.length < 60) {
    return hit('how-to-apply', 0.62, ['how-to-apply', 'other'], 'Vague next-step leftover', 'preparing', entities)
  }
  if (/complaint|i\s*wan\s*report|escalate|make\s*una\s*fix/i.test(q) && !liveish(q)) {
    return hit('contact-support', 0.8, ['other', 'complaint'], 'Complaint leftover', 'waiting', entities, true)
  }
  if (/next\s*batch|last\s*batch|when\s*(dem|they)\s*(go|will)\s*(pay|disburse)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'batch'], 'Next batch leftover', 'waiting', entities, true)
  }

  return null
}
