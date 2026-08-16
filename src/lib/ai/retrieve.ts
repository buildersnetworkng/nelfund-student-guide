/**
 * Evidence retrieval with strict INTENT_ALLOWLIST to prevent cross-topic leakage.
 */
import {
  faqs,
  nelfundFacts,
  troubleshootingItems,
  guides,
  videos,
  isContentVisible,
} from '../data'
import type { IntentId, EvidenceItem } from './types'
import type { VerificationStatus, InformationScope } from '../types'

export const INTENT_ALLOWLIST: Partial<
  Record<
    IntentId,
    {
      faqIds?: string[]
      factIds?: string[]
      tbIds?: string[]
      guideIds?: string[]
      videoIds?: string[]
    }
  >
> = {
  'what-is-nelfund': { faqIds: ['faq-what-is-nelfund'], factIds: ['nf-what-is'], videoIds: ['vid-general-overview'] },
  'loan-or-scholarship': { faqIds: ['faq-loan-or-scholarship'], factIds: ['nf-loan-nature'], videoIds: ['vid-general-overview'] },
  'how-to-apply': { faqIds: ['faq-how-to-apply'], factIds: ['nf-how-to-apply'], videoIds: ['vid-application-walkthrough'] },
  eligibility: { faqIds: ['faq-eligibility'], factIds: ['nf-eligibility'] },
  'documents-needed': { faqIds: ['faq-documents'], factIds: ['nf-documents'], videoIds: ['vid-application-walkthrough'] },
  'nin-verification': { faqIds: ['faq-nin'], tbIds: ['tb-nin-issues'], videoIds: ['vid-nin-troubleshooting', 'vid-profile-editing'] },
  'jamb-verification': { faqIds: ['faq-jamb'], tbIds: ['tb-jamb-reject'], videoIds: ['vid-jamb-troubleshooting', 'vid-profile-editing'] },
  'missing-information': {
    faqIds: ['faq-no-school-info', 'faq-school-not-uploaded'],
    tbIds: ['tb-missing-info', 'tb-no-school-info'],
    videoIds: ['vid-missing-info-national', 'vid-school-not-found'],
  },
  'school-not-found': {
    faqIds: ['faq-school-not-found'],
    tbIds: ['tb-school-not-found'],
    videoIds: ['vid-school-not-found', 'vid-missing-info-national'],
  },
  'institution-verification': {
    faqIds: ['faq-school-not-uploaded'],
    tbIds: ['tb-missing-info'],
    videoIds: ['vid-missing-info-national'],
  },
  'pending-application': { faqIds: ['faq-pending'], tbIds: ['tb-pending'], videoIds: ['vid-status-checking'] },
  'rejected-application': { faqIds: ['faq-rejected'], tbIds: ['tb-rejected'], videoIds: ['vid-rejection-explainer'] },
  'profile-update': { faqIds: ['faq-profile'], tbIds: ['tb-profile'], videoIds: ['vid-profile-editing'] },
  'bank-information': { faqIds: ['faq-bank'], videoIds: ['vid-profile-editing'] },
  upkeep: {
    faqIds: ['faq-upkeep-amount', 'faq-both-components', 'faq-direct-payment'],
    factIds: ['nf-upkeep-amount', 'nf-components'],
    tbIds: ['tb-dont-understand-upkeep', 'tb-upkeep-or-not'],
    videoIds: ['vid-upkeep-explainer'],
  },
  'institutional-charges': { faqIds: ['faq-fees-payment'], factIds: ['nf-components'], videoIds: ['vid-school-fees-explainer'] },
  'school-fees': { faqIds: ['faq-fees-payment', 'faq-already-paid'], factIds: ['nf-components'], videoIds: ['vid-school-fees-explainer'] },
  refund: { faqIds: ['faq-already-paid'], tbIds: ['tb-already-paid'] },
  reapplication: { faqIds: ['faq-reapply'], tbIds: ['tb-rejected'] },
  repayment: { faqIds: ['faq-repayment'], factIds: ['nf-repayment'], videoIds: ['vid-repayment-explainer'] },
  gsi: { faqIds: ['faq-gsi'], factIds: ['nf-gsi'] },
  'academic-session': { faqIds: ['faq-session'] },
  deadline: { faqIds: ['faq-deadline'] },
  'contact-support': { faqIds: ['faq-contact'] },
  'scam-safety': { faqIds: ['faq-scam'] },
  readiness: { faqIds: ['faq-readiness'] },
  'official-sources': { faqIds: ['faq-official'] },
  guarantor: { faqIds: ['faq-guarantor'] },
}

