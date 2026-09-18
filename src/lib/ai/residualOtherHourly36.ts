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

/**
 * Hour-36 leftover catcher: lifetime other 324 still dominates unknown buckets.
 * Contact lines, OTP, last-year reapply, agents, transfer, BVN mismatch.
 */
export function residualOtherHourly36(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(dis|this)\s*(nelfund|loan|scheme)|nelfund\s*stand\s*for|why\s*(una|dem|fg)\s*(create|form|bring)\s*(am|nelfund)/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.9, ['what-is', 'other'], 'Why create leftover 36', 'exploring', entities)
  }

  if (
    /customer\s*care|phone\s*(number|no|line)|whatsapp\s*(number|group|link)|office\s*address|head\s*office|call\s*nelfund|nelfund\s*(number|hotline)|who\s*(do\s*i|to)\s*call/i.test(
      q,
    )
  ) {
    return hit('contact-support', 0.9, ['other'], 'Phone / WhatsApp / office leftover 36', 'exploring', entities)
  }

  if (
    /otp\s*(no|not|never|no\s*dey)|verification\s*code\s*(no|not|never)|code\s*(no|not)\s*(enter|come|reach)|resend\s*(otp|code)|otp\s*(expire|expired)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login', 'other'], 'OTP leftover 36', 'applying', entities, true)
  }

  if (
    /bvn\s*(no|not|never|invalid|mismatch|no\s*gree)|nin\s*(no|not|never|invalid|mismatch|no\s*gree)|name\s*(no|not)\s*match\s*(bvn|nin)/i.test(
      q,
    )
  ) {
    return hit('nin-verification', 0.88, ['other'], 'BVN / NIN leftover 36', 'applying', entities, true)
  }

  if (
    /apply\s*(last\s*)?(year|session)|last\s*(year|session)\s*(i\s*)?(apply|applied)|reapply|re-apply|this\s*(year|session)\s*(again|too)|second\s*time/i.test(
      q,
    ) &&
    !/email\s*(already|used)/i.test(q)
  ) {
    return hit('reapplication', 0.86, ['other'], 'Last year apply leftover 36', 'applying', entities)
  }

  if (
    /change\s*(of\s*)?(school|institution|course)|i\s*(don|have)\s*transfer|new\s*school\s*(now|this\s*year)|i\s*leave\s*(that|old)\s*school/i.test(
      q,
    )
  ) {
    return hit('profile-update', 0.86, ['other'], 'Transfer / change school leftover 36', 'applying', entities, true)
  }

  if (
    /(pay|paid)\s*(an?\s*)?agent|agent\s*(wan|want|say)|buy\s*(slot|form)|nelfund\s*agent|dem\s*say\s*make\s*i\s*pay/i.test(
      q,
    )
  ) {
    return hit('scam-safety', 0.92, ['other'], 'Agent payment leftover 36', 'exploring', entities)
  }

  if (
    /draft\s*(an?\s*)?(email|mail)|write\s*(the\s*)?(email|mail)|compose\s*(an?\s*)?email|help\s*me\s*write/i.test(q)
  ) {
    return hit('email-draft', 0.86, ['other'], 'Draft email leftover 36', 'applying', entities)
  }

  if (
    /freshers?|100\s*level|just\s*(got|collect)\s*admission|new\s*student\s*(fit|can)|i\s*just\s*enter\s*(school|uni)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['other'], 'Fresher leftover 36', 'exploring', entities)
  }

  if (
    /\bnd\b|\bhnd\b|\bnce\b|vocational|part[\s-]*time|sandwich/i.test(q) &&
    /(fit|can|eligible|apply|qualify)/i.test(q)
  ) {
    return hit('eligibility', 0.86, ['other'], 'ND/HND/NCE leftover 36', 'exploring', entities)
  }

  if (/when\s*(go|will)\s*(dem|they|una)?\s*(open|start|begin)|2026\s*\/\s*2027\s*(open|start)/i.test(q)) {
    return hit('current-information', 0.88, ['open-status', 'other'], 'When open leftover 36', 'applying', entities)
  }

  return null
}
