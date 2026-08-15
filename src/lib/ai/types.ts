import type { VerificationStatus, InformationScope } from '../types'

/** Student intents the assistant can resolve against the verified knowledge layer. */
export type IntentId =
  | 'what-is-nelfund'
  | 'loan-or-scholarship'
  | 'how-to-apply'
  | 'documents-needed'
  | 'upkeep-amount'
  | 'fees-payment'
  | 'already-paid-fees'
  | 'school-not-showing'
  | 'no-school-info'
  | 'application-pending'
  | 'application-rejected'
  | 'repayment'
  | 'guarantor'
  | 'scam-safety'
  | 'readiness'
  | 'official-sources'
  | 'unknown'

export interface IntentResult {
  intent: IntentId
  confidence: number
  /** Normalised topic labels used for retrieval boosts */
  topics: string[]
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
  avoid?: string[]
  still_stuck?: string
  path: string
  /** Retrieval score for ranking */
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
  /** False when the knowledge layer lacked sufficient evidence */
  hasEvidence: boolean
  intent: IntentId
  /** Short direct answer built only from evidence */
  answer: string
  /** Plain-language meaning when useful */
  whatThisMeans: string | null
  /** Concrete next steps for the student */
  nextActions: string[]
  /** Evidence items that backed the answer */
  evidence: EvidenceItem[]
  /** Attributed sources (official preferred) */
  sources: AnswerSource[]
  /** Relevant YouTube guide from the verified video catalogue */
  video: AnswerVideo | null
  /** When hasEvidence is false, why / where to go */
  insufficientReason: string | null
  officialFallbackUrl: string
}