function scoreText(q: string, fields: string[]): number {
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2)
  let score = 0
  const hay = fields.join(' ').toLowerCase()
  for (const t of tokens) {
    if (hay.includes(t)) score += 8
  }
  return score
}

export function retrieveEvidence(
  question: string,
  intent: IntentId,
  institutionId: string | null,
): EvidenceItem[] {
  const allow = INTENT_ALLOWLIST[intent]
  const results: EvidenceItem[] = []
  const q = question.toLowerCase()

  const pushFaq = (f: (typeof faqs)[0], score: number) => {
    if (!isContentVisible(f, institutionId)) return
    results.push({
      kind: 'faq',
      id: f.id,
      title: f.question,
      body: f.answer,
      verification_status: f.verification_status as VerificationStatus,
      scope: f.scope as InformationScope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
      path: '/faq',
      score,
    })
  }

  if (allow) {
    for (const id of allow.faqIds || []) {
      const f = faqs.find((x) => x.id === id)
      if (f) pushFaq(f, 40 + scoreText(q, [f.question, f.answer]))
    }
    for (const id of allow.factIds || []) {
      const fact = nelfundFacts.find((x) => x.id === id)
      if (fact && isContentVisible(fact, institutionId)) {
        results.push({
          kind: 'fact',
          id: fact.id,
          title: fact.title,
          body: fact.body,
          verification_status: fact.verification_status as VerificationStatus,
          scope: fact.scope as InformationScope,
          institution_id: fact.institution_id,
          source_id: fact.source_id,
          last_verified: fact.last_verified,
          related_video_ids: fact.related_video_ids || [],
          path: '/',
          score: 45,
        })
      }
    }
    for (const id of allow.tbIds || []) {
      const tb = troubleshootingItems.find((x) => x.id === id)
      if (tb && isContentVisible(tb, institutionId)) {
        results.push({
          kind: 'troubleshooting',
          id: tb.id,
          title: tb.title,
          body: tb.summary || tb.what_this_means || '',
          verification_status: tb.verification_status as VerificationStatus,
          scope: tb.scope as InformationScope,
          institution_id: tb.institution_id,
          source_id: tb.source_id,
          last_verified: tb.last_verified,
          related_video_ids: tb.related_video_ids || [],
          steps: tb.steps,
          avoid: tb.avoid,
          still_stuck: tb.still_stuck,
          path: `/troubleshooting/${tb.id}`,
          score: 50,
        })
      }
    }
  }

  const ranked = results.filter((r) => r.score >= 10).sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const unique: EvidenceItem[] = []
  for (const item of ranked) {
    const key = `${item.kind}:${item.id}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
    if (unique.length >= 4) break
  }
  return unique
}

export function retrieveRelevantVideo(
  _evidence: EvidenceItem[],
  intent: IntentId,
  institutionId: string | null,
) {
  const allow = INTENT_ALLOWLIST[intent]
  const preferredIds = new Set<string>()
  if (allow?.videoIds && allow.videoIds.length > 0) {
    for (const id of allow.videoIds) preferredIds.add(id)
  }
  if (preferredIds.size === 0) return null

  const candidates = videos.filter((v) => isContentVisible(v, institutionId) && preferredIds.has(v.id))
  const ranked = candidates
    .map((v) => {
      let score = 50
      if (v.title.toLowerCase().includes('placeholder')) score -= 30
      if (v.verification_status === 'unverified') score -= 20
      if (v.recommended) score += 5
      return { v, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.v ?? null
}
