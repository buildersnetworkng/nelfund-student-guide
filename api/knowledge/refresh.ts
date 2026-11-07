/**
 * Knowledge refresh — probes official NELFUND hosts and records reachability.
 * Reachable ≠ content verified. Never marks window status as verified from a fetch alone.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'crypto'

const SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
  { id: 'nelfund-faq', label: 'NELFUND FAQ', url: 'https://nelf.gov.ng/faq' },
]

type SourceResult = {
  id: string
  label: string
  url: string
  reachable: boolean
  http_status: number | null
  content_hash: string | null
  content_bytes: number | null
  retrieved_at: string
  verification_status: 'not_verified' | 'unreachable' | 'error'
  note: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const retrieved_at = new Date().toISOString()
  const results: SourceResult[] = []

  for (const s of SOURCES) {
    try {
      const r = await fetch(s.url, {
        headers: { 'User-Agent': 'NELFUND-Student-Guide/1.0 (knowledge-refresh)' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      })
      const text = r.ok ? await r.text() : ''
      const hash =
        text.length > 0 ? createHash('sha256').update(text).digest('hex').slice(0, 16) : null
      results.push({
        id: s.id,
        label: s.label,
        url: s.url,
        reachable: r.ok,
        http_status: r.status,
        content_hash: hash,
        content_bytes: text.length || null,
        retrieved_at,
        verification_status: r.ok ? 'not_verified' : 'unreachable',
        note: r.ok
          ? 'Fetched successfully. Content hash is for this request only (not durable history). Facts are NOT auto-verified.'
          : `HTTP ${r.status}; treated as unavailable for verification.`,
      })
    } catch (e) {
      results.push({
        id: s.id,
        label: s.label,
        url: s.url,
        reachable: false,
        http_status: null,
        content_hash: null,
        content_bytes: null,
        retrieved_at,
        verification_status: 'error',
        note: e instanceof Error ? e.message : 'fetch failed',
      })
    }
  }

  const reachable = results.filter((x) => x.reachable).length
  return res.status(200).json({
    ok: true,
    policy: {
      reachability_vs_verification:
        'A successful HTTP fetch proves the host was reachable, not that extracted claims are verified policy.',
      application_window:
        'This refresh never sets application status to verified open/closed. Use /api/knowledge/status and the live portal.',
      no_silent_success:
        'Failed sources are reported explicitly. Prior verified flags are not invented or preserved by this endpoint.',
      content_hash_scope:
        'Hashes are computed per request in memory only. This endpoint does not maintain durable change history across deploys; do not treat successive hashes as a stored audit log until persistent storage exists.',
    },
    summary: {
      sources_total: results.length,
      sources_reachable: reachable,
      sources_failed: results.length - reachable,
      all_content_verification_status: 'not_verified',
    },
    results,
    checked_at: retrieved_at,
  })
}
