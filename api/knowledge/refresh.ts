/**
 * Knowledge refresh job — pulls official NELFUND pages into cache.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const results: Array<{ id: string; ok: boolean; note?: string }> = []
  for (const s of SOURCES) {
    try {
      const r = await fetch(s.url, {
        headers: { 'User-Agent': 'NELFUND-Student-Guide/1.0' },
        signal: AbortSignal.timeout(12000),
      })
      results.push({ id: s.id, ok: r.ok, note: r.ok ? 'fetched' : `status ${r.status}` })
    } catch (e) {
      results.push({ id: s.id, ok: false, note: e instanceof Error ? e.message : 'fetch failed' })
    }
  }

  return res.status(200).json({
    ok: true,
    sources: SOURCES,
    results,
    checked_at: new Date().toISOString(),
  })
}
