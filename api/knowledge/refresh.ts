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
    .replace(/&/g, '&')
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

  if (hasOpen && !hasClosed) {
    return {
      status: hasExtended ? 'extended' : 'open',
      status_label: hasExtended
        ? 'Application window extended — confirm on the official portal'
        : 'Applications appear open — confirm on the official portal',
      note:
        'Official NELFUND pages currently include language consistent with an active application window. Always confirm on portal.nelf.gov.ng before starting a new application. Do not rely on social media for deadlines.',
      cycle,
      confidence: signals.length >= 2 ? 'high' : 'medium',
      signals,
    }
  }

  if (hasClosed && !hasOpen) {
    return {
      status: 'closed',
      status_label: 'Application window appears closed — confirm on the official portal',
      note:
        'Official pages currently include language consistent with a closed application window. Check portal.nelf.gov.ng and nelf.gov.ng for any reopening or new cycle announcement.',
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
        'Official pages reference an extension related to applications. Exact dates can change. Verify current eligibility to apply only on portal.nelf.gov.ng.',
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  if (hasActiveLoan) {
    return {
      status: 'pending_verification',
      status_label: 'Scheme active; confirm live portal status for new applications',
      note:
        'Official NELFUND channels continue to describe student loan activity. A separately labelled new-cycle open window is not clearly confirmed from this automated check. Always verify whether applications are open for your session on portal.nelf.gov.ng and announcements on nelf.gov.ng.',
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  return {
    status: 'pending_verification',
    status_label: 'Information pending official confirmation',
    note:
      'This automated check could not confirm a clear open or closed application window from official pages. Do not rely on unofficial websites or social media for dates. Verify only on nelf.gov.ng and portal.nelf.gov.ng.',
    cycle,
    confidence: 'low',
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
      status: 'pending_verification',
      status_label: 'Could not reach official sources — verify on the portal',
      note:
        'The guide could not retrieve official NELFUND pages right now. Open portal.nelf.gov.ng and nelf.gov.ng directly to confirm whether applications are open.',
      last_checked: day,
      last_checked_iso: iso,
      sources: OFFICIAL_SOURCES,
      confidence: 'low',
      freshness: 'static_fallback',
      signals: ['fetch_failed'],
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
  if (!secret) return true
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
