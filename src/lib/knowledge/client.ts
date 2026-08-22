/**
 * Client helpers for live / refreshed NELFUND knowledge.
 * Used by the home StatusCard and the conversational AI.
 */

export type LiveApplicationStatus = {
  cycle: string
  status: 'not_announced' | 'open' | 'closed' | 'extended' | 'pending_verification'
  status_label: string
  note: string
  last_checked: string
  last_checked_iso?: string
  sources?: Array<{ id: string; label: string; url: string }>
  confidence?: 'high' | 'medium' | 'low'
  freshness?: 'live' | 'cached' | 'static_fallback'
  signals?: string[]
  verified?: boolean
}

const CACHE_KEY = 'nsg_live_app_status_v2'
const CACHE_TTL_MS = 1000 * 60 * 15 // 15 minutes browser cache

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function isSameCalendarDay(isoOrDay: string): boolean {
  const day = isoOrDay.slice(0, 10)
  return day === todayUtc()
}

export async function fetchLiveApplicationStatus(opts?: {
  force?: boolean
}): Promise<LiveApplicationStatus | null> {
  try {
    if (!opts?.force && typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { at, data } = JSON.parse(cached) as { at: number; data: LiveApplicationStatus }
        const stillFresh = Date.now() - at < CACHE_TTL_MS
        const dayOk = isSameCalendarDay(data.last_checked_iso || data.last_checked || '')
        // Auto-refresh if the stored check is not from today
        if (stillFresh && dayOk) return data
      }
    }
  } catch {
    /* ignore */
  }

  // Force server refresh when client has no same-day data
  const q = opts?.force ? '?force=1' : '?refresh=1'
  const res = await fetch(`/api/knowledge/status${q}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as LiveApplicationStatus
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* ignore */
  }
  return data
}

/** Format last_checked for UI — "Today", "Yesterday", or a clear date. */
export function formatChecked(status: LiveApplicationStatus): string {
  const raw = status.last_checked_iso || status.last_checked
  if (!raw) return todayUtc()

  try {
    const d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00Z`)
    if (Number.isNaN(d.getTime())) return status.last_checked || todayUtc()

    const now = new Date()
    const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const startThat = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`

    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return status.last_checked || todayUtc()
  }
}

/** Intents that should pull live application-status knowledge. */
export const LIVE_STATUS_INTENTS = new Set([
  'deadline',
  'how-to-apply',
  'reapplication',
  'eligibility',
  'academic-session',
  'official-sources',
  'current-information',
])

export function questionNeedsLiveStatus(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\b(is\s+(nelfund|it)\s+open|application\s*(window|period|status)|still\s+open|deadline|closing\s+date|opening\s+date|when\s+(can|do)\s+i\s+apply|latest\s+(nelfund\s+)?(update|news|status)|current\s+(status|information)|still\s+accepting)/i.test(
      t,
    )
  )
}
