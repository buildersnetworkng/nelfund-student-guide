import {
  faqs,
  nelfundFacts,
  troubleshootingItems,
  guides,
  videos,
  sources,
  scamTips,
  getSource,
  isContentVisible,
} from '../data'
import type { IntentId, EvidenceItem } from './types'
import type { VerificationStatus } from '../types'

function authorityScore(status: VerificationStatus, officialSource: boolean): number {
  let s = 0
  if (status === 'verified') s += 40
  else if (status === 'may_change') s += 25
  else if (status === 'guidance') s += 10
  else s += 0
  if (officialSource) s += 15
  return s
}

function sourceIsOfficial(sourceId: string | null): boolean {
  if (!sourceId) return false
  const s = getSource(sourceId)
  return !!s?.official
}

const INTENT_HINTS: Partial<Record<IntentId, { faqIds?: string[]; factIds?: string[]; tbIds?: string[]; videoIds?: string[] }>> = {
  'what-is-nelfund': {
    faqIds: ['faq-what-is-nelfund', 'faq-loan-not-scholarship'],
    factIds: ['nf-what-is'],
    videoIds: ['vid-general-overview'],
  },
  'loan-or-scholarship': {
    faqIds: ['faq-loan-not-scholarship', 'faq-what-is-nelfund', 'faq-repayment'],
    factIds: ['nf-what-is'],
  },
  'how-to-apply': {
    faqIds: ['faq-how-to-apply', 'faq-both-components'],
    videoIds: ['vid-application-walkthrough'],
  },
  'documents-needed': {
    faqIds: ['faq-how-to-apply', 'faq-guarantor'],
  },
  'upkeep-amount': {
    faqIds: ['faq-upkeep-amount', 'faq-both-components'],
    factIds: ['nf-upkeep-amount'],
    tbIds: ['tb-dont-understand-upkeep'],
    videoIds: ['vid-upkeep-explainer'],
  },
  'fees-payment': {
    faqIds: ['faq-fees-payment', 'faq-already-paid'],
    factIds: ['nf-components'],
    videoIds: ['vid-school-fees-explainer'],
  },
  'already-paid-fees': {
    faqIds: ['faq-already-paid'],
    tbIds: ['tb-already-paid-fees'],
  },
  'school-not-showing': {
    faqIds: ['faq-school-not-showing', 'faq-school-not-uploaded'],
    tbIds: ['tb-school-not-showing', 'tb-oou-school-not-showing'],
    videoIds: ['vid-school-not-found'],
  },
  'no-school-info': {
    faqIds: ['faq-no-school-info'],
    tbIds: ['tb-no-school-info-found'],
    videoIds: ['vid-missing-info-national'],
  },
  'application-pending': {
    faqIds: ['faq-pending'],
    tbIds: ['tb-pending'],
    videoIds: ['vid-status-checking'],
  },
  'application-rejected': {
    faqIds: ['faq-rejected'],
    tbIds: ['tb-rejected'],
  },
  'repayment': {
    faqIds: ['faq-repayment'],
    factIds: ['nf-repayment-start', 'nf-gsi'],
    videoIds: ['vid-repayment-explainer'],
  },
  'guarantor': {
    faqIds: ['faq-guarantor'],
  },
  'scam-safety': {},
  'readiness': {},
  'official-sources': {},
}

function textScore(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase()
  let score = 0
  for (const t of terms) {
    if (!t) continue
    if (h.includes(t)) score += t.length > 4 ? 3 : 2
  }
  return score
}

