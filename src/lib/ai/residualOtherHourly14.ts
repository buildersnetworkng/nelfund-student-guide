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

/** 16 Sep 23:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40. */
export function residualOtherHourly14(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/hostel|accommodation|school\s*lodge|campus\s*housing|i\s*(wan|want)\s*(pay|use)\s*(am\s*)?(for\s*)?hostel/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'hostel'], 'Hostel leftover', 'exploring', entities)
  }

  if (/\bwaec\b|\bneco\b|\bnabteb\b|\bssce\b|o[\s-]*level\s*(result|certificate)|upload\s*(my\s*)?(waec|neco)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.86, ['documents', 'other', 'olevel'], 'O-level leftover', 'preparing', entities)
  }

  if (/change\s*(of\s*)?course|i\s*change\s*(my\s*)?course|switch\s*course|new\s*department/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.84, ['profile', 'other', 'course-change'], 'Course change leftover', 'applying', entities, true)
  }

  if (/hnd\s*(to|2)\s*bsc|top[\s-]*up|conversion\s*(programme|program)|i\s*(dey|am)\s*(do|doing)\s*conversion/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'conversion'], 'HND-to-BSc leftover', 'exploring', entities)
  }

  if (/medicine|mbbs|pharmacy|nursing\s*student|law\s*student|6\s*years?|seven\s*years?|professional\s*course/i.test(q) && !/pending|how\s*far/.test(low) && /eligib|fit|can\s*i|qualify|cover/i.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'long-course'], 'Long professional course leftover', 'exploring', entities)
  }

  if (/disab(led|ility)|physically\s*challenged|special\s*need|wheelchair|blind\s*student/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'disability'], 'Disability leftover', 'exploring', entities)
  }

  if (/orphan|indigent|i\s*(dey|am)\s*poor|no\s*sponsor|my\s*people\s*no\s*get\s*money|poverty/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.82, ['eligibility', 'other', 'indigent'], 'Indigent leftover', 'exploring', entities)
  }

  if (/state\s*of\s*origin|catchment|indigene\s*(quota|list)|federal\s*character/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'catchment'], 'Catchment leftover', 'exploring', entities)
  }

  if (/\btin\b|tax\s*identification|fcrs|firs\s*number/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.8, ['documents', 'other', 'tin'], 'TIN leftover', 'preparing', entities)
  }

  if (/student\s*id(\s*card)?|school\s*id\s*card|identity\s*card\s*upload/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.84, ['documents', 'other', 'id-card'], 'Student ID leftover', 'preparing', entities)
  }

  if (/fees?\s*receipt|school\s*receipt|tell(er)?\s*(of\s*)?fees|evidence\s*of\s*(school\s*)?payment/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.84, ['documents', 'other', 'receipt'], 'Fees receipt leftover', 'preparing', entities)
  }

  if (/(opay|palmpay|moniepoint|kuda|fairmoney|wallet)\s*(account|acc)|fintech\s*account|virtual\s*account/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('bank-information', 0.88, ['bank', 'other', 'fintech'], 'Fintech bank leftover', 'applying', entities, true)
  }

  if (/joint\s*account|account\s*(no|not)\s*(dey|is)\s*(my|mine)|papa\s*account|mama\s*account|use\s*(my\s*)?(parent|guardian)\s*account/i.test(q)) {
    return hit('bank-information', 0.88, ['bank', 'other', 'joint-account'], 'Someone else bank leftover', 'applying', entities, true)
  }

  if (/how\s*long\s*(before|will|go)|when\s*(dem|they|una)\s*(go|will)\s*(verify|approve)|approval\s*(time|take)|how\s*many\s*(days|weeks|months)\s*(before|to)\s*(approve|verify)/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'other', 'how-long'], 'How long to approve leftover', 'waiting', entities, true)
  }

  if (/una\s*(no|not)\s*(dey|did)\s*reply|no\s*(reply|response)\s*(to\s*)?(my\s*)?(mail|email|ticket)|ticket\s*(no|not|never)\s*(reply|answer)/i.test(q)) {
    return hit('contact-support', 0.86, ['contact', 'other', 'no-reply'], 'Ticket no-reply leftover', 'waiting', entities, true)
  }

  if (/admission\s*letter\s*only|only\s*admission\s*letter|no\s*other\s*document/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('documents-needed', 0.86, ['documents', 'other', 'admission-only'], 'Admission-letter-only leftover', 'preparing', entities)
  }

  return null
}
