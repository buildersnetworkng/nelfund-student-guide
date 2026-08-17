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
  nelfund_support: import('./types').NationalSupportContact[]
  institutions: { institution_id: string; contacts: import('./types').InstitutionContact[] }[]
}

/** Build safe guidance contacts from an institution's official website when no curated row exists. */
function synthesizeInstitutionContacts(
  institutionId: string,
): import('./types').InstitutionContact[] {
  const inst = getInstitution(institutionId)
  const website = inst?.official_website || null
  if (!website) return []
  const note =
    'No dedicated unit email is stored in this guide. Confirm the correct contact on the institution official website before writing.'
  const base = {
    institution_id: institutionId,
    email: null as string | null,
    phone: null as string | null,
    url: website,
    verification_status: 'guidance' as const,
    source_url: website,
    source_type: 'official_website',
    last_verified: '2026-08-17',
  }
  return [
    {
      ...base,
      id: `${institutionId}-ict`,
      office: 'ict',
      label: 'ICT / Information Technology',
      purpose: 'Portal access, system data, student record upload and technical verification issues.',
      handles: [
        'missing-information',
        'school-not-found',
        'jamb-verification',
        'nin-verification',
        'institution-verification',
        'pending-application',
        'bank-information',
        'profile-update',
      ],
      notes: note,
    },
    {
      ...base,
      id: `${institutionId}-nelfund-desk`,
      office: 'nelfund_desk',
      label: 'Institutional NELFUND coordination',
      purpose: 'Campus coordination of NELFUND verification submissions.',
      handles: [
        'missing-information',
        'pending-application',
        'rejected-application',
        'institution-verification',
      ],
      notes: null,
    },
    {
      ...base,
      id: `${institutionId}-registry`,
      office: 'registry',
      label: 'Registry',
      purpose: 'Official registration and institutional student records.',
      handles: [
        'missing-information',
        'school-not-found',
        'jamb-verification',
        'institution-verification',
      ],
      notes: 'Confirm the correct unit contact on the official website.',
    },
  ]
}

export function getInstitutionContacts(institutionId: string | null): import('./types').InstitutionContact[] {
  if (!institutionId) return []
  const row = institutionContactsData.institutions.find((i) => i.institution_id === institutionId)
  if (row?.contacts?.length) return row.contacts
  // Fallback: derive website-only guidance contacts so every listed institution can escalate safely.
  return synthesizeInstitutionContacts(institutionId)
}

/** Verified national NELFUND support channels (official ticket portal + published email). */
const VERIFIED_NELFUND_SUPPORT: import('./types').NationalSupportContact[] = [
  {
    id: 'nelfund-esupport-ticket',
    label: 'NELFUND Support Ticket',
    url: 'https://nelfund.esupport.ng/create',
    email: null,
    phone: null,
    purpose: 'Official complaints and support ticket portal for application, verification, and disbursement issues.',
    handles: [
      'missing-information',
      'school-not-found',
      'jamb-verification',
      'nin-verification',
      'institution-verification',
      'pending-application',
      'rejected-application',
      'refund',
      'bank-information',
      'profile-update',
      'reapplication',
      'contact-support',
      'school-fees',
      'institutional-charges',
    ],
    verification_status: 'verified',
    source_url: 'https://nelfund.esupport.ng/create',
    source_type: 'official_support_portal',
    last_verified: '2026-08-16',
    notes: 'Official NELFUND e-support ticket system. Preferred channel for tracked complaints.',
  },
  {
    id: 'nelfund-client-support-email',
    label: 'NELFUND Client Support',
    url: null,
    email: 'clientsupport@nelf.gov.ng',
    phone: null,
    purpose: 'Official client support email published by NELFUND for inquiries and portal assistance.',
    handles: [
      'missing-information',
      'school-not-found',
      'jamb-verification',
      'nin-verification',
      'pending-application',
      'rejected-application',
      'refund',
      'contact-support',
      'profile-update',
      'bank-information',
    ],
    verification_status: 'verified',
    source_url: 'https://nelf.gov.ng/',
    source_type: 'official_channel',
    last_verified: '2026-08-16',
    notes: 'Published by official NELFUND communications. Do not share passwords, OTPs, or PINs.',
  },
  {
    id: 'nelfund-portal-support',
    label: 'NELFUND application portal',
    url: 'https://portal.nelf.gov.ng/',
    email: null,
    phone: null,
    purpose: 'Application status, verification, and portal-side issues.',
    handles: [
      'pending-application',
      'rejected-application',
      'jamb-verification',
      'missing-information',
      'school-not-found',
      'institution-verification',
      'how-to-apply',
    ],
    verification_status: 'verified',
    source_url: 'https://portal.nelf.gov.ng/',
    source_type: 'official_portal',
    last_verified: '2026-08-16',
    notes: 'Use only the official portal. Do not share OTP, passwords, or PINs.',
  },
  {
    id: 'nelfund-website-support',
    label: 'NELFUND official website',
    url: 'https://nelf.gov.ng/',
    email: null,
    phone: null,
    purpose: 'Official announcements, policy information, and published support channels.',
    handles: ['what-is-nelfund', 'repayment', 'upkeep', 'contact-support', 'official-sources'],
    verification_status: 'verified',
    source_url: 'https://nelf.gov.ng/',
    source_type: 'official_website',
    last_verified: '2026-08-16',
    notes: 'Confirm any contact channels published on the official website before use.',
  },
]

export function getNelfundSupportContacts() {
  const ids = new Set(VERIFIED_NELFUND_SUPPORT.map((c) => c.id))
  const extras = institutionContactsData.nelfund_support.filter((c) => !ids.has(c.id))
  return [...VERIFIED_NELFUND_SUPPORT, ...extras]
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
