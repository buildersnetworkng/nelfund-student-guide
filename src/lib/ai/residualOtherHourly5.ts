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

/** 16 Sep 04:00 WAT hourly: admin topUnknownTopics.other still 324. */
export function residualOtherHourly5(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/how\s*much|wetin\s*(be\s*)?(the\s*)?(amount|money)|upkeep\s*(na|is)?\s*(how\s*much|20k|25k)|20,?000|25,?000|how\s*much\s*(dem|they)\s*(dey\s*)?pay/i.test(q)) {
    if (/fee|tuition|institutional|school\s*money/i.test(q) && !/upkeep|stipend|allowance/i.test(q)) {
      return hit('school-fees', 0.86, ['fees', 'other'], 'How much fees leftover', 'exploring', entities)
    }
    return hit('upkeep', 0.86, ['upkeep', 'other'], 'How much / amount leftover', 'exploring', entities)
  }

  if (/already\s*paid|i\s*don\s*pay\s*(school|fee)|self\s*sponsor|pay\s*(my\s*)?school\s*(fee|fees)\s*(myself|by\s*myself)|refund/i.test(q)) {
    return hit('refund', 0.86, ['other', 'already-paid'], 'Already paid / refund leftover', 'applying', entities, true)
  }

  if (/which\s*session|20(24|25|26)\s*\/?\s*20(25|26|27)|academic\s*year|wrong\s*session|session\s*(no|not)\s*(dey|show|correct)/i.test(q)) {
    return hit('academic-session', 0.86, ['other', 'session'], 'Session / year leftover', 'applying', entities, true)
  }

  if (/matric(\s*number)?|matno|change\s*of\s*(course|department|programme)|transfer\s*(student|from)|nd\s*to\s*hnd|hnd\s*conversion/i.test(q)) {
    return hit('profile-update', 0.84, ['other', 'profile'], 'Matric / course change leftover', 'applying', entities, true)
  }

  if (/(look|check|see)\s*(this|dis)\s*(screenshot|picture|photo|image)|i\s*(send|sent)\s*(screenshot|picture)|wetin\s*(this|dis)\s*(page|screen)\s*mean/i.test(q)) {
    if (/pending|under\s*review|how\s*far/.test(low)) {
      return hit('pending-application', 0.84, ['pending-status', 'other'], 'Screenshot + pending leftover', 'waiting', entities, true)
    }
    if (/jamb|invalid/.test(low)) {
      return hit('jamb-verification', 0.84, ['jamb', 'other'], 'Screenshot + JAMB leftover', 'applying', entities, true)
    }
    if (/missing/.test(low)) {
      return hit('missing-information', 0.84, ['missing', 'other'], 'Screenshot + missing leftover', 'applying', entities, true)
    }
    return hit('official-sources', 0.62, ['other', 'screenshot'], 'Screenshot leftover, ask lane', 'exploring', entities, true)
  }

  if (/interest\s*(rate|free)|does\s*it\s*carry\s*interest|na\s*interest|hidden\s*charge|processing\s*fee/i.test(q)) {
    return hit('loan-or-scholarship', 0.86, ['other', 'interest'], 'Interest / hidden charge leftover', 'exploring', entities)
  }

  if (/declin|reject|not\s*approv|they\s*refuse/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('rejected-application', 0.86, ['other', 'rejected'], 'Declined leftover', 'rejected', entities, true)
  }

  if (/how\s*many\s*times|apply\s*again|next\s*(year|session)|second\s*application|i\s*apply\s*last\s*year/i.test(q)) {
    return hit('reapplication', 0.84, ['other', 'reapply'], 'Apply again leftover', 'applying', entities)
  }

  if (/vocational|innovation\s*enterprise|ieis|monotechnic|college\s*of\s*health/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Vocational / specialised school leftover', 'exploring', entities)
  }

  if (/guarantor|surety|next\s*of\s*kin\s*(form|letter)/i.test(q)) {
    return hit('guarantor', 0.86, ['other', 'guarantor'], 'Guarantor leftover', 'preparing', entities)
  }

  if (/scam|agent\s*(collect|ask)|pay\s*(before|to)\s*(apply|process)|fake\s*(portal|link)/i.test(q)) {
    return hit('scam-safety', 0.9, ['other', 'scam'], 'Scam / agent leftover', 'exploring', entities, true)
  }

  return null
}
