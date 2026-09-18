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

function bulletNoteUnconfirmed(cycle: string): string {
  return (
    `• Account creation (sign up): OPEN. You can start registration on the portal.\n` +
    `• To finish account creation you still need NIN, BVN, JAMB, and the other details the portal asks for - you cannot complete it without them.\n` +
    `• Loan and upkeep application: NOT confirmed open yet for ${cycle}. Wait for official opening and closing dates on the portal.\n` +
    `Do not use social media for deadlines. Use the buttons below for sign in or sign up.`
  )
}

function bulletNoteOpen(cycle: string, extended: boolean): { status_label: string; note: string } {
  return {
    status_label: extended
      ? `${cycle} loan/upkeep extended, confirm dates on the portal`
      : `${cycle} loan/upkeep application appears OPEN`,
    note:
      `• Loan and upkeep application: appears OPEN for ${cycle}. Still confirm exact dates on the portal before you rely on a deadline.\n` +
      `• Account creation (sign up): available if you do not already have an account.\n` +
      `Only trust portal.nelf.gov.ng and nelf.gov.ng for deadlines.`,
  }
}

function bulletNoteClosed(cycle: string): { status_label: string; note: string } {
  return {
    status_label: 'Loan/upkeep closed · Account creation may still be open',
    note:
      `• Loan and upkeep application: CLOSED (or previous cycle closed). Wait for the next ${cycle} opening dates on the official site.\n` +
      `• Account creation (sign up): may still be open. You still need NIN, BVN, JAMB, and the other portal requirements to finish registration.\n` +
      `Do not use social media for deadlines.`,
  }
}

function guidancePayload(freshness: LiveApplicationStatus['freshness']): LiveApplicationStatus {
  const iso = new Date().toISOString()
  const cycle = currentAcademicCycle()
  return {
    cycle,
    status: 'not_announced',
    status_label: 'Account creation open · Loan/upkeep not confirmed yet',
    note: bulletNoteUnconfirmed(cycle),
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

function normalizeForUi(parsed: LiveApplicationStatus, cycle: string): LiveApplicationStatus {
  const note = (parsed.note || '').trim()
  const needsBullets =
    !note.includes('•') ||
    note.includes('academic cycle') ||
    note.includes('home card cycle') ||
    note.includes('no announced deadline') ||
    note.includes('sort out your BVN') ||
    note.includes('prepare your profile and BVN')

  const base: LiveApplicationStatus = {
    ...parsed,
    cycle,
  }

  if (parsed.status === 'open' || parsed.status === 'extended') {
    if (needsBullets) {
      const c = bulletNoteOpen(cycle, parsed.status === 'extended')
      return { ...base, status_label: c.status_label, note: c.note }
    }
    return {
      ...base,
      note: note.replace(/\d{4}\/\d{4}/g, cycle),
      status_label: (parsed.status_label || '').replace(/\d{4}\/\d{4}/g, cycle) || base.status_label,
    }
  }

  if (parsed.status === 'closed') {
    if (needsBullets) {
      const c = bulletNoteClosed(cycle)
      return { ...base, status_label: c.status_label, note: c.note }
    }
    return {
      ...base,
      note: note.replace(/\d{4}\/\d{4}/g, cycle),
      status_label: (parsed.status_label || '').replace(/\d{4}\/\d{4}/g, cycle) || base.status_label,
    }
  }

  return {
    ...base,
    status: 'not_announced',
    status_label: 'Account creation open · Loan/upkeep not confirmed yet',
    note: bulletNoteUnconfirmed(cycle),
    signals: parsed.signals?.length
      ? parsed.signals
      : ['account_creation_open', 'loan_window_not_announced'],
  }
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
