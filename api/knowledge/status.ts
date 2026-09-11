import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, rateLimitOr429 } from '../lib/security'

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

function currentAcademicCycle(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

function redisUrl(): string {
  return (process.env.UPSTASH_REDIS_REST_URL || '').trim()
}
function redisToken(): string {
  return (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
}

async function redisGet(key: string): Promise<string | null> {
  try {
    if (!redisUrl() || !redisToken()) return null
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
  const cycle = currentAcademicCycle()
  return {
    cycle,
    status: 'not_announced',
    status_label: `Account creation open: ${cycle} loan window not yet announced`,
    note: `NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. The **${cycle}** loan and upkeep application window should be treated as unconfirmed until NELFUND announces official opening and closing dates. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.`,
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
  applyCors(req, res, 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!rateLimitOr429(req, res, 'knowledge-status', 120, 60_000)) return

  const today = new Date().toISOString().slice(0, 10)
  const cycle = currentAcademicCycle()

  try {
    const raw = await redisGet('nsg:knowledge:application_status')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LiveApplicationStatus
        const checkedDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
        const iso = new Date().toISOString()
        return res.status(200).json({
          ...parsed,
          cycle,
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
