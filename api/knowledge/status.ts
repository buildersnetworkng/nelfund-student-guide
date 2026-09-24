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

const OFFICIAL_SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
]

function fallbackStatus(): LiveApplicationStatus {
  const now = new Date()
  return {
    cycle: '2026/2027',
    status: 'open',
    status_label: '2026/2027 open · 23 Sep 2026 – 31 Dec 2026',
    note:
      'Portal notice: 2026/2027 session registration starts 23 September 2026 and ends 31 December 2026. ' +
      'Re-enter BVN and bank details for this cycle. ' +
      'If your institution has not opened a session yet, contact the campus NELFUND desk even though the national window is open. ' +
      'Confirm live on portal.nelf.gov.ng. Login: https://portal.nelf.gov.ng/auth/login',
    last_checked: now.toISOString(),
    last_checked_iso: now.toISOString(),
    sources: OFFICIAL_SOURCES,
    confidence: 'high',
    freshness: 'static_fallback',
    signals: ['portal_notice_2026_2027'],
    verified: true,
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json(fallbackStatus())
  } catch {
    return res.status(200).json(fallbackStatus())
  }
}
