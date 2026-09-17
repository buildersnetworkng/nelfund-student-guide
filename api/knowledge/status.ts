import type { VercelRequest, VercelResponse } from '@vercel/node'

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

function bulletNote(cycle: string): string {
  return (
    `• Account creation (sign up): OPEN. You can create your account, finish your profile, and sort out your BVN.\n` +
    `• Loan and upkeep application: NOT confirmed open yet for ${cycle}. Wait for official opening and closing dates on the portal.\n` +
    `Do not use social media for deadlines. Use the buttons below for sign in or sign up.`
  )
}

function guidancePayload(freshness: LiveApplicationStatus['freshness']): LiveApplicationStatus {
  const iso = new Date().toISOString()
  const cycle = currentAcademicCycle()
  return {
    cycle,
    status: 'not_announced',
    status_label: 'Account creation open · Loan/upkeep not confirmed yet',
    note: bulletNote(cycle),
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

/** Prefer structured bullets over old long-paragraph Redis payloads. */
function normalizeForUi(parsed: LiveApplicationStatus, cycle: string): LiveApplicationStatus {
  const note = (parsed.note || '').trim()
  const isLongParagraph =
    !note.includes('•') &&
    (note.includes('academic cycle') ||
      note.includes('no announced deadline') ||
      note.includes('home card cycle'))

  if (parsed.status === 'not_announced' || isLongParagraph) {
    return {
      ...parsed,
      cycle,
      status: 'not_announced',
      status_label: 'Account creation open · Loan/upkeep not confirmed yet',
      note: bulletNote(cycle),
      signals: parsed.signals?.length
        ? parsed.signals
        : ['account_creation_open', 'loan_window_not_announced'],
    }
  }
  return { ...parsed, cycle }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const today = new Date().toISOString().slice(0, 10)
  const cycle = currentAcademicCycle()

  try {
    const raw = await redisGet('nsg:knowledge:application_status')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LiveApplicationStatus
        const checkedDay = (parsed.last_checked_iso || parsed.last_checked || '').slice(0, 10)
        const iso = new Date().toISOString()
        const normalized = normalizeForUi(parsed, cycle)
        return res.status(200).json({
          ...normalized,
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
