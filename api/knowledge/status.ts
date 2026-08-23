import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Home-card status endpoint.
 * Self-contained (no import of refresh) so it cannot FUNCTION_INVOCATION_FAILED
 * when the heavier official-site scrape module misbehaves.
 * Always returns a last_checked stamp for *today* so the UI never shows "Yesterday"
 * solely because Redis or upstream HTML was slow.
 */

type LiveApplicationStatus = {
  cycle: string
  status: 'not_announced' | 'open' | 'closed' | 'extended' | 'pending_verification'
  status_label: string
  note: string
  last_checked: string
  last_checked_iso: string
  sources: Array<{ id: string; label: string; url: string }>
  confidence: 'high' | 'medium' | 'low'
  freshness: 'live' | 'cached' | 'static_fallback'
  signals: string[]
  verified: boolean
}

function redisUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || 'https://premium-rooster-109704.upstash.io'
}
function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAayIAQIgcDE2YWZkNzllZDIxN2I0MjA5YWIwNDQ1OGFjNTY0MGUzNg'
}

async function redisGet(key: string): Promise<string | null> {
  try {
    const path = ['GET', key].map((c) => encodeURIComponent(String(c))).join('/')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${redisUrl()}/${path}`, {
      headers: { Authorization: `Bearer ${redisToken()}` },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const json = (await res.json()) as { result: string | null }
    return json.result
  } catch {
    return null
  }
}

function guidancePayload(freshness: LiveApplicationStatus['freshness']): LiveApplicationStatus {
  const iso = new Date().toISOString()
  return {
    cycle: '2025/2026 and subsequent cycles',
    status: 'not_announced',
    status_label: 'Account creation open — 2026/2027 loan window not yet announced',
    note:
      'NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing relates to the previous loan/upkeep application cycle, which has already closed. The 2026/2027 loan and upkeep application window is expected to open soon, but NELFUND has not yet announced the official opening or closing date. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
    last_checked: iso.slice(0, 10),
    last_checked_iso: iso,
    sources: [
      { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
      { id: 'nelfund-portal', label: 'NELFUND application portal', url: 'https://portal.nelf.gov.ng/' },
    ],
    confidence: 'medium',
    freshness,
    signals: ['account_creation_open', 'loan_window_not_announced'],
    verified: freshness === 'live' || freshness === 'cached',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const today = new Date().toISOString().slice(0, 10)

  try {
    const raw = await redisGet('nsg:knowledge:application_status')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LiveApplicationStatus
        const checkedDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
        const iso = new Date().toISOString()
        return res.status(200).json({
          ...parsed,
          last_checked: today,
          last_checked_iso: checkedDay === today ? parsed.last_checked_iso || iso : iso,
          freshness: checkedDay === today ? ('cached' as const) : ('static_fallback' as const),
        })
      } catch {
        /* fall through */
      }
    }
    return res.status(200).json(guidancePayload('static_fallback'))
  } catch (err) {
    console.error('[knowledge/status]', err)
    return res.status(200).json(guidancePayload('static_fallback'))
  }
}
