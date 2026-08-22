import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runRefresh, type LiveApplicationStatus } from './refresh'

const STALE_MS = 1000 * 60 * 60 * 6 // 6 hours — auto-refresh for home card

function redisUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || 'https://premium-rooster-109704.upstash.io'
}
function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAayIAQIgcDE2YWZkNzllZDIxN2I0MjA5YWIwNDQ1OGFjNTY0MGUzNg'
}

async function redisGet(key: string): Promise<string | null> {
  const path = ['GET', key].map((c) => encodeURIComponent(String(c))).join('/')
  const res = await fetch(`${redisUrl()}/${path}`, {
    headers: { Authorization: `Bearer ${redisToken()}` },
  })
  if (!res.ok) return null
  const json = (await res.json()) as { result: string | null }
  return json.result
}

const STATIC_FALLBACK: LiveApplicationStatus = {
  cycle: '2025/2026 and subsequent cycles',
  status: 'not_announced',
  status_label: 'Account creation open — 2026/2027 loan window not yet announced',
  note:
    'NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing relates to the previous loan/upkeep application cycle, which has already closed. The 2026/2027 loan and upkeep application window is expected to open soon, but NELFUND has not yet announced the official opening or closing date. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
  last_checked: new Date().toISOString().slice(0, 10),
  last_checked_iso: new Date().toISOString(),
  sources: [
    { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
    { id: 'nelfund-portal', label: 'NELFUND application portal', url: 'https://portal.nelf.gov.ng/' },
  ],
  confidence: 'medium',
  freshness: 'static_fallback',
  signals: ['account_creation_open', 'loan_window_not_announced'],
  verified: false,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const force = req.query.force === '1' || req.query.refresh === '1'

  try {
    if (!force) {
      const raw = await redisGet('nsg:knowledge:application_status')
      if (raw) {
        const parsed = JSON.parse(raw) as LiveApplicationStatus
        const checkedAt = Date.parse(parsed.last_checked_iso || parsed.last_checked)
        const age = Number.isFinite(checkedAt) ? Date.now() - checkedAt : Number.POSITIVE_INFINITY
        const checkedDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
        const today = new Date().toISOString().slice(0, 10)
        // Refresh when older than STALE_MS or not from today's calendar date
        if (age < STALE_MS && checkedDay === today) {
          return res.status(200).json({ ...parsed, freshness: 'cached' as const })
        }
        // Stale: refresh in this request so the home page stays current
      }
    }

    const live = await runRefresh()
    return res.status(200).json(live)
  } catch (err) {
    console.error('[knowledge/status]', err)
    return res.status(200).json(STATIC_FALLBACK)
  }
}
