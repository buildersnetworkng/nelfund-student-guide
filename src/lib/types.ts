export type VerificationStatus = 'verified' | 'may_change' | 'guidance' | 'unverified'
export type InformationScope = 'nelfund-wide' | 'institution-specific'

export interface InstitutionTip {
  institution_id: string
  tip: string
}

export interface Source {
  id: string
  label: string
  url: string
  official: boolean
  scope: InformationScope
  institution_id: string | null
}

export interface Institution {
  id: string
  name: string
  short_name: string
  type: string
  state: string
  official_website: string | null
  student_portal: string | null
  nelfund_instructions: string | null
  verified_announcements: string[]
  faq_ids: string[]
  video_ids: string[]
  contact_notes: string | null
  verification_status: VerificationStatus
  last_verified: string | null
}

export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  verification_status: VerificationStatus
  scope: InformationScope
  institution_id: string | null
  source_id: string | null
  last_verified: string | null
  related_video_ids: string[]
  related_guide_ids: string[]
  institution_tips: InstitutionTip[]
}

export interface FaqItem extends KnowledgeItem {
  related_faq_ids: string[]
}

export interface GuideStep {
  step: number
  title: string
  explanation: string
  common_mistake: string
  what_to_check: string
  video_id: string | null
  source_id: string | null
  institution_tips: InstitutionTip[]
}

export interface Guide {
  id: string
  title: string
  summary: string
  steps: GuideStep[]
}

export interface TroubleshootingItem {
  id: string
  problem: string
  icon: string
  category: string
  what_it_usually_means: string
  what_to_do: string[]
  avoid_this: string[]
  video_ids: string[]
  source_id: string
  still_stuck: string
  verification_status: VerificationStatus
  scope: InformationScope
  last_verified: string | null
  institution_id: string | null
}

export interface Video {
  id: string
  title: string
  youtube_id: string
  description: string
  duration_seconds: number | null
  related_guide_ids: string[]
  related_faq_ids: string[]
}

export type ApplicationCycleStatus =
  | 'not_announced'
  | 'open'
  | 'closed'
  | 'extended'
  | 'pending_verification'
  | 'confirm_on_portal'

export interface ApplicationStatus {
  cycle: string
  status: ApplicationCycleStatus
  status_label: string
  note: string
  last_checked: string
  /** ISO date YYYY-MM-DD when a national window is reported to start */
  window_start?: string
  /** ISO date YYYY-MM-DD when a national window is reported to end */
  window_end?: string
  window_note?: string
  source_of_truth?: string[]
  rules?: string[]
}

export interface ReadinessQuestion {
  id: string
  label: string
  helper: string
  institution_id: string | null
}

export interface ScamTip {
  id: string
  tip: string
}

export interface SearchableEntry {
  id: string
  type: 'faq' | 'guide' | 'troubleshooting' | 'video' | 'source' | 'institution'
  title: string
  snippet: string
  keywords: string[]
}

export type IntentId =
  | 'what-is-nelfund'
  | 'nelfund-purpose'
  | 'nelfund-history'
  | 'eligibility'
  | 'how-to-apply'
  | 'portal-login'
  | 'password-reset'
  | 'email-already-used'
  | 'upkeep'
  | 'upkeep-allowance'
  | 'institutional-charges'
  | 'upkeep-vs-fees'
  | 'school-fees'
  | 'institution-verification'
  | 'missing-information'
  | 'school-not-found'
  | 'pending-application'
  | 'jamb-verification'
  | 'documents-needed'
  | 'loan-or-scholarship'
  | 'current-information'
  | 'deadline'
  | 'academic-session'
  | 'repayment'
  | 'gsi'
  | 'scam-safety'
  | 'contact-support'
  | 'contact-lookup'
  | 'nin-verification'
  | 'bank-information'
  | 'email-draft'
  | 'rejected-application'
  | 'reapplication'
  | 'refund'
  | 'guarantor'
  | 'official-sources'
  | 'unknown'

export type ConversationPhase =
  | 'greet'
  | 'diagnose'
  | 'resolve'
  | 'escalate'
  | 'closed'

export interface EscalationContactView {
  url?: string | null
  email?: string | null
  phone?: string | null
  priority?: string | null
  verification_status?: VerificationStatus | null
  why?: string | null
}

export interface GroundedAnswer {
  hasEvidence: boolean
  intent: IntentId | string
  confidence: number
  responseMode?: string
  problem: string | null
  whatThisMeans?: string | null
  answer: string
  nextActions: string[]
  clarifyingQuestions: string[]
  evidence: unknown[]
  sources: { id: string; label: string; url: string; official: boolean }[]
  video: unknown | null
  insufficientReason: string | null
  officialFallbackUrl: string | null
  escalation: unknown | null
}
