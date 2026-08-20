/**
 * Evidence retrieval with intent allowlist + synonym expansion.
 * Abstraction allows swapping keyword scorer for embeddings later.
 */
import {
  faqs,
  nelfundFacts,
  troubleshootingItems,
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
      videoIds?: string[]
    }
  >
> = {
  'what-is-nelfund': {
    faqIds: ['faq-what-is-nelfund', 'faq-purpose-of-nelfund', 'faq-who-established-nelfund'],
    factIds: ['nf-what-is', 'nf-purpose', 'nf-history-establishment'],
    videoIds: ['vid-general-overview'],
  },
  'nelfund-purpose': {
    faqIds: ['faq-purpose-of-nelfund', 'faq-what-is-nelfund'],
    factIds: ['nf-purpose', 'nf-what-is', 'nf-components'],
    videoIds: ['vid-general-overview'],
  },
  'nelfund-history': {
    faqIds: ['faq-who-established-nelfund', 'faq-what-is-nelfund', 'faq-purpose-of-nelfund'],
    factIds: ['nf-history-establishment', 'nf-what-is', 'nf-purpose'],
    videoIds: ['vid-general-overview'],
  },
  'loan-or-scholarship': { faqIds: ['faq-loan-not-scholarship'], factIds: ['nf-loan-not-scholarship'], videoIds: ['vid-repayment-explainer'] },
  'how-to-apply': { faqIds: ['faq-how-to-apply', 'faq-portal-login'], videoIds: ['vid-application-walkthrough'] },
  eligibility: {
    faqIds: ['faq-eligibility', 'faq-disqualification'],
    factIds: ['nf-eligibility', 'nf-disqualification'],
  },
  'documents-needed': { faqIds: ['faq-documents-needed'], videoIds: ['vid-application-walkthrough'] },
  'nin-verification': { tbIds: ['tb-nin-failed'], videoIds: ['vid-nin-troubleshooting'] },
  'jamb-verification': { tbIds: ['tb-jamb-not-showing'], videoIds: ['vid-jamb-troubleshooting'] },
  'missing-information': {
    faqIds: ['faq-no-school-info', 'faq-school-not-uploaded'],
    tbIds: ['tb-no-school-info-found'],
    videoIds: ['vid-missing-info-national'],
  },
  'school-not-found': {
    faqIds: ['faq-school-not-uploaded', 'faq-no-school-info'],
    tbIds: ['tb-no-school-info-found'],
    videoIds: ['vid-school-not-found'],
  },
  'institution-verification': {
    faqIds: ['faq-school-not-uploaded', 'faq-no-school-info'],
    factIds: ['nf-institution-vs-nelfund'],
    tbIds: ['tb-no-school-info-found'],
    videoIds: ['vid-missing-info-national'],
  },
  'pending-application': { faqIds: ['faq-pending'], videoIds: ['vid-status-checking'] },
  'rejected-application': { faqIds: ['faq-rejected', 'faq-disqualification'] },
  'profile-update': { videoIds: ['vid-profile-editing'] },
  'bank-information': { videoIds: ['vid-profile-editing'] },
  upkeep: {
    faqIds: ['faq-upkeep-amount'],
    factIds: ['nf-upkeep-amount'],
    videoIds: ['vid-upkeep-explainer'],
  },
  'school-fees': { faqIds: ['faq-fees-payment'], factIds: ['nf-components'], videoIds: ['vid-school-fees-explainer'] },
  'institutional-charges': { faqIds: ['faq-fees-payment'], factIds: ['nf-components'] },
  refund: { faqIds: ['faq-already-paid'] },
  reapplication: { faqIds: ['faq-how-to-apply'] },
  repayment: { faqIds: ['faq-repayment'], factIds: ['nf-repayment-start', 'nf-repayment-mechanism'], videoIds: ['vid-repayment-explainer'] },
  gsi: { faqIds: ['faq-gsi'], factIds: ['nf-gsi'], videoIds: ['vid-repayment-explainer'] },
  'academic-session': { faqIds: ['faq-how-to-apply'] },
  deadline: { faqIds: ['faq-how-to-apply'] },
  'contact-support': { faqIds: ['faq-contact'] },
  'scam-safety': { faqIds: ['faq-scam'] },
  readiness: { faqIds: ['faq-documents-needed', 'faq-how-to-apply'] },
  'official-sources': { faqIds: ['faq-portal-login'] },
  guarantor: { faqIds: ['faq-guarantor'] },
  'current-information': { faqIds: ['faq-what-is-nelfund'], factIds: ['nf-what-is'] },
  'portal-login': { faqIds: ['faq-portal-login', 'faq-how-to-apply'] },
  'email-draft': { faqIds: ['faq-contact'] },
  'contact-lookup': { faqIds: ['faq-contact'] },
}

