/**
 * Evidence-layer metadata for NELFUND AI.
 * Knowledge is not the brain — it is scored, dated, attributable evidence.
 */

export type SourceAuthority = 'official' | 'curated' | 'institutional' | 'derived' | 'unknown'

export type SourceType =
  | 'faq'
  | 'policy_fact'
  | 'troubleshooting'
  | 'application_status'
  | 'institution_directory'
  | 'institution_contact'
  | 'live_fetch'
  | 'tool_result'
  | 'user_context'

export type Freshness =
  | 'live'
  | 'fresh' // verified within policy window
  | 'stale'
  | 'unknown'
  | 'static' // not time-sensitive

export interface EvidenceMeta {
  id: string
  title?: string
  sourceType: SourceType
  authority: SourceAuthority
  url?: string | null
  publishedAt?: string | null
  lastVerifiedAt?: string | null
  effectiveAt?: string | null
  expiresAt?: string | null
  institutionId?: string | null
  confidence: number // 0..1
  freshness: Freshness
  notes?: string
}

export function freshnessFromDates(opts: {
  lastVerifiedAt?: string | null
  maxAgeDays?: number
  isLive?: boolean
  isStatic?: boolean
}): Freshness {
  if (opts.isLive) return 'live'
  if (opts.isStatic) return 'static'
  if (!opts.lastVerifiedAt) return 'unknown'
  const max = opts.maxAgeDays ?? 14
  const t = Date.parse(opts.lastVerifiedAt)
  if (Number.isNaN(t)) return 'unknown'
  const ageDays = (Date.now() - t) / (1000 * 60 * 60 * 24)
  return ageDays <= max ? 'fresh' : 'stale'
}

export function formatEvidenceForPrompt(items: EvidenceMeta[], body?: string): string {
  const head = items
    .map((e) => {
      const bits = [
        e.id,
        e.sourceType,
        e.authority,
        e.freshness,
        e.lastVerifiedAt ? `verified:${e.lastVerifiedAt}` : null,
        e.url || null,
      ].filter(Boolean)
      return `[${bits.join(' | ')}]`
    })
    .join(' ')
  return body ? `${head}\n${body}` : head
}
