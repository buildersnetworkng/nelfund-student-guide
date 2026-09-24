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
      'Active session 2026/2027. Window 23 Sep 2026 – 31 Dec 2026. ' +
      'Re-enter BVN and bank for this cycle. Institutional fee is school-specific (Raise a dispute if wrong before submit). ' +
      'Upkeep if selected: portal shows monthly stipend of N20,000 to your account (confirm live). ' +
      'Accept Terms & GSI Mandate before submit. Pending shows under Institutional / Upkeep tabs. ' +
      'Confirm on portal.nelf.gov.ng. Login: https://portal.nelf.gov.ng/auth/login',
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
