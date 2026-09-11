import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, adminAuthorized, cronAuthorized, rateLimitOr429 } from '../_lib/security'

/**
 * Refreshes time-sensitive NELFUND knowledge from official sources.
 * Home-card copy uses short bullet lines the UI stacks cleanly.
 */

type AppStatus =
  | 'not_announced'
  | 'open'
  | 'closed'
  | 'extended'
  | 'pending_verification'

export type LiveApplicationStatus = {
  cycle: string
  status: AppStatus
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
  { id: 'nelfund-portal', label: 'NELFUND application portal', url: 'https://portal.nelf.gov.ng/' },
]

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
function redisConfigured(): boolean {
  return !!(redisUrl() && redisToken())
}

async function redisCmd(command: unknown[]): Promise<unknown> {
  if (!redisConfigured()) throw new Error('Redis not configured')
  const path = command.map((c) => encodeURIComponent(String(c))).join('/')
  const res = await fetch(`${redisUrl()}/${path}`, {
    headers: { Authorization: `Bearer ${redisToken()}` },
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const json = (await res.json()) as { result: unknown }
  return json.result
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url: string): Promise<{ ok: boolean; text: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'NELFUND-Student-Guide/1.0 (+https://nelfund-student-guide.vercel.app; knowledge-refresh)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return { ok: false, text: '', error: `HTTP ${res.status}` }
    const html = await res.text()
    return { ok: true, text: stripHtml(html).slice(0, 80000) }
  } catch (e) {
    return { ok: false, text: '', error: e instanceof Error ? e.message : 'fetch failed' }
  }
}

function copyAccountOpenLoanUnconfirmed(cycle: string): { status_label: string; note: string } {
  return {
    status_label: `Account creation open · Loan/upkeep not confirmed yet`,
    note: `• Account creation (sign up): OPEN. You can create your account, finish your profile, and sort out your BVN.\n• Loan and upkeep application: NOT confirmed open yet for ${cycle}. Wait for official opening and closing dates on the portal.\nDo not use social media for deadlines. Use the buttons below for sign in or sign up.`,
  }
}

function copyLoanOpen(cycle: string, extended: boolean): { status_label: string; note: string } {
  return {
    status_label: extended
      ? `${cycle} loan/upkeep extended, confirm dates on the portal`
      : `${cycle} loan/upkeep application appears OPEN`,
    note: `• Loan and upkeep application: appears OPEN for ${cycle}. Still confirm exact dates on the portal before you rely on a deadline.\n• Account creation (sign up): available if you do not already have an account.\nOnly trust portal.nelf.gov.ng and nelf.gov.ng for deadlines.`,
  }
}

function copyLoanClosed(cycle: string): { status_label: string; note: string } {
  return {
    status_label: `Loan/upkeep closed · Account creation may still be open`,
    note: `• Loan and upkeep application: CLOSED (or previous cycle closed). Wait for the next ${cycle} opening dates on the official site.\n• Account creation (sign up): may still be open so you can prepare your profile and BVN.\nDo not use social media for deadlines.`,
  }
}

function analyse(combined: string): {
  status: AppStatus
  status_label: string
  note: string
  cycle: string
  confidence: 'high' | 'medium' | 'low'
  signals: string[]
} {
  const signals: string[] = []
  const cycle = currentAcademicCycle()

  const hasMarketingApply = /\bapply\s+now\b/i.test(combined)
  const hasFormalLoanOpen =
    /\b(applications?\s+(are\s+)?open|application\s+window\s+is\s+open|loan\s+application\s+(is\s+)?open|now\s+accepting\s+applications?|call\s+for\s+applications?|portal\s+is\s+open\s+for\s+applications?)\b/i.test(
      combined,
    )
  const hasClosed =
    /\b(applications?\s+(are\s+)?closed|window\s+(has\s+)?closed|application\s+closed|deadline\s+has\s+passed|no\s+longer\s+accepting)\b/i.test(
      combined,
    )
  const hasExtended =
    /\b(extended|extension\s+of\s+(the\s+)?(application|deadline)|deadline\s+extended)\b/i.test(combined)
  const hasActiveLoan =
    /\b(disbursement|student\s+loan|beneficiar|upkeep|repayment)\b/i.test(combined)
  const hasAccountCues =
    /\b(sign\s*up|create\s*(an?\s*)?account|register|bvn)\b/i.test(combined) || hasMarketingApply || hasActiveLoan

  if (hasMarketingApply) signals.push('marketing_apply_now')
  if (hasFormalLoanOpen) signals.push('formal_loan_open')
  if (hasClosed) signals.push('closed_language')
  if (hasExtended) signals.push('extended_language')
  if (hasActiveLoan) signals.push('active_scheme_language')
  if (hasAccountCues) signals.push('account_creation_cues')

  if (hasFormalLoanOpen && !hasClosed) {
    const c = copyLoanOpen(cycle, hasExtended)
    return {
      status: hasExtended ? 'extended' : 'open',
      status_label: c.status_label,
      note: c.note,
      cycle,
      confidence: 'high',
      signals,
    }
  }

  if (hasClosed && !hasFormalLoanOpen) {
    const c = copyLoanClosed(cycle)
    return {
      status: 'closed',
      status_label: c.status_label,
      note: c.note,
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  const c = copyAccountOpenLoanUnconfirmed(cycle)
  return {
    status: 'not_announced',
    status_label: c.status_label,
    note: c.note,
    cycle,
    confidence: hasAccountCues ? 'medium' : 'low',
    signals,
  }
}

export async function runRefresh(): Promise<LiveApplicationStatus> {
  const fetched: Array<{ id: string; label: string; url: string; text: string; ok: boolean }> = []
  for (const s of OFFICIAL_SOURCES) {
    const r = await fetchText(s.url)
    fetched.push({ ...s, text: r.text, ok: r.ok })
  }

  const combined = fetched
    .filter((f) => f.ok)
    .map((f) => f.text)
    .join('\n\n')

  const now = new Date()
  const iso = now.toISOString()
  const day = iso.slice(0, 10)
  const cycle = currentAcademicCycle(now)

  if (!combined.trim()) {
    const c = copyAccountOpenLoanUnconfirmed(cycle)
    const fallback: LiveApplicationStatus = {
      cycle,
      status: 'not_announced',
      status_label: c.status_label,
      note: c.note,
      last_checked: day,
      last_checked_iso: iso,
      sources: OFFICIAL_SOURCES,
      confidence: 'medium',
      freshness: 'static_fallback',
      signals: ['fetch_failed', 'account_creation_open', 'loan_window_not_announced'],
      verified: false,
    }
    try {
      if (redisConfigured()) await redisCmd(['SET', 'nsg:knowledge:application_status', JSON.stringify(fallback)])
    } catch {
      /* ignore */
    }
    return fallback
  }

  const analysis = analyse(combined)
  const payload: LiveApplicationStatus = {
    ...analysis,
    cycle,
    last_checked: day,
    last_checked_iso: iso,
    sources: OFFICIAL_SOURCES,
    freshness: 'live',
    verified: analysis.confidence !== 'low',
  }

  if (redisConfigured()) {
    await redisCmd(['SET', 'nsg:knowledge:application_status', JSON.stringify(payload)])
    await redisCmd(['SET', 'nsg:knowledge:application_status:updated_at', iso])
  }
  return payload
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!rateLimitOr429(req, res, 'knowledge-refresh', 10, 60_000)) return

  const isCron = typeof req.headers['x-vercel-cron'] !== 'undefined'
  const authorized = isCron
    ? cronAuthorized(req) || adminAuthorized(req)
    : adminAuthorized(req) || cronAuthorized(req)
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await runRefresh()
    return res.status(200).json({ ok: true, status: result })
  } catch (err) {
    console.error('[knowledge/refresh]', err)
    return res.status(500).json({ error: 'Refresh failed' })
  }
}
