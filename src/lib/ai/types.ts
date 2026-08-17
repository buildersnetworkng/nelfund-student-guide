import type { VerificationStatus, InformationScope } from '../types'

export type IntentId =
  | 'what-is-nelfund'
  | 'loan-or-scholarship'
  | 'how-to-apply'
  | 'eligibility'
  | 'documents-needed'
  | 'nin-verification'
  | 'jamb-verification'
  | 'missing-information'
  | 'school-not-found'
  | 'institution-verification'
  | 'pending-application'
  | 'rejected-application'
  | 'profile-update'
  | 'bank-information'
  | 'upkeep'
  | 'institutional-charges'
  | 'school-fees'
  | 'refund'
  | 'reapplication'
  | 'repayment'
  | 'gsi'
  | 'academic-session'
  | 'deadline'
  | 'contact-support'
  | 'scam-safety'
  | 'readiness'
  | 'official-sources'
  | 'guarantor'
  | 'email-draft'
  | 'contact-lookup'
  | 'current-information'
  | 'unknown'

/** What kind of work the agent should do for this turn. */
export type AgentCapability =
  | 'verified-knowledge'
  | 'troubleshooting'
  | 'contact-lookup'
  | 'email-draft'
  | 'current-information'
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

export type EvidenceKind = 'faq' | 'fact' | 'troubleshooting' | 'guide' | 'video' | 'source' | 'scam'

export interface EvidenceItem {
  kind: EvidenceKind
  id: string
  title: string
  body: string
  verification_status: VerificationStatus
  scope: InformationScope
  institution_id: string | null
  source_id: string | null
  last_verified: string | null
  related_video_ids: string[]
  steps?: string[]
  avoid?: string[]
  still_stuck?: string
  path: string
  score: number
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

export interface AnswerSource {
  id: string
  label: string
  url: string | null
  official: boolean
}

export interface GroundedAnswer {
  hasEvidence: boolean
  intent: IntentId
  confidence: number
  /** Which capability produced this answer (optional until full orchestrator is deployed) */
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
  /** Generated email/letter when responseMode is email-draft */
  draft?: { subject: string; body: string } | null
}

export interface EscalationContactView {
  id: string
  label: string
  office: string
  why: string
  email: string | null
  phone: string | null
  url: string | null
  verification_status: VerificationStatus
  notes: string | null
  priority: 'primary' | 'secondary' | 'national'
}

export interface EscalationPlanView {
  needsInstitution: boolean
  institutionId: string | null
  institutionName: string | null
  understanding: string
  diagnosis: string[]
  institutionContacts: EscalationContactView[]
  nelfundContacts: EscalationContactView[]
  evidenceChecklist: string[]
  supportMessage: { subject: string; body: string } | null
  followUp: string | null
  screenshotAdvice: string
  contactOrderExplanation?: string | null
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  intent?: IntentId
}
