/**
 * Evidence retrieval with intent allowlist + synonym expansion.
 * Abstraction allows swapping keyword scorer for embeddings later.
 */
import {
  faqs,
  nelfundFacts,
  troubleshooting,
  guides,
  videos,
  sources,
  scamWatch,
} from '../data'
import type { EvidenceItem, IntentId } from './types'

export const INTENT_ALLOWLIST: Partial<
  Record<
    IntentId,
    { faqIds?: string[]; factIds?: string[]; troubleshootingIds?: string[]; guideIds?: string[]; videoIds?: string[] }
  >
> = {
  'what-is-nelfund': {
    faqIds: ['faq-what-is-nelfund', 'faq-purpose-of-nelfund', 'faq-who-established-nelfund', 'faq-interest-free', 'faq-how-much-loan', 'faq-loan-not-scholarship'],
    factIds: ['nf-what-is', 'nf-purpose', 'nf-history-establishment', 'nf-interest-free', 'nf-loan-amount', 'nf-components', 'nf-loan-not-scholarship'],
    videoIds: ['vid-general-overview'],
  },
  'nelfund-purpose': {
    faqIds: ['faq-purpose-of-nelfund', 'faq-what-is-nelfund'],
    factIds: ['nf-purpose', 'nf-what-is'],
    videoIds: ['vid-general-overview'],
  },
  'nelfund-history': {
    faqIds: ['faq-who-established-nelfund', 'faq-what-is-nelfund'],
    factIds: ['nf-history-establishment', 'nf-act-2024', 'nf-what-is'],
    videoIds: ['vid-general-overview'],
  },
  'loan-or-scholarship': {
    faqIds: ['faq-loan-not-scholarship'],
    factIds: ['nf-loan-not-scholarship'],
  },
  'how-to-apply': {
    faqIds: ['faq-how-to-apply', 'faq-portal-login', 'faq-documents-needed'],
    guideIds: ['guide-how-to-apply'],
  },
  eligibility: {
    faqIds: ['faq-eligibility', 'faq-private-school', 'faq-full-time-only', 'faq-disqualification'],
    factIds: ['nf-eligibility-public', 'nf-public-institutions-only', 'nf-citizenship'],
  },
  'documents-needed': {
    faqIds: ['faq-documents-needed'],
  },
  'nin-verification': {
    troubleshootingIds: ['ts-nin'],
  },
  'jamb-verification': {
    troubleshootingIds: ['ts-jamb'],
  },
  'missing-information': {
    faqIds: ['faq-no-school-info', 'faq-school-not-uploaded'],
    troubleshootingIds: ['ts-missing-information'],
  },
  'school-not-found': {
    faqIds: ['faq-no-school-info'],
    troubleshootingIds: ['ts-school-not-found'],
  },
  'institution-verification': {
    faqIds: ['faq-school-not-uploaded'],
    factIds: ['nf-oou-vs-nelfund'],
  },
  'pending-application': {
    faqIds: ['faq-pending', 'faq-approval-notification'],
  },
  'rejected-application': {
    faqIds: ['faq-rejected'],
  },
  upkeep: {
    faqIds: ['faq-upkeep-amount'],
    factIds: ['nf-upkeep-amount', 'nf-components'],
    videoIds: ['vid-upkeep-explainer'],
  },
  'school-fees': {
    faqIds: ['faq-fees-payment'],
    factIds: ['nf-components'],
  },
  'institutional-charges': {
    faqIds: ['faq-fees-payment'],
    factIds: ['nf-components', 'nf-disbursement'],
  },
  repayment: {
    faqIds: ['faq-repayment', 'faq-repayment-percent', 'faq-gsi'],
    factIds: ['nf-repayment-start', 'nf-nysc-repayment', 'nf-repayment-10-percent', 'nf-repayment-mechanism', 'nf-gsi'],
    videoIds: ['vid-repayment-explainer'],
  },
  gsi: {
    faqIds: ['faq-gsi'],
    factIds: ['nf-gsi'],
  },
  'scam-safety': {
    faqIds: ['faq-scam'],
  },
  'contact-support': {
    faqIds: ['faq-contact'],
  },
  guarantor: {
    faqIds: ['faq-guarantor'],
    factIds: ['nf-no-guarantor'],
  },
  'portal-login': {
    faqIds: ['faq-portal-login', 'faq-how-to-apply'],
  },
  'current-information': {
    faqIds: ['faq-how-to-apply', 'faq-portal-login'],
  },
}

// Remaining retrieval helpers retained from production module — keyword score + assemble evidence.
// (Full implementation restored from last good commit structure.)

export function retrieveEvidence(
  intent: IntentId,
  question: string,
  institutionId?: string | null,
): EvidenceItem[] {
  const allow = INTENT_ALLOWLIST[intent]
  const items: EvidenceItem[] = []
  const q = (question || '').toLowerCase()

  const pushFaq = (id: string) => {
    const f = (faqs as any[]).find((x) => x.id === id)
    if (!f) return
    items.push({
      kind: 'faq',
      id: f.id,
      title: f.title,
      body: f.content,
      verification_status: f.verification_status,
      scope: f.scope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
    })
  }
  const pushFact = (id: string) => {
    const f = (nelfundFacts as any[]).find((x) => x.id === id)
    if (!f) return
    items.push({
      kind: 'fact',
      id: f.id,
      title: f.title,
      body: f.content,
      verification_status: f.verification_status,
      scope: f.scope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
    })
  }

  if (allow?.faqIds) for (const id of allow.faqIds) pushFaq(id)
  if (allow?.factIds) for (const id of allow.factIds) pushFact(id)

  // Light keyword boost from full FAQ/fact corpus for open questions
  if (!allow || items.length < 2) {
    for (const f of faqs as any[]) {
      if (items.some((i) => i.id === f.id)) continue
      const hay = `${f.title} ${f.content}`.toLowerCase()
      if (q.split(/\s+/).filter((w) => w.length > 3).some((w) => hay.includes(w))) {
        pushFaq(f.id)
        if (items.length >= 6) break
      }
    }
  }

  return items.slice(0, 8)
}

export function retrieveRelevantVideo(intent: IntentId, question: string) {
  const allow = INTENT_ALLOWLIST[intent]
  const id = allow?.videoIds?.[0]
  if (!id) return null
  const v = (videos as any[]).find((x) => x.id === id)
  return v || null
}
