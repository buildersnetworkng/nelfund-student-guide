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

const OFFICIAL_SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
]

function fallbackStatus(): LiveApplicationStatus {
  const now = new Date()
  const cycle = currentAcademicCycle(now)
  return {
    cycle,
    status: 'not_announced',
    status_label: 'Confirm on official portal',
    note:
      'Open/closed windows change. Only trust portal.nelf.gov.ng and nelf.gov.ng for deadlines.\n' +
      'Login: https://portal.nelf.gov.ng/auth/login · Signup: https://portal.nelf.gov.ng/',
    last_checked: now.toISOString(),
    last_checked_iso: now.toISOString(),
    sources: OFFICIAL_SOURCES,
    confidence: 'low',
    freshness: 'static_fallback',
    signals: ['static_fallback'],
    verified: false,
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const status = fallbackStatus()
    return res.status(200).json(status)
  } catch {
    return res.status(200).json(fallbackStatus())
  }
}
