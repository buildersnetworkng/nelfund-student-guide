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
import { QUERY_SYNONYMS } from './intent'

function authorityScore(status: VerificationStatus, officialSource: boolean): number {
  let s = 0
  if (status === 'verified') s += 40
  else if (status === 'may_change') s += 25
  else if (status === 'guidance') s += 10
  if (officialSource) s += 15
  return s
}

function sourceIsOfficial(sourceId: string | null): boolean {
  if (!sourceId) return false
  return !!getSource(sourceId)?.official
}

/** Strict allowlists: only these IDs may enter generation for a given intent. */
export const INTENT_ALLOWLIST: Partial<
  Record<IntentId, { faqIds?: string[]; factIds?: string[]; tbIds?: string[]; videoIds?: string[]; allowGuides?: boolean; allowScam?: boolean; allowSources?: boolean }>
> = {
  'what-is-nelfund': {
    faqIds: ['faq-what-is-nelfund', 'faq-is-scholarship'],
    factIds: ['nf-what-is', 'nf-loan-not-scholarship'],
    videoIds: ['vid-general-overview'],
    allowSources: true,
  },
  'loan-or-scholarship': {
    faqIds: ['faq-is-scholarship', 'faq-what-is-nelfund', 'faq-repayment-timing'],
    factIds: ['nf-loan-not-scholarship', 'nf-what-is'],
    videoIds: ['vid-repayment-explainer'],
    allowSources: true,
  },
  'how-to-apply': {
    faqIds: ['faq-how-to-apply', 'faq-documents-needed', 'faq-both-components'],
    videoIds: ['vid-application-walkthrough'],
    allowGuides: true,
    allowSources: true,
  },
  eligibility: {
    faqIds: ['faq-cgpa-eligibility', 'faq-how-to-apply', 'faq-guarantor'],
    allowSources: true,
  },
  'documents-needed': {
    faqIds: ['faq-documents-needed', 'faq-how-to-apply', 'faq-guarantor'],
    videoIds: ['vid-application-walkthrough'],
    allowGuides: true,
    allowSources: true,
  },
  'nin-verification': {
    tbIds: ['tb-nin-failed'],
    videoIds: ['vid-nin-troubleshooting', 'vid-profile-editing'],
    allowSources: true,
  },
  'jamb-verification': {
    tbIds: ['tb-jamb-not-showing'],
    videoIds: ['vid-jamb-troubleshooting', 'vid-profile-editing'],
    allowSources: true,
  },
  'missing-information': {
    faqIds: ['faq-no-school-info', 'faq-school-not-uploaded'],
    tbIds: ['tb-no-school-info-found', 'tb-dont-understand-verification'],
    videoIds: ['vid-missing-info-national', 'vid-school-not-found'],
    allowSources: true,
  },
  'school-not-found': {
    faqIds: ['faq-no-school-info', 'faq-school-not-uploaded'],
    tbIds: ['tb-school-not-showing', 'tb-no-school-info-found'],
    videoIds: ['vid-school-not-found', 'vid-missing-info-national'],
    allowSources: true,
  },
  'institution-verification': {
    tbIds: ['tb-dont-understand-verification', 'tb-no-school-info-found'],
    faqIds: ['faq-no-school-info'],
    videoIds: ['vid-missing-info-national'],
    allowSources: true,
  },
  'pending-application': {
    tbIds: ['tb-still-pending'],
    videoIds: ['vid-status-checking'],
    allowSources: true,
  },
  'rejected-application': {
    faqIds: ['faq-rejected'],
    tbIds: ['tb-rejected'],
    videoIds: ['vid-rejection-explainer'],
    allowSources: true,
  },
  'profile-update': {
    videoIds: ['vid-profile-editing'],
    allowSources: true,
  },
  'bank-information': {
    tbIds: ['tb-bank-details-failed'],
    videoIds: ['vid-profile-editing'],
    allowSources: true,
  },
  upkeep: {
    faqIds: ['faq-upkeep-amount', 'faq-both-components', 'faq-direct-payment'],
    factIds: ['nf-upkeep-amount', 'nf-components'],
    tbIds: ['tb-dont-understand-upkeep', 'tb-upkeep-or-not'],
    videoIds: ['vid-upkeep-explainer'],
    allowSources: true,
  },
  'institutional-charges': {
    faqIds: ['faq-fees-payment', 'faq-direct-payment'],
    factIds: ['nf-components'],
    videoIds: ['vid-school-fees-explainer'],
    allowSources: true,
  },
  'school-fees': {
    faqIds: ['faq-fees-payment', 'faq-already-paid', 'faq-direct-payment'],
    factIds: ['nf-components'],
    videoIds: ['vid-school-fees-explainer'],
    allowSources: true,
  },
  refund: {
    faqIds: ['faq-already-paid'],
    tbIds: ['tb-already-paid-fees'],
    videoIds: ['vid-school-fees-explainer'],
    allowSources: true,
  },
  repayment: {
    faqIds: ['faq-repayment-timing', 'faq-is-scholarship'],
    factIds: ['nf-repayment-start', 'nf-repayment-mechanism', 'nf-gsi'],
    tbIds: ['tb-dont-understand-repayment'],
    videoIds: ['vid-repayment-explainer'],
    allowSources: true,
  },
  gsi: {
    faqIds: ['faq-gsi', 'faq-repayment-timing'],
    factIds: ['nf-gsi'],
    videoIds: ['vid-repayment-explainer'],
    allowSources: true,
  },
  guarantor: { faqIds: ['faq-guarantor'], allowSources: true },
  readiness: { allowSources: true },
  'official-sources': { allowSources: true },
  'scam-safety': { allowScam: true, allowSources: true },
  'academic-session': {
    faqIds: ['faq-how-to-apply'],
    videoIds: ['vid-application-walkthrough'],
    allowSources: true,
  },
  deadline: { faqIds: ['faq-how-to-apply'], allowSources: true },
  'contact-support': { allowSources: true },
  reapplication: {
    faqIds: ['faq-rejected', 'faq-how-to-apply'],
    tbIds: ['tb-rejected'],
    videoIds: ['vid-rejection-explainer'],
    allowSources: true,
  },
}

