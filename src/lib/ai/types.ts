export type VerificationStatus = 'verified' | 'may_change' | 'guidance' | 'unverified'
export type InformationScope = 'nelfund-wide' | 'institution-specific'

export type IntentId =
  | 'what-is-nelfund'
  | 'eligibility'
  | 'how-to-apply'
  | 'documents-needed'
  | 'jamb-verification'
  | 'nin-verification'
  | 'missing-information'
  | 'school-not-found'
  | 'institution-verification'
  | 'pending-application'
  | 'rejected-application'
  | 'refund'
  | 'upkeep'
  | 'school-fees'
  | 'institutional-charges'
  | 'repayment'
  | 'gsi'
  | 'loan-or-scholarship'
  | 'bank-information'
  | 'profile-update'
  | 'scam-safety'
  | 'readiness'
  | 'official-sources'
  | 'portal-login'
  | 'guarantor'
  | 'email-draft'
  | 'contact-lookup'
  | 'current-information'
  | 'contact-support'
  | 'academic-session'
  | 'deadline'
  | 'reapplication'
  | 'unknown'

/** What kind of work the agent should do for this turn. */
export type AgentCapability =
  | 'verified-knowledge'
  | 'troubleshooting'
  | 'contact-lookup'
  | 'email-draft'
  | 'current-information'
  | 'portal-login'
  | 'conversation'

export type StudentStage =
  | 'exploring'
  | 'preparing'
  | 'applying'
  | 'waiting'
  | 'rejected'
  | 'approved'
  | 'repaying'
  | 'unknown'

export interface IntentResult {
  intent: IntentId
  confidence: number
  topics: string[]
  problem: string | null
  stage: StudentStage
  entities: string[]
  isTroubleshooting: boolean
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  intent?: IntentId
}

export interface EvidenceItem {
  id: string
  kind: 'faq' | 'fact' | 'troubleshooting' | 'guide' | 'scam' | 'video'
  title: string
  body: string
  score: number
  verification_status: VerificationStatus
  source_id: string | null
  steps?: string[]
  avoid?: string[]
  still_stuck?: string
}

export interface AnswerSource {
  id: string
  label: string
  url: string | null
  official: boolean
}

export interface AnswerVideo {
  id: string
  title: string
  url: string
  channel: string
  source_type: string
  verification_status: VerificationStatus
  warning: string | null
  freshness_note: string | null
}

export interface EscalationContactView {
  id: string
  label: string
  email: string | null
  phone: string | null
  url: string | null
  why: string
  priority: string
  verification_status: VerificationStatus
  office?: string
}

export interface EscalationPlanView {
  needsInstitution: boolean
  institutionId: string | null
  institutionName: string | null
  institutionContacts: EscalationContactView[]
  nelfundContacts: EscalationContactView[]
  understanding?: string
  diagnosis?: string[]
  contactOrderExplanation?: string | null
}

export interface GroundedAnswer {
  hasEvidence: boolean
  intent: IntentId
  confidence: number
  responseMode?: AgentCapability
  problem: string | null
  answer: string
  whatThisMeans: string | null
  nextActions: string[]
  clarifyingQuestions: string[]
  evidence: EvidenceItem[]
  sources: AnswerSource[]
  video: AnswerVideo | null
  insufficientReason: string | null
  officialFallbackUrl: string
  escalation: EscalationPlanView | null
  draft?: { subject: string; body: string } | null
}
