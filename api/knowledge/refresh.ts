import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Refreshes time-sensitive NELFUND knowledge from official sources.
 * Invoked by Vercel Cron and on-demand when status is stale.
 * Cycle label is always computed from today's date (Aug–Jul academic session).
 * Open/closed status tracks language on nelf.gov.ng + portal.nelf.gov.ng — never invents dates.
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

/** Nigerian tertiary session: from August, label is YYYY/(YYYY+1). */
function currentAcademicCycle(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0=Jan … 7=Aug
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

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
  const cycleEsc = cycle.replace('/', '\\/')

  const hasOpen =
    /\b(applications?\s+(are\s+)?open|apply\s+now|portal\s+is\s+open|application\s+window\s+is\s+open|start\s+your\s+application|call\s+for\s+applications?|loan\s+application\s+(is\s+)?open|now\s+accepting\s+applications?)\b/i.test(
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
  const mentionsThisCycle = new RegExp(cycleEsc.replace('\\/', '[\\/\\s]*')).test(combined)
  const hasLoanWindowPhrase =
    /\b(loan\s+application|upkeep\s+application|application\s+window|institutional\s+loan)\b/i.test(combined)

  if (hasOpen) signals.push('open_language')
  if (hasClosed) signals.push('closed_language')
  if (hasExtended) signals.push('extended_language')
  if (hasActiveLoan) signals.push('active_scheme_language')
  if (mentionsThisCycle) signals.push(`cycle_${cycle.replace('/', '_')}`)
  if (hasLoanWindowPhrase) signals.push('loan_window_phrase')

  // Strong signal: open language + loan/window wording → treat as open for this cycle (still confirm on portal)
  const strongOpen = hasOpen && !hasClosed && (hasLoanWindowPhrase || mentionsThisCycle)

  if (strongOpen) {
    return {
      status: hasExtended ? 'extended' : 'open',
      status_label: hasExtended
        ? `${cycle} application window extended — confirm dates on the official portal`
        : `${cycle} application activity detected — confirm open window on the official portal`,
      note: `Official NELFUND pages currently use language consistent with an active application period for the **${cycle}** cycle. Account creation and/or loan/upkeep steps may be available. Opening and closing dates can still change — always verify on portal.nelf.gov.ng and nelf.gov.ng. Do not rely on social media for deadlines.`,
      cycle,
      confidence: signals.length >= 2 ? 'high' : 'medium',
      signals,
    }
  }

  if (hasOpen && !hasClosed) {
    return {
      status: 'open',
      status_label: `Portal activity detected — confirm whether this is account creation or a new ${cycle} loan window`,
      note: `Official NELFUND pages currently include language consistent with active portal activity for the **${cycle}** period. Account creation may be available so you can register and sort out your BVN. Treat a full loan/upkeep application window as confirmed only when NELFUND states opening and closing dates on the official site. Always verify on portal.nelf.gov.ng. Do not rely on social media for deadlines.`,
      cycle,
      confidence: signals.length >= 2 ? 'high' : 'medium',
      signals,
    }
  }

  if (hasClosed && !hasOpen) {
    return {
      status: 'closed',
      status_label: `Previous window appears closed — ${cycle} intake not confirmed open yet`,
      note: `Official pages currently include language consistent with a closed application window. NELFUND account creation may still be available so you can create an account and sort out your BVN. When the **${cycle}** loan and upkeep window opens, NELFUND will announce it on portal.nelf.gov.ng and nelf.gov.ng — not on social media.`,
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  if (hasExtended) {
    return {
      status: 'extended',
      status_label: `${cycle} extension referenced — confirm current dates on the official portal`,
      note: `Official pages reference an extension related to applications (${cycle}). Exact dates can change. Account creation may still be available. Verify whether you can apply for a loan or upkeep only on portal.nelf.gov.ng.`,
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  // Default: account creation guidance; loan window not formally announced for this cycle
  const defaultLabel = `Account creation open — ${cycle} loan window not yet announced`
  const defaultNote = `NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. Any deadline you may be seeing may relate to a previous loan/upkeep cycle. The **${cycle}** loan and upkeep application window should be treated as unconfirmed until NELFUND announces official opening and closing dates. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.`

  if (hasActiveLoan) {
    return {
      status: 'not_announced',
      status_label: defaultLabel,
      note: defaultNote,
      cycle,
      confidence: 'medium',
      signals,
    }
  }

  return {
    status: 'not_announced',
    status_label: defaultLabel,
    note: defaultNote,
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
  const cycle = currentAcademicCycle(now)

  if (!combined.trim()) {
    const fallback: LiveApplicationStatus = {
      cycle,
      status: 'not_announced',
      status_label: `Account creation open — ${cycle} loan window not yet announced`,
      note: `NELFUND account creation is currently open and has no announced deadline, so you can create your account and sort out your BVN. The **${cycle}** loan and upkeep application window should be treated as unconfirmed until NELFUND announces official opening and closing dates. Always confirm on portal.nelf.gov.ng. Do not rely on social media for deadlines.`,
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
    cycle, // always today's academic cycle for the home card year
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
