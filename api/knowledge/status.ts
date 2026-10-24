/**
 * Application-window status for the Student Guide.
 * Never claim a verified open/closed window unless a real live check succeeds.
 * Static pack dates are guide metadata only — not a substitute for the portal.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

type LiveApplicationStatus = {
  cycle: string
  status: 'not_announced' | 'open' | 'closed' | 'extended' | 'pending_verification' | 'confirm_on_portal'
  status_label: string
  note: string
  last_checked: string
  last_checked_iso: string
  sources: Array<{ id: string; label: string; url: string }>
  confidence: 'high' | 'medium' | 'low'
  freshness: 'live' | 'cached' | 'static_fallback'
  signals: string[]
  verified: boolean
  window_start?: string
  window_end?: string
  window_note?: string
}

const OFFICIAL_SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
]

/** Pack metadata from src/data/application-status.json — guide only, not live policy. */
const PACK = {
  cycle: "2026/2027",
  status_label: "Confirm live on the official portal only",
  note: "Status answers must always point students to portal.nelf.gov.ng to see whether Request Loan is available on their account. School-side session blocks can still show even when a national window is open.",
  window_start: "2026-09-23",
  window_end: "2026-12-31",
  window_note: "Dates sometimes appear in secondary reports. They are NOT a substitute for what the portal shows today.",
}

function fallbackStatus(): LiveApplicationStatus {
  const now = new Date()
  return {
    cycle: PACK.cycle,
    status: 'confirm_on_portal',
    status_label: PACK.status_label,
    note:
      (PACK.note ||
        'Status answers must always point students to portal.nelf.gov.ng.') +
      ' Guide pack dates are not a live confirmation.',
    last_checked: now.toISOString(),
    last_checked_iso: now.toISOString(),
    sources: OFFICIAL_SOURCES,
    confidence: 'low',
    freshness: 'static_fallback',
    signals: ['pack_metadata_only', 'confirm_on_portal'],
    verified: false,
    window_start: PACK.window_start || undefined,
    window_end: PACK.window_end || undefined,
    window_note:
      PACK.window_note ||
      'Dates in the guide pack are secondary. They are NOT a substitute for what the portal shows today.',
  }
}

async function probeOfficialHosts(): Promise<{ ok: boolean; signals: string[] }> {
  const signals: string[] = []
  let anyOk = false
  for (const s of OFFICIAL_SOURCES) {
    try {
      const r = await fetch(s.url, {
        headers: { 'User-Agent': 'NELFUND-Student-Guide/1.0' },
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        anyOk = true
        signals.push(`${s.id}:reachable`)
      } else {
        signals.push(`${s.id}:http_${r.status}`)
      }
    } catch {
      signals.push(`${s.id}:unreachable`)
    }
  }
  return { ok: anyOk, signals }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = fallbackStatus()
    const wantProbe =
      req.method === 'GET' &&
      (String(req.query?.refresh || '') === '1' || String(req.query?.force || '') === '1')

    if (wantProbe) {
      const probe = await probeOfficialHosts()
      return res.status(200).json({
        ...base,
        signals: [...base.signals, ...probe.signals],
        verified: false,
        confidence: 'low' as const,
        freshness: (probe.ok ? 'live' : 'static_fallback') as const,
        note:
          base.note +
          (probe.ok
            ? ' Official hosts responded; open/closed must still be confirmed on your account.'
            : ' Could not reach official hosts from this check; confirm on the portal when you can.'),
      })
    }

    return res.status(200).json(base)
  } catch {
    return res.status(200).json(fallbackStatus())
  }
}
