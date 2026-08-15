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
  source_id: string | null
  still_stuck: string
  verification_status: VerificationStatus
  scope: InformationScope
  institution_id: string | null
  last_verified: string | null
}

export type VideoSourceType = 'official' | 'university' | 'educational' | 'community' | 'third_party'

export interface Video {
  id: string
  title: string
  url: string
  channel_url: string | null
  thumbnail_url: string | null
  category: string
  related_problem: string | null
  description: string
  channel: string
  source_type: VideoSourceType
  verification_status: VerificationStatus
  scope: InformationScope
  institution_id: string | null
  quality_rating: number | null
  recommended: boolean
  freshness_note: string | null
  warning: string | null
  published_at: string | null
  date_added: string
  last_reviewed: string | null
  related_knowledge_ids: string[]
}

export type ApplicationCycleStatus =
  | 'not_announced'
  | 'open'
  | 'closed'
  | 'extended'
  | 'pending_verification'

export interface ApplicationStatus {
  cycle: string
  status: ApplicationCycleStatus
  status_label: string
  note: string
  last_checked: string
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
  path: string
}

export interface SearchSuggestion {
  label: string
  query: string
}

export type ContactOffice =
  | 'ict'
  | 'student_records'
  | 'registry'
  | 'admissions'
  | 'bursary'
  | 'student_affairs'
  | 'nelfund_desk'
  | 'helpdesk'

export interface InstitutionContact {
  id: string
  institution_id: string
  office: ContactOffice
  label: string
  email: string | null
  phone: string | null
  url: string | null
  purpose: string
  handles: string[]
  verification_status: VerificationStatus
  source_url: string | null
  source_type: string | null
  last_verified: string | null
  notes: string | null
}

export interface NationalSupportContact {
  id: string
  label: string
  url: string | null
  email: string | null
  phone: string | null
  purpose: string
  handles: string[]
  verification_status: VerificationStatus
  source_url: string | null
  source_type: string | null
  last_verified: string | null
  notes: string | null
}
