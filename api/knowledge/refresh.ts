import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Refreshes time-sensitive NELFUND knowledge from official sources.
 * Invoked by Vercel Cron and on-demand when status is stale.
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

function redisUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || 'https://premium-rooster-109704.upstash.io'
}
function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAayIAQIgcDE2YWZkNzllZDIxN2I0MjA5YWIwNDQ1OGFjNTY0MGUzNg'
}

async function redisCmd(command: unknown[]): Promise<unknown> {
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
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url: string): Promise<{ ok: boolean; text: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NELFUND-Student-Guide/1.0 (+https://nelfund-student-guide.vercel.app; knowledge-refresh)',
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

function analyse(combined: string): {
  status: AppStatus
  status_label: string
  note: string
  cycle: string
  confidence: 'high' | 'medium' | 'low'
  signals: string[]
} {
  const t = combined.toLowerCase()
  const signals: string[] = []

  const hasOpen =
    /\b(applications?\s+(are\s+)?open|apply\s+now|portal\s+is\s+open|application\s+window\s+is\s+open|start\s+your\s+application)\b/i.test(
      combined,
    )
  const hasClosed =
    /\b(applications?\s+(are\s+)?closed|window\s+(has\s+)?closed|application\s+closed|deadline\s+has\s+passed)\b/i.test(
      combined,
    )
  const hasExtended =
    /\b(extended|extension\s+of\s+(the\s+)?(application|deadline)|deadline\s+extended)\b/i.test(combined)
  const hasActiveLoan =
    /\b(disbursement|student\s+loan|beneficiar|upkeep|repayment)\b/i.test(combined)
  const mentions2526 = /2025\s*\/\s*2026|2025\/2026/.test(combined)
  const mentions2627 = /2026\s*\/\s*2027|2026\/2027/.test(combined)

  if (hasOpen) signals.push('open_language')
  if (hasClosed) signals.push('closed_language')
  if (hasExtended) signals.push('extended_language')
  if (hasActiveLoan) signals.push('active_scheme_language')
  if (mentions2526) signals.push('cycle_2025_2026')
  if (mentions2627) signals.push('cycle_2026_2027')

  let cycle = '2025/2026 and subsequent cycles'
  if (mentions2627 && !mentions2526) cycle = '2026/2027'
  else if (mentions2526) cycle = '2025/2026 and subsequent cycles'

  // Prefer explicit signals; never invent a formal loan-application open window without evidence.
  // Important distinction: portal/account creation can be available while a new-cycle
  // loan/upkeep application window is not yet announced.
  if (hasOpen && !hasClosed) {
    return {
      status: hasExtended ? 'extended' : 'open',
      status_label: hasExtended
        ? 'Application window extended — confirm on the official portal'
        : 'Portal activity detected — confirm whether this is account creation or a new loan window',
      note:
        'Official NELFUND pages currently include language consistent with active portal activity. Account creation may be available so you can register and sort out your BVN. Treat any new-cycle loan/upkeep application window as unconfirmed until NELFUND announces official opening and closing dates. Always verify on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
      cycle,
      confidence: signals.length >= 2 ? 'high' : 'medium',
      signals,
    }
  }

  if (hasClosed && !hasOpen) {
    return {
      status: 'closed',
      status_label: 'Previous application cycle appears closed — new window not yet announced',
      note:
        'Official pages currently include language consistent with a closed application window for the previous cycle. NELFUND account creation may still be available so you can create an account and sort out your BVN. The next loan and upkeep application window is expected to open later; confirm only on portal.nelf.gov.ng and nelf.gov.ng when NELFUND announces official dates.',
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  if (hasExtended) {
    return {
      status: 'extended',
      status_label: 'Extension referenced — confirm current dates on the official portal',
      note:
        'Official pages reference an extension related to applications. Exact dates can change. Account creation may still be available. Verify current eligibility to apply for a loan or upkeep only on portal.nelf.gov.ng.',
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  // Scheme may be active (disbursements) even when a new intake is not formally labelled.
  // Default accurate messaging: account creation open; loan window not yet announced.
  if (hasActiveLoan) {
    return {
      status: 'not_announced',
      status_label: 'Account creation open — 2026/2027 loan window not yet announced',
      note:
        'NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing relates to the previous loan/upkeep application cycle, which has already closed. The 2026/2027 loan and upkeep application window is expected to open soon, but NELFUND has not yet announced the official opening or closing date. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  return {
    status: 'not_announced',
    status_label: 'Account creation open — 2026/2027 loan window not yet announced',
    note:
      'NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing relates to the previous loan/upkeep application cycle, which has already closed. The 2026/2027 loan and upkeep application window is expected to open soon, but NELFUND has not yet announced the official opening or closing date. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
    cycle,
    confidence: 'medium',
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

  if (!combined.trim()) {
    const fallback: LiveApplicationStatus = {
      cycle: '2025/2026 and subsequent cycles',
      status: 'not_announced',
      status_label: 'Account creation open — 2026/2027 loan window not yet announced',
      note:
        'NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing relates to the previous loan/upkeep application cycle, which has already closed. The 2026/2027 loan and upkeep application window is expected to open soon, but NELFUND has not yet announced the official opening or closing date. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.',
      last_checked: day,
      last_checked_iso: iso,
      sources: OFFICIAL_SOURCES,
      confidence: 'medium',
      freshness: 'static_fallback',
      signals: ['fetch_failed', 'account_creation_open', 'loan_window_not_announced'],
      verified: false,
    }
    try {
      await redisCmd(['SET', 'nsg:knowledge:application_status', JSON.stringify(fallback)])
    } catch {
      /* ignore */
    }
    return fallback
  }

  const analysis = analyse(combined)
  const payload: LiveApplicationStatus = {
    ...analysis,
    last_checked: day,
    last_checked_iso: iso,
    sources: OFFICIAL_SOURCES,
    freshness: 'live',
    verified: analysis.confidence !== 'low',
  }

  await redisCmd(['SET', 'nsg:knowledge:application_status', JSON.stringify(payload)])
  await redisCmd(['SET', 'nsg:knowledge:application_status:updated_at', iso])
  return payload
}

function cronAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // allow when unset (hobby / first setup)
  const auth = req.headers.authorization
  return auth === `Bearer ${secret}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vercel Cron sends GET with Authorization: Bearer <CRON_SECRET>
  const isCron = typeof req.headers['x-vercel-cron'] !== 'undefined'
  if (isCron && !cronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized cron' })
  }

  try {
    const result = await runRefresh()
    return res.status(200).json({ ok: true, status: result })
  } catch (err) {
    console.error('[knowledge/refresh]', err)
    return res.status(500).json({ error: 'Refresh failed' })
  }
}
