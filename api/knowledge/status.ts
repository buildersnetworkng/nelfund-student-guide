/**
 * Application-window status for the Student Guide.
 * Reachability ≠ verified open/closed. Static pack dates are metadata only.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export type ApplicationStatusCode =
  | 'not_announced'
  | 'open'
  | 'closed'
  | 'extended'
  | 'pending_verification'
  | 'confirm_on_portal'
  | 'unknown'
  | 'unverified'

export type LiveApplicationStatus = {
  cycle: string
  status: ApplicationStatusCode
  status_label: string
  note: string
  last_checked: string
  last_checked_iso: string
  sources: Array<{ id: string; label: string; url: string }>
  confidence: 'high' | 'medium' | 'low'
  freshness: 'live' | 'cached' | 'static_fallback' | 'probe_only'
  signals: string[]
  /** True only when an official live check confirmed open/closed — never for static pack alone. */
  verified: boolean
  window_start?: string
  window_end?: string
  window_note?: string
  evidence?: Array<{ source_id: string; reachable: boolean; http_status?: number; note: string }>
  distinctions?: {
    national_window: string
    institution_session: string
    individual_eligibility: string
  }
}

const OFFICIAL_SOURCES = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND signup / application portal', url: 'https://portal.nelf.gov.ng/' },
  { id: 'nelfund-login', label: 'NELFUND login / sign in', url: 'https://portal.nelf.gov.ng/auth/login' },
]

function loadPack(): {
  cycle: string
  status: string
  status_label: string
  note: string
  window_start?: string
  window_end?: string
  window_note?: string
} {
  try {
    const p = join(process.cwd(), 'src/data/application-status.json')
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8'))
    }
  } catch {
    /* ignore */
  }
  return {
    cycle: '2026/2027',
    status: 'confirm_on_portal',
    status_label: 'Confirm live on the official portal only',
    note:
      'Status answers must always point students to portal.nelf.gov.ng. Guide pack dates are not live confirmation.',
    window_start: '2026-09-23',
    window_end: '2026-12-31',
    window_note:
      'Dates in the guide pack may appear in secondary reports. They are NOT a substitute for what the portal shows today.',
  }
}

function baseFromPack(): LiveApplicationStatus {
  const pack = loadPack()
  const now = new Date().toISOString()
  return {
    cycle: pack.cycle || '2026/2027',
    status: 'confirm_on_portal',
    status_label: pack.status_label || 'Confirm live on the official portal only',
    note:
      (pack.note ||
        'Confirm whether Request Loan is available on your account at portal.nelf.gov.ng.') +
      ' Guide pack dates are metadata only — not a live open/closed verification.',
    last_checked: now,
    last_checked_iso: now,
    sources: OFFICIAL_SOURCES,
    confidence: 'low',
    freshness: 'static_fallback',
    signals: ['pack_metadata_only', 'confirm_on_portal', 'not_live_verified'],
    verified: false,
    window_start: pack.window_start,
    window_end: pack.window_end,
    window_note:
      pack.window_note ||
      'Pack dates are secondary. Confirm on the official portal for your institution and account.',
    distinctions: {
      national_window:
        'A national application window, if any, is announced by NELFUND. This guide does not invent one.',
      institution_session:
        'Your school must have an open session on the portal; a national window does not guarantee every institution is active.',
      individual_eligibility:
        'Eligibility (citizenship, public institution, school record upload, etc.) is separate from whether a window is open.',
    },
  }
}

async function probeSources(): Promise<{
  evidence: LiveApplicationStatus['evidence']
  anyReachable: boolean
  signals: string[]
}> {
  const evidence: NonNullable<LiveApplicationStatus['evidence']> = []
  const signals: string[] = []
  let anyReachable = false
  for (const s of OFFICIAL_SOURCES) {
    try {
      const r = await fetch(s.url, {
        headers: { 'User-Agent': 'NELFUND-Student-Guide/1.0 (status-probe)' },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      })
      const reachable = r.ok
      if (reachable) anyReachable = true
      signals.push(`${s.id}:${reachable ? 'reachable' : `http_${r.status}`}`)
      evidence.push({
        source_id: s.id,
        reachable,
        http_status: r.status,
        note: reachable
          ? 'Host responded OK. Content was not treated as a verified open/closed declaration.'
          : `HTTP ${r.status}; not used as status evidence.`,
      })
    } catch (e) {
      signals.push(`${s.id}:unreachable`)
      evidence.push({
        source_id: s.id,
        reachable: false,
        note: e instanceof Error ? e.message : 'fetch failed',
      })
    }
  }
  return { evidence, anyReachable, signals }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = baseFromPack()
    const wantProbe =
      req.method === 'GET' &&
      (String(req.query?.refresh || '') === '1' ||
        String(req.query?.force || '') === '1' ||
        String(req.query?.probe || '') === '1')

    if (wantProbe) {
      const probe = await probeSources()
      return res.status(200).json({
        ...base,
        freshness: 'probe_only' as const,
        verified: false,
        confidence: 'low' as const,
        status: 'confirm_on_portal' as const,
        signals: [...base.signals, ...probe.signals, 'probe_does_not_verify_window'],
        evidence: probe.evidence,
        note:
          base.note +
          (probe.anyReachable
            ? ' Official hosts were reachable at probe time; open/closed still requires confirmation on your portal account.'
            : ' Could not reach one or more official hosts; confirm status on the portal when you can.'),
      })
    }

    return res.status(200).json(base)
  } catch {
    const fallback = baseFromPack()
    return res.status(200).json({
      ...fallback,
      signals: [...fallback.signals, 'handler_error'],
      verified: false,
      status: 'unverified' as const,
      status_label: 'Status unverified — confirm on the official portal',
    })
  }
}