function expandTerms(question: string): string[] {
  const base = question.toLowerCase().split(/[^a-z0-9₦]+/).filter((t) => t.length > 1)
  const expanded = new Set<string>(base)
  for (const t of base) {
    for (const [key, syns] of Object.entries(QUERY_SYNONYMS)) {
      if (t === key || syns.some((s) => s.includes(t) || t.includes(s.split(' ')[0]))) {
        expanded.add(key)
        for (const s of syns) {
          for (const part of s.split(/\s+/)) {
            if (part.length > 2) expanded.add(part)
          }
        }
      }
    }
  }
  if (/no\s*dey|not\s*dey|dey\s*show/i.test(question)) {
    expanded.add('show'); expanded.add('appear'); expanded.add('school')
  }
  if (/20k|20,?000/i.test(question)) {
    expanded.add('upkeep'); expanded.add('allowance')
  }
  return Array.from(expanded)
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

function isAllowedId(intent: IntentId, kind: 'faq' | 'fact' | 'tb' | 'video', id: string): boolean {
  const allow = INTENT_ALLOWLIST[intent]
  if (!allow) return false
  if (kind === 'faq') return !!allow.faqIds?.includes(id)
  if (kind === 'fact') return !!allow.factIds?.includes(id)
  if (kind === 'tb') return !!allow.tbIds?.includes(id)
  if (kind === 'video') return !!allow.videoIds?.includes(id)
  return false
}

export function retrieveEvidence(
  question: string,
  intent: IntentId,
  institutionId: string | null,
): EvidenceItem[] {
  const terms = expandTerms(question)
  const allow = INTENT_ALLOWLIST[intent]
  const results: EvidenceItem[] = []
  const strict = intent !== 'unknown' && !!allow

  for (const f of faqs) {
    if (!isContentVisible(f, institutionId)) continue
    if (strict && !isAllowedId(intent, 'faq', f.id)) continue
    let score = textScore(`${f.title} ${f.content} ${f.category}`, terms)
    if (allow?.faqIds?.includes(f.id)) score += 50
    if (score <= 0 && !allow?.faqIds?.includes(f.id)) continue
    if (strict && !allow?.faqIds?.includes(f.id)) continue
    results.push({
      kind: 'faq', id: f.id, title: f.title, body: f.content,
      verification_status: f.verification_status, scope: f.scope,
      institution_id: f.institution_id, source_id: f.source_id,
      last_verified: f.last_verified, related_video_ids: f.related_video_ids ?? [],
      path: `/faq#${f.id}`,
      score: score + authorityScore(f.verification_status, sourceIsOfficial(f.source_id)),
    })
  }

  for (const fact of nelfundFacts) {
    if (!isContentVisible(fact, institutionId)) continue
    if (strict && !isAllowedId(intent, 'fact', fact.id)) continue
    let score = textScore(`${fact.title} ${fact.content} ${fact.category}`, terms)
    if (allow?.factIds?.includes(fact.id)) score += 50
    if (score <= 0 && !allow?.factIds?.includes(fact.id)) continue
    if (strict && !allow?.factIds?.includes(fact.id)) continue
    results.push({
      kind: 'fact', id: fact.id, title: fact.title, body: fact.content,
      verification_status: fact.verification_status, scope: fact.scope,
      institution_id: fact.institution_id, source_id: fact.source_id,
      last_verified: fact.last_verified, related_video_ids: fact.related_video_ids ?? [],
      path: fact.category.toLowerCase().includes('upkeep') ? '/upkeep'
        : fact.category.toLowerCase().includes('fee') ? '/fees' : '/',
      score: score + authorityScore(fact.verification_status, sourceIsOfficial(fact.source_id)),
    })
  }

  for (const t of troubleshootingItems) {
    if (!isContentVisible(t, institutionId)) continue
    if (strict && !isAllowedId(intent, 'tb', t.id)) continue
    let score = textScore(
      `${t.problem} ${t.what_it_usually_means} ${t.category} ${t.what_to_do.join(' ')}`,
      terms,
    )
    if (allow?.tbIds?.includes(t.id)) score += 50
    if (score <= 0 && !allow?.tbIds?.includes(t.id)) continue
    if (strict && !allow?.tbIds?.includes(t.id)) continue
    results.push({
      kind: 'troubleshooting', id: t.id, title: t.problem, body: t.what_it_usually_means,
      verification_status: t.verification_status, scope: t.scope,
      institution_id: t.institution_id, source_id: t.source_id,
      last_verified: t.last_verified, related_video_ids: t.video_ids ?? [],
      steps: t.what_to_do, avoid: t.avoid_this, still_stuck: t.still_stuck,
      path: `/troubleshooting/${t.id}`,
      score: score + authorityScore(t.verification_status, sourceIsOfficial(t.source_id)),
    })
  }

  if (allow?.allowGuides) {
    for (const g of guides) {
      let score = textScore(`${g.title} ${g.summary}`, terms)
      if (intent === 'how-to-apply' || intent === 'documents-needed') score += 40
      if (score <= 0) continue
      results.push({
        kind: 'guide', id: g.id, title: g.title, body: g.summary,
        verification_status: 'guidance', scope: 'nelfund-wide',
        institution_id: null, source_id: 'nelfund-portal', last_verified: null,
        related_video_ids: g.steps.map((s) => s.video_id).filter((id): id is string => !!id),
        steps: g.steps.map((s) => `${s.step}. ${s.title}: ${s.explanation}`),
        path: '/apply',
        score: score + authorityScore('guidance', true),
      })
    }
  }

  if (allow?.allowScam || intent === 'scam-safety') {
    for (const tip of scamTips) {
      results.push({
        kind: 'scam', id: tip.id, title: 'Stay safe', body: tip.tip,
        verification_status: 'guidance', scope: 'nelfund-wide',
        institution_id: null, source_id: null, last_verified: null,
        related_video_ids: [], path: '/',
        score: 40 + authorityScore('guidance', false),
      })
    }
  }

  if (allow?.allowSources || intent === 'official-sources' || intent === 'contact-support') {
    for (const s of sources) {
      if (!s.official) continue
      if (!isContentVisible(s, institutionId)) continue
      results.push({
        kind: 'source', id: s.id, title: s.label, body: s.url,
        verification_status: 'verified', scope: s.scope,
        institution_id: s.institution_id, source_id: s.id, last_verified: null,
        related_video_ids: [], path: '/sources',
        score: 35 + authorityScore('verified', true),
      })
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
  evidence: EvidenceItem[],
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
