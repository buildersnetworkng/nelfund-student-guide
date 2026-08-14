import sourcesRaw from '../data/sources.json'
import applicationStatusRaw from '../data/application-status.json'
import nelfundRaw from '../data/nelfund.json'
import faqRaw from '../data/faq.json'
import troubleshootingRaw from '../data/troubleshooting.json'
import videosRaw from '../data/videos.json'
import guidesRaw from '../data/guides.json'
import readinessRaw from '../data/readiness.json'
import scamPreventionRaw from '../data/scam-prevention.json'
import institutionsRaw from '../data/institutions.json'

import type {
  Source,
  ApplicationStatus,
  KnowledgeItem,
  FaqItem,
  TroubleshootingItem,
  Video,
  Guide,
  ReadinessQuestion,
  ScamTip,
  Institution,
  InstitutionTip,
  InformationScope,
} from './types'

/** Anything filterable by the shared national/institution content-scope model. */
interface ScopedItem {
  scope: InformationScope
  institution_id: string | null
}

export const sources = sourcesRaw as Source[]
export const applicationStatus = applicationStatusRaw as ApplicationStatus
export const nelfundFacts = nelfundRaw as KnowledgeItem[]
export const faqs = faqRaw as FaqItem[]
export const troubleshootingItems = troubleshootingRaw as TroubleshootingItem[]
export const videos = videosRaw as Video[]
export const guides = guidesRaw as Guide[]
export const readinessQuestions = readinessRaw as ReadinessQuestion[]
export const scamTips = scamPreventionRaw as ScamTip[]
export const institutions = institutionsRaw as Institution[]

export function getSource(id: string | null): Source | null {
  if (!id) return null
  return sources.find((s) => s.id === id) ?? null
}

export function getInstitution(id: string | null): Institution | null {
  if (!id) return null
  return institutions.find((i) => i.id === id) ?? null
}

export function getVideo(id: string | null): Video | null {
  if (!id) return null
  return videos.find((v) => v.id === id) ?? null
}

export function getVideosByIds(ids: string[]): Video[] {
  return ids.map((id) => getVideo(id)).filter((v): v is Video => v !== null)
}

export function getFaqsByIds(ids: string[]): FaqItem[] {
  return ids.map((id) => faqs.find((f) => f.id === id)).filter((f): f is FaqItem => !!f)
}

export function getGuide(id: string): Guide | null {
  return guides.find((g) => g.id === id) ?? null
}

export function getTroubleshootingItem(id: string | null): TroubleshootingItem | null {
  if (!id) return null
  return troubleshootingItems.find((t) => t.id === id) ?? null
}

/**
 * Single-item version of the same content-scope rule used by
 * getRelevantContent(). Used to authorize direct access to a specific item
 * (e.g. a detail page reached by URL/id), where a list-level filter never
 * runs, so a URL can't be used to bypass institution scoping.
 */
export function isContentVisible(item: ScopedItem, institutionId: string | null): boolean {
  if (item.scope === 'nelfund-wide') return true
  return institutionId !== null && item.institution_id === institutionId
}

/**
 * The single reusable content-scope filter used by every list/search surface
 * (FAQs, guides, troubleshooting, videos, sources, announcements) so scope
 * rules never have to be reimplemented per-component.
 *
 * - No institution selected  -> only NELFUND-wide ("national") content.
 * - An institution selected  -> NELFUND-wide content + that institution's
 *   own institution-specific content. Another institution's content is
 *   never included, so it can never leak to students who didn't select it.
 */
export function getRelevantContent<T extends ScopedItem>(
  items: T[],
  institutionId: string | null,
): T[] {
  return items.filter((item) => isContentVisible(item, institutionId))
}

/**
 * Finds the institution-specific overlay note (if any) that matches the
 * currently selected institution, out of a NELFUND-wide item's
 * institution_tips. Used by InstitutionTip.tsx so generic content can carry
 * a small institution-specific addendum without hardcoding that
 * institution's name into the shared text itself.
 */
export function findInstitutionTip(
  tips: InstitutionTip[],
  institutionId: string | null,
): InstitutionTip | null {
  if (!institutionId) return null
  return tips.find((t) => t.institution_id === institutionId) ?? null
}

/**
 * Returns the videos relevant to a piece of content, given a list of
 * candidate video ids. Used by RecommendedVideo to power the
 * "🎥 Recommended Video" pattern that appears under guides, FAQs, and
 * troubleshooting results. Returns an empty array (not null) when there is
 * nothing to show — the caller decides how to render that "no video yet"
 * state, rather than this helper guessing or substituting anything.
 *
 * Also enforces content scope: a recommendation embedded inside a
 * NELFUND-wide guide step/FAQ/troubleshooting entry must never surface an
 * institution-specific video to a student who hasn't selected that
 * institution, even though the candidate id list itself isn't scope-aware.
 */
export function getRecommendedVideos(videoIds: string[], institutionId: string | null = null): Video[] {
  const withUrls = getVideosByIds(videoIds).filter((v) => v.url) // only videos with a real URL count as "available"
  return getRelevantContent(withUrls, institutionId)
}
