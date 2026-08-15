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
import institutionContactsRaw from '../data/institution-contacts.json'

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
  InstitutionContact,
  NationalSupportContact,
} from './types'

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

export const institutionContactsData = institutionContactsRaw as {
  version: number
  problem_routing: Record<string, string[]>
  office_labels: Record<string, string>
  nelfund_support: NationalSupportContact[]
  institutions: { institution_id: string; contacts: InstitutionContact[] }[]
}

export function getInstitutionContacts(institutionId: string | null): InstitutionContact[] {
  if (!institutionId) return []
  const row = institutionContactsData.institutions.find((i) => i.institution_id === institutionId)
  return row?.contacts ?? []
}

export function getNelfundSupportContacts(): NationalSupportContact[] {
  return institutionContactsData.nelfund_support
}

export function getProblemRouting(intent: string): string[] {
  return institutionContactsData.problem_routing[intent] ?? ['helpdesk', 'ict']
}

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

export function isContentVisible(item: ScopedItem, institutionId: string | null): boolean {
  if (item.scope === 'nelfund-wide') return true
  return institutionId !== null && item.institution_id === institutionId
}

export function getRelevantContent<T extends ScopedItem>(
  items: T[],
  institutionId: string | null,
): T[] {
  return items.filter((item) => isContentVisible(item, institutionId))
}

export function findInstitutionTip(
  tips: InstitutionTip[],
  institutionId: string | null,
): InstitutionTip | null {
  if (!institutionId) return null
  return tips.find((t) => t.institution_id === institutionId) ?? null
}

export function getRecommendedVideos(videoIds: string[], institutionId: string | null = null): Video[] {
  const withUrls = getVideosByIds(videoIds).filter((v) => v.url)
  return getRelevantContent(withUrls, institutionId)
}
