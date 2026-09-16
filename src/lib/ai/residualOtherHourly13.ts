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

/** 16 Sep 22:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40. */
export function residualOtherHourly13(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/parent(s)?\s*(fit|can|wan|want)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter)|guardian\s*apply|i\s*be\s*parent|mama\s*apply|papa\s*apply/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.88, ['eligibility', 'other', 'parent-apply'], 'Parent apply leftover', 'exploring', entities)
  }

  if (/(20\s*,?\s*000|25\s*,?\s*000|30\s*,?\s*000|how\s*much\s*(be|is)\s*(upkeep|allowance|stipend)|upkeep\s*(na|is)\s*how\s*much|wetin\s*(dem|they)\s*dey\s*pay)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.86, ['upkeep', 'other', 'amount-rumour'], 'Upkeep amount leftover', 'exploring', entities)
  }

  if (/apply\s*(from|on)\s*(my\s*)?(phone|mobile|android|iphone)|chrome\s*(no|not)\s*(open|load)|browser\s*(no|not)\s*(open|load)|portal\s*(no|not)\s*(open|load)\s*(for|on)\s*(phone|mobile)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('how-to-apply', 0.84, ['how-to-apply', 'other', 'phone-apply'], 'Phone / browser leftover', 'preparing', entities, true)
  }

  if (/(use|borrow|put)\s*(another|my\s*(papa|mama|brother|sister|friend)).{0,20}(nin|bvn)|another\s*person\s*(nin|bvn)|somebody\s*else\s*(nin|bvn)/i.test(q)) {
    return hit('nin-verification', 0.9, ['nin', 'other', 'borrowed-id'], 'Borrowed NIN/BVN leftover', 'applying', entities, true)
  }

  if (/apply\s*(two|2)\s*times|two\s*applications?|second\s*application|i\s*(wan|want)\s*apply\s*again|double\s*apply/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('reapplication', 0.84, ['other', 'reapply'], 'Apply twice leftover', 'preparing', entities)
  }

  if (/i\s*dey\s*nysc|during\s*nysc|serving\s*(now|currently)|corps\s*member|i\s*(dey|am)\s*serving/i.test(q) && !/repay|pay\s*back/.test(low) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'nysc-now'], 'Serving NYSC leftover', 'exploring', entities)
  }

  if (/(no|never|not|without)\s*(matric|matriculation)|matric\s*(no|not|never)\s*(ready|dey|show)|school\s*(never|no)\s*(give|issue)\s*matric/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'no-matric'], 'No matric leftover', 'applying', entities, true)
  }

  if (/session\s*(no|not|never)\s*(dey|show|appear)|no\s*session\s*(for|on)\s*(portal|dropdown)|wrong\s*session/i.test(q)) {
    return hit('academic-session', 0.86, ['missing', 'other', 'session'], 'Session missing leftover', 'applying', entities, true)
  }

  if (/(request|apply|submit)\s*(button|tab)\s*(no|not|never)|button\s*(no|not|never)\s*(dey|show|appear)/i.test(q)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'no-button'], 'Request button missing leftover', 'applying', entities, true)
  }

  if (/otp\s*(no|not|never)\s*(dey|come|enter|show)|no\s*otp|otp\s*(expire|expired|wrong)|resend\s*otp/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'otp'], 'OTP leftover', 'applying', entities, true)
  }

  if (/change\s*(my\s*)?(email|phone|number)|wrong\s*(email|phone)|i\s*(put|enter)\s*wrong\s*(email|phone)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'contact-change'], 'Email/phone change leftover', 'applying', entities, true)
  }

  if (/school\s*(say|said)\s*(dem|they)\s*(no|not)\s*(see|get)\s*(my\s*)?(name|record|file)|name\s*(no|not)\s*(dey|show)\s*(for|on)\s*(school|portal)/i.test(q)) {
    return hit('institution-verification', 0.84, ['missing', 'other', 'school-no-see'], 'School cannot see name leftover', 'applying', entities, true)
  }

  if (/how\s*many\s*(students?|people)\s*(don|have)\s*(collect|receive|apply)|total\s*(beneficiar|disburse)|una\s*don\s*pay\s*how\s*many/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('official-sources', 0.8, ['other', 'disbursement-totals'], 'Totals leftover', 'exploring', entities)
  }

  return null
}