export function retrieveEvidence(
  question: string,
  intent: IntentId,
  institutionId: string | null,
): EvidenceItem[] {
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9\u20a6]+/)
    .filter((t) => t.length > 1)

  const hints = INTENT_HINTS[intent] ?? {}
  const results: EvidenceItem[] = []

  for (const f of faqs) {
    if (!isContentVisible(f, institutionId)) continue
    let score = textScore(`${f.title} ${f.content} ${f.category}`, terms)
    if (hints.faqIds?.includes(f.id)) score += 50
    if (score <= 0 && intent === 'unknown') continue
    if (score <= 0 && !hints.faqIds?.includes(f.id)) continue
    results.push({
      kind: 'faq',
      id: f.id,
      title: f.title,
      body: f.content,
      verification_status: f.verification_status,
      scope: f.scope,
      institution_id: f.institution_id,
      source_id: f.source_id,
      last_verified: f.last_verified,
      related_video_ids: f.related_video_ids ?? [],
      path: `/faq#${f.id}`,
      score: score + authorityScore(f.verification_status, sourceIsOfficial(f.source_id)),
    })
  }

  for (const fact of nelfundFacts) {
    if (!isContentVisible(fact, institutionId)) continue
    let score = textScore(`${fact.title} ${fact.content} ${fact.category}`, terms)
    if (hints.factIds?.includes(fact.id)) score += 50
    if (score <= 0 && !hints.factIds?.includes(fact.id)) continue
    results.push({
      kind: 'fact',
      id: fact.id,
      title: fact.title,
      body: fact.content,
      verification_status: fact.verification_status,
      scope: fact.scope,
      institution_id: fact.institution_id,
      source_id: fact.source_id,
      last_verified: fact.last_verified,
      related_video_ids: fact.related_video_ids ?? [],
      path: fact.category.toLowerCase().includes('upkeep')
        ? '/upkeep'
        : fact.category.toLowerCase().includes('fee')
          ? '/fees'
          : '/',
      score: score + authorityScore(fact.verification_status, sourceIsOfficial(fact.source_id)),
    })
  }

  for (const t of troubleshootingItems) {
    if (!isContentVisible(t, institutionId)) continue
    let score = textScore(
      `${t.problem} ${t.what_it_usually_means} ${t.category} ${t.what_to_do.join(' ')}`,
      terms,
    )
    if (hints.tbIds?.includes(t.id)) score += 50
    if (score <= 0 && !hints.tbIds?.includes(t.id)) continue
    results.push({
      kind: 'troubleshooting',
      id: t.id,
      title: t.problem,
      body: t.what_it_usually_means,
      verification_status: t.verification_status,
      scope: t.scope,
      institution_id: t.institution_id,
      source_id: t.source_id,
      last_verified: t.last_verified,
      related_video_ids: t.video_ids ?? [],
      steps: t.what_to_do,
      avoid: t.avoid_this,
      still_stuck: t.still_stuck,
      path: `/troubleshooting/${t.id}`,
      score: score + authorityScore(t.verification_status, sourceIsOfficial(t.source_id)),
    })
  }

  for (const g of guides) {
    let score = textScore(`${g.title} ${g.summary}`, terms)
    if (intent === 'how-to-apply' || intent === 'documents-needed') score += 40
    if (score <= 0) continue
    results.push({
      kind: 'guide',
      id: g.id,
      title: g.title,
      body: g.summary,
      verification_status: 'guidance',
      scope: 'nelfund-wide',
      institution_id: null,
      source_id: 'nelfund-portal',
      last_verified: null,
      related_video_ids: g.steps.map((s) => s.video_id).filter((id): id is string => !!id),
      steps: g.steps.map((s) => `${s.step}. ${s.title}: ${s.explanation}`),
      path: '/apply',
      score: score + authorityScore('guidance', true),
    })
  }

  if (intent === 'scam-safety' || /scam|fraud|otp|safe/i.test(question)) {
    for (const tip of scamTips) {
      results.push({
        kind: 'scam',
        id: tip.id,
        title: 'Stay safe',
        body: tip.tip,
        verification_status: 'guidance',
        scope: 'nelfund-wide',
        institution_id: null,
        source_id: null,
        last_verified: null,
        related_video_ids: [],
        path: '/',
        score: 30 + authorityScore('guidance', false),
      })
    }
  }

  if (intent === 'official-sources' || intent === 'how-to-apply' || /portal|official|website/i.test(question)) {
    for (const s of sources) {
      if (!s.official) continue
      if (!isContentVisible(s, institutionId)) continue
      results.push({
        kind: 'source',
        id: s.id,
        title: s.label,
        body: s.url,
        verification_status: 'verified',
        scope: s.scope,
        institution_id: s.institution_id,
        source_id: s.id,
        last_verified: null,
        related_video_ids: [],
        path: '/sources',
        score: 35 + authorityScore('verified', true),
      })
    }
  }

  const ranked = results
    .filter((r) => r.score >= 10)
    .sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const unique: EvidenceItem[] = []
  for (const item of ranked) {
    const key = `${item.kind}:${item.id}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
    if (unique.length >= 6) break
  }

  return unique
}

export function retrieveRelevantVideo(
  evidence: EvidenceItem[],
  intent: IntentId,
  institutionId: string | null,
) {
  const preferredIds = new Set<string>()
  for (const e of evidence) {
    for (const id of e.related_video_ids) preferredIds.add(id)
  }
  const hints = INTENT_HINTS[intent]
  for (const id of hints?.videoIds ?? []) preferredIds.add(id)

  const candidates = videos.filter((v) => isContentVisible(v, institutionId))

  const ranked = candidates
    .map((v) => {
      let score = 0
      if (preferredIds.has(v.id)) score += 50
      if (v.recommended) score += 10
      if (v.verification_status === 'guidance') score += 5
      if (v.verification_status === 'unverified') score -= 20
      return { v, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.v ?? null
}
