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
  refund: 'troubleshooting',
  'scam-safety': 'troubleshooting',
  'what-is-nelfund': 'verified-knowledge',
  'nelfund-purpose': 'verified-knowledge',
  'nelfund-history': 'verified-knowledge',
  eligibility: 'verified-knowledge',
  'how-to-apply': 'verified-knowledge',
  'documents-needed': 'verified-knowledge',
  upkeep: 'verified-knowledge',
  'school-fees': 'verified-knowledge',
  'institutional-charges': 'verified-knowledge',
  repayment: 'verified-knowledge',
  gsi: 'verified-knowledge',
  'loan-or-scholarship': 'verified-knowledge',
  readiness: 'verified-knowledge',
  'official-sources': 'verified-knowledge',
  'portal-login': 'portal-login',
  guarantor: 'verified-knowledge',
  'academic-session': 'current-information',
  deadline: 'current-information',
  reapplication: 'troubleshooting',
}

export function detectCapabilityOverride(text: string): AgentCapability | null {
  const t = text.toLowerCase()
  if (/draft|write\s*(an?\s*)?(email|message|letter)/i.test(t)) return 'email-draft'
  if (
    /(who\s*(do\s*i|should\s*i)\s*contact|find\s*(the\s*)?(contact|email)|school.?s?\s*email)/i.test(
      t,
    )
  )
    return 'contact-lookup'
  if (/(as\s*of\s*today|latest\s*update|is\s*(nelfund|application)\s*open)/i.test(t))
    return 'current-information'
  if (/(which\s*(link|url|website).{0,30}(login|application)|continue\s*(my\s*)?application)/i.test(t))
    return 'portal-login'
  // Factual knowledge — never treat as vague troubleshooting
  if (
    /(when\s*(was\s*)?nelfund|who\s*(built|created|established|founded)\s*nelfund|purpose\s*of\s*nelfund|history\s*of\s*nelfund|student\s*loans?\s*act)/i.test(
      t,
    )
  )
    return 'verified-knowledge'
  return null
}

export function resolveCapability(intent: IntentId, userText: string): AgentCapability {
  const override = detectCapabilityOverride(userText)
  if (override) return override
  return CAPABILITY_BY_INTENT[intent] || (intent === 'unknown' ? 'conversation' : 'verified-knowledge')
}
