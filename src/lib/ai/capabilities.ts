/**
 * Capability router: facts are grounded; conversation is not forced through FAQ.
 */
import type { AgentCapability, IntentId } from './types'

const CAPABILITY_BY_INTENT: Partial<Record<IntentId, AgentCapability>> = {
  'email-draft': 'email-draft',
  'contact-lookup': 'contact-lookup',
  'current-information': 'current-information',
  'contact-support': 'contact-lookup',
  'missing-information': 'troubleshooting',
  'school-not-found': 'troubleshooting',
  'jamb-verification': 'troubleshooting',
  'nin-verification': 'troubleshooting',
  'institution-verification': 'troubleshooting',
  'pending-application': 'troubleshooting',
  'rejected-application': 'troubleshooting',
  'bank-information': 'troubleshooting',
  'profile-update': 'troubleshooting',
  reapplication: 'troubleshooting',
  refund: 'troubleshooting',
  'how-to-apply': 'verified-knowledge',
  eligibility: 'verified-knowledge',
  'documents-needed': 'verified-knowledge',
  'what-is-nelfund': 'verified-knowledge',
  'loan-or-scholarship': 'verified-knowledge',
  upkeep: 'verified-knowledge',
  'school-fees': 'verified-knowledge',
  'institutional-charges': 'verified-knowledge',
  repayment: 'verified-knowledge',
  gsi: 'verified-knowledge',
  guarantor: 'verified-knowledge',
  readiness: 'verified-knowledge',
  'official-sources': 'verified-knowledge',
  'academic-session': 'current-information',
  deadline: 'current-information',
  'scam-safety': 'verified-knowledge',
}

/** Phrases that force generative / contact / research even if base intent is troubleshooting. */
export function detectCapabilityOverride(text: string): AgentCapability | null {
  const t = text.toLowerCase()
  if (
    /draft\s*(me\s*)?(an?\s*)?(email|mail|message|letter)/.test(t) ||
    /write\s*(me\s*)?(an?\s*)?(email|mail|message|letter)/.test(t) ||
    /compose\s*(an?\s*)?(email|mail)/.test(t)
  ) {
    return 'email-draft'
  }
  if (
    /(school|institution|lasu|unilag|oou).{0,40}(email|contact|phone)/.test(t) ||
    /(email|contact|phone).{0,40}(school|institution|lasu|unilag|ict|registry)/.test(t) ||
    /need\s*to\s*contact\s*(my\s*)?(school|institution)/.test(t) ||
    /who\s*(do\s*i|should\s*i)\s*contact/.test(t)
  ) {
    return 'contact-lookup'
  }
  if (
    /as\s*of\s*today|current\s*(info|information|status)|latest\s*(update|news)|what.?s\s*new|has\s*nelfund\s*announced/.test(
      t,
    )
  ) {
    return 'current-information'
  }
  return null
}

export function resolveCapability(intent: IntentId, userText: string): AgentCapability {
  const override = detectCapabilityOverride(userText)
  if (override) return override
  return CAPABILITY_BY_INTENT[intent] || (intent === 'unknown' ? 'conversation' : 'verified-knowledge')
}
