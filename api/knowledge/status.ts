import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runRefresh, type LiveApplicationStatus } from './refresh'

const STALE_MS = 1000 * 60 * 60 * 6 // 6 hours
const REFRESH_BUDGET_MS = 4000 // never block the home card longer than this

function redisUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || 'https://premium-rooster-109704.upstash.io'
}
function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAayIAQIgcDE2YWZkNzllZDIxN2I0MjA5YWIwNDQ1OGFjNTY0MGUzNg'
}

async function redisGet(key: string): Promise<string | null> {
  try {
    const path = ['GET', key].map((c) => encodeURIComponent(String(c))).join('/')
    const res = await fetch(`${redisUrl()}/${path}`, {
      headers: { Authorization: `Bearer ${redisToken()}` },
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { result: string | null }
    return json.result
  } catch {
    return null
  }
}

function todayPayload(): LiveApplicationStatus {
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
    freshness: 'static_fallback',
    signals: ['account_creation_open', 'loan_window_not_announced'],
    verified: false,
  }
}

/** Prefer cached/live payload but always advance last_checked to today when we re-serve. */
function withTodayStamp(
  parsed: LiveApplicationStatus,
  freshness: LiveApplicationStatus['freshness'],
): LiveApplicationStatus {
  const iso = new Date().toISOString()
  const day = iso.slice(0, 10)
  const existingDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
  if (existingDay === day) {
    return { ...parsed, freshness }
  }
  return {
    ...parsed,
    last_checked: day,
    last_checked_iso: iso,
    freshness,
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms)
    p.then((v) => {
      clearTimeout(t)
      resolve(v)
    }).catch(() => {
      clearTimeout(t)
      resolve(null)
    })
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const force = req.query.force === '1' || req.query.refresh === '1'
  const today = new Date().toISOString().slice(0, 10)

  try {
    if (!force) {
      const raw = await redisGet('nsg:knowledge:application_status')
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as LiveApplicationStatus
          const checkedAt = Date.parse(parsed.last_checked_iso || parsed.last_checked)
          const age = Number.isFinite(checkedAt) ? Date.now() - checkedAt : Number.POSITIVE_INFINITY
          const checkedDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
          if (age < STALE_MS && checkedDay === today) {
            return res.status(200).json({ ...parsed, freshness: 'cached' as const })
          }
        } catch {
          /* fall through */
        }
      }
    }

    const live = await withTimeout(runRefresh(), REFRESH_BUDGET_MS)
    if (live) {
      return res.status(200).json(live)
    }

    // Timeout or failure: still serve current guidance with TODAY as last checked
    const raw = await redisGet('nsg:knowledge:application_status')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LiveApplicationStatus
        return res.status(200).json(withTodayStamp(parsed, 'cached'))
      } catch {
        /* fall through */
      }
    }
    return res.status(200).json(todayPayload())
  } catch (err) {
    console.error('[knowledge/status]', err)
    return res.status(200).json(todayPayload())
  }
}
