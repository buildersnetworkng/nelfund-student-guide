/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
  'how-to-apply': {
    faqIds: ['faq-how-to-apply', 'faq-documents-needed', 'faq-eligibility'],
    factIds: ['nf-how-to-apply', 'nf-eligibility'],
    videoIds: ['vid-how-to-apply'],
  },
  'upkeep': {
    faqIds: ['faq-upkeep', 'faq-how-much-loan'],
    factIds: ['nf-upkeep', 'nf-loan-amount', 'nf-components'],
  },
  'school-fees': {
    faqIds: ['faq-school-fees', 'faq-institutional-charges'],
    factIds: ['nf-school-fees', 'nf-components'],
  },
  'repayment': {
    faqIds: ['faq-repayment', 'faq-gsi'],
    factIds: ['nf-repayment', 'nf-gsi'],
  },
  'gsi': {
    faqIds: ['faq-gsi', 'faq-repayment'],
    factIds: ['nf-gsi', 'nf-repayment'],
  },
  'eligibility': {
    faqIds: ['faq-eligibility', 'faq-who-can-apply'],
    factIds: ['nf-eligibility'],
  },
  'loan-or-scholarship': {
    faqIds: ['faq-loan-not-scholarship', 'faq-what-is-nelfund'],
    factIds: ['nf-loan-not-scholarship', 'nf-what-is'],
  },
  'documents-needed': {
    faqIds: ['faq-documents-needed'],
    factIds: ['nf-documents'],
  },
  'guarantor': {
    faqIds: ['faq-guarantor'],
    factIds: ['nf-guarantor'],
  },
  'missing-information': {
    troubleshootingIds: ['ts-missing-information'],
  },
  'jamb-verification': {
    troubleshootingIds: ['ts-jamb'],
  },
  'nin-verification': {
    troubleshootingIds: ['ts-nin'],
  },
  'school-not-found': {
    troubleshootingIds: ['ts-school-not-found'],
  },
  'pending-application': {
    troubleshootingIds: ['ts-pending'],
  },
  'rejected-application': {
    troubleshootingIds: ['ts-rejected'],
  },
  'bank-information': {
    troubleshootingIds: ['ts-bank'],
  },
  'scam-safety': {
    faqIds: ['faq-scam-safety'],
    factIds: ['nf-scam-safety'],
  },
}

export function retrieveEvidence(
  intent: IntentId,
  question: string,
  institutionId?: string | null,
): EvidenceItem[] {
  void institutionId
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
  void question
  const allow = INTENT_ALLOWLIST[intent]
  const id = allow?.videoIds?.[0]
  if (!id) return null
  const v = (videos as any[]).find((x) => x.id === id)
  return v || null
}
