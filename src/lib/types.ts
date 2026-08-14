// Every fact-bearing item in this app carries a verification status so the
// UI can always show the student how much to trust it. Nothing in /src/data
// should be displayed without one of these labels attached.
//
//   verified   -> ✓ Verified            supported by an official source
//   may_change -> ⚠ May Change          official-ish, but tied to a session,
//                                        institutional procedure, or future
//                                        announcement that can shift it
//   guidance   -> ⓘ General Guidance    a useful explanation this guide put
//                                        together; confirm before relying on it
//   unverified -> ❗ Unverified          no official source at all; do not
//                                        present as fact
export type VerificationStatus = 'verified' | 'may_change' | 'guidance' | 'unverified'

// Distinguishes rules that apply to every NELFUND applicant nationwide from
// procedures that are specific to how one institution handles its own
// students. Never assume a NELFUND-wide rule automatically covers an
// institution-specific step, or that one institution's procedure applies to
// another. When scope is 'institution-specific', institution_id says which one.
export type InformationScope = 'nelfund-wide' | 'institution-specific'

// A small overlay note attached to otherwise-generic NELFUND-wide content
// (a guide step, a fact, an FAQ). Content stays neutral and usable by every
// student; a matching tip only appears for students who selected that
// specific institution. This is how "generic content + institution overlay"
// stays dynamic without ever hardcoding an institution name into the
// NELFUND-wide text itself. See src/components/InstitutionTip.tsx.
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

// A tertiary institution the guide has (or could eventually have) dedicated
// coverage for. OOU is the only fully-developed record for now — every other
// entry is intentionally a minimal, mostly-null stub so the app never implies
// verified institution-specific guidance that doesn't actually exist yet.
// See src/data/institutions.json and README section "Adding a new institution".
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
  // Only meaningful when scope is 'nelfund-wide' — institution_id above is
  // for genuinely institution-owned content. institution_tips lets a
  // NELFUND-wide item stay neutral while still surfacing an institution's
  // own wrinkle on it to students who selected that institution.
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

// official    -> published by NELFUND itself
// university  -> published by an institution (OOU or another)
// educational -> a broader education-focused channel, not NELFUND/institution,
//                but editorially reliable (e.g. an established news outlet)
// community   -> an individual student or creator's own tutorial
// third_party -> any other unofficial source
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
  // 1-5 editorial quality score assigned during curation research, or null
  // if the video hasn't been through that review (e.g. an unfilled placeholder).
  quality_rating: number | null
  // Whether this video is currently recommended to students, as distinct
  // from merely being catalogued. A curated video can exist in the data set
  // without being surfaced as a primary recommendation.
  recommended: boolean
  // Short free-text note on how current/dated the video's content is
  // (portal UI version, contact details, etc.) — purely descriptive, shown
  // to editors/maintainers rather than necessarily rendered to students.
  freshness_note: string | null
  // A short caution shown directly in the UI next to the video (e.g. "uses
  // an older portal UI"), kept separate from freshness_note so only the
  // student-facing caution is ever rendered.
  warning: string | null
  // The video's actual YouTube publish date, distinct from date_added
  // (when this guide's data set started tracking it).
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
  // null = shown to every student (a universal preparation item). A real
  // institution id = an additional item shown only to students who selected
  // that institution, on top of the universal ones — this is what makes the
  // readiness checklist's score and question count dynamically institution-aware.
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
