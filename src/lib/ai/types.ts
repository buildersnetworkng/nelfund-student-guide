import type { VerificationStatus, InformationScope } from '../types'

/**
 * Intent taxonomy for the NELFUND support assistant.
 * Extensible: add new intents here and wire patterns + hints + diagnostic copy.
 */
export type IntentId =
  | 'what-is-nelfund'
  | 'nelfund-purpose'
  | 'nelfund-history'
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
  | 'current-information'
  | 'unknown'

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
  /** Normalised topic labels used for retrieval boosts */
  topics: string[]
  /** Short human-readable problem label */
  problem: string | null
  stage: StudentStage
  /** Entities detected in the message (jamb, nin, school, fees, upkeep, etc.) */
  entities: string[]
  /** Whether the message is a troubleshooting symptom vs a pure info question */
  isTroubleshooting: boolean
}

export type EvidenceKind = 'faq' | 'fact' | 'troubleshooting' | 'guide' | 'video' | 'source' | 'scam'

/**
 * A single piece of verified knowledge retrieved for a question.
 * The answer layer may ONLY state claims present in these records.
 */
export interface EvidenceItem {
  kind: EvidenceKind
  id: string
  title: string
  /** Primary factual text the answer may use */
  body: string
  verification_status: VerificationStatus
  scope: InformationScope
  institution_id: string | null
  source_id: string | null
  last_verified: string | null
  related_video_ids: string[]
  /** Optional structured steps (troubleshooting / guide) */
  steps?: string[]
  still_stuck?: string | null
  what_it_usually_means?: string | null
}

export interface AnswerSource {
  id: string
  label: string
  url: string
  official: boolean
}

export interface AnswerVideo {
  id: string
  title: string
  url: string
  channel: string
  source_type: string
  verification_status: VerificationStatus
  warning?: string | null
  freshness_note?: string | null
}

export interface EscalationContactView {
  name: string
  role?: string
  email?: string
  phone?: string
  note?: string
}

export interface EscalationPlanView {
  needed: boolean
  needsInstitution?: boolean
  institutionContacts?: EscalationContactView[]
  nelfundContacts?: EscalationContactView[]
  supportMessage?: string | null
}

export interface GroundedAnswer {
  hasEvidence: boolean
  intent: IntentId
  confidence: number
  problem: string | null
  answer: string
  whatThisMeans?: string
  nextActions: string[]
  clarifyingQuestions: string[]
  evidence: EvidenceItem[]
  sources: AnswerSource[]
  video: AnswerVideo | null
  insufficientReason: string | null
  officialFallbackUrl: string
  escalation: EscalationPlanView | null
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  intent?: IntentId
}