const SYNONYMS: Record<string, string[]> = {
  school: ['institution', 'university', 'poly', 'polytechnic', 'college'],
  show: ['appear', 'list', 'found'],
  missing: ['no information', 'not found'],
  jamb: ['jamb number', 'registration number'],
  nin: ['national identity'],
  pending: ['waiting', 'processing'],
  upkeep: ['20k', 'allowance'],
  fees: ['school fees', 'institutional charges', 'tuition'],
}

function expandQuery(q: string): string[] {
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2)
  const out = new Set(tokens)
  for (const t of tokens) {
    for (const [k, syns] of Object.entries(SYNONYMS)) {
      if (t === k || syns.includes(t)) {
        out.add(k)
        syns.forEach((s) => out.add(s))
      }
    }
  }
  return Array.from(out)
}

function scoreText(text: string, terms: string[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const t of terms) {
    if (lower.includes(t)) score += 1
  }
  return score
}

function statusWeight(s: VerificationStatus): number {
  if (s === 'verified') return 3
  if (s === 'may_change') return 2
  if (s === 'guidance') return 1
  return 0
}

export function retrieveEvidence(
  query: string,
  intent: IntentId,
  institutionId: string | null,
): EvidenceItem[] {
  const allow = INTENT_ALLOWLIST[intent]
  const terms = expandQuery(query)
  const items: EvidenceItem[] = []

  const pushFaq = (id: string) => {
    const f = faqs.find((x) => x.id === id)
    if (!f || !isContentVisible(f, institutionId)) return
    items.push({
      kind: 'faq',
      id: f.id,
      title: f.title,
      body: f.content,
      verification_status: f.verification_status as VerificationStatus,
      scope: f.scope as InformationScope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
    })
  }
  const pushFact = (id: string) => {
    const f = nelfundFacts.find((x) => x.id === id)
    if (!f || !isContentVisible(f, institutionId)) return
    items.push({
      kind: 'fact',
      id: f.id,
      title: f.title,
      body: f.content,
      verification_status: f.verification_status as VerificationStatus,
      scope: f.scope as InformationScope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
    })
  }
  const pushTb = (id: string) => {
    const f = troubleshootingItems.find((x) => x.id === id)
    if (!f || !isContentVisible(f, institutionId)) return
    items.push({
      kind: 'troubleshooting',
      id: f.id,
      title: f.title,
      body: f.what_it_usually_means || f.title,
      verification_status: f.verification_status as VerificationStatus,
      scope: f.scope as InformationScope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids || [],
      steps: f.steps,
      still_stuck: f.still_stuck,
      what_it_usually_means: f.what_it_usually_means,
    })
  }

  if (allow) {
    ;(allow.faqIds || []).forEach(pushFaq)
    ;(allow.factIds || []).forEach(pushFact)
    ;(allow.tbIds || []).forEach(pushTb)
  } else {
    // Soft fallback: score across faqs/facts
    for (const f of faqs) {
      if (!isContentVisible(f, institutionId)) continue
      if (scoreText(f.title + ' ' + f.content, terms) > 0) pushFaq(f.id)
    }
    for (const f of nelfundFacts) {
      if (!isContentVisible(f, institutionId)) continue
      if (scoreText(f.title + ' ' + f.content, terms) > 0) pushFact(f.id)
    }
  }

  return items
    .map((e) => ({ e, s: statusWeight(e.verification_status) + scoreText(e.title + ' ' + e.body, terms) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e)
    .slice(0, 8)
}

export function retrieveRelevantVideo(
  evidence: EvidenceItem[],
  intent: IntentId,
  institutionId: string | null,
) {
  const allow = INTENT_ALLOWLIST[intent]
  const preferred = allow?.videoIds || []
  for (const id of preferred) {
    const v = videos.find((x) => x.id === id)
    if (v && isContentVisible(v, institutionId)) return v
  }
  for (const e of evidence) {
    for (const id of e.related_video_ids || []) {
      const v = videos.find((x) => x.id === id)
      if (v && isContentVisible(v, institutionId)) return v
    }
  }
  return null
}
