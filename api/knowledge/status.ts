import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runRefresh, type LiveApplicationStatus } from './refresh'

const STALE_MS = 1000 * 60 * 60 * 12 // 12 hours

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
  status: 'pending_verification',
  status_label: 'Scheme active; confirm live portal status for new applications',
  note:
    'Official NELFUND channels continue to report student loan activity. Always verify whether applications are open for your session on the official portal (portal.nelf.gov.ng) and announcements on nelf.gov.ng. Do not rely on unofficial sites or social media for deadlines.',
  last_checked: new Date().toISOString().slice(0, 10),
  last_checked_iso: new Date().toISOString(),
  sources: [
    { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
    { id: 'nelfund-portal', label: 'NELFUND application portal', url: 'https://portal.nelf.gov.ng/' },
  ],
  confidence: 'low',
  freshness: 'static_fallback',
  signals: [],
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
        if (age < STALE_MS) {
          return res.status(200).json({ ...parsed, freshness: 'cached' as const })
        }
      }
    }

    const live = await runRefresh()
    return res.status(200).json(live)
  } catch (err) {
    console.error('[knowledge/status]', err)
    return res.status(200).json(STATIC_FALLBACK)
  }
}
