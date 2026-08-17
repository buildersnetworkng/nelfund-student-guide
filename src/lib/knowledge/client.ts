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

const CACHE_KEY = 'nsg_live_app_status_v1'
const CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes browser cache

export async function fetchLiveApplicationStatus(opts?: {
  force?: boolean
}): Promise<LiveApplicationStatus | null> {
  try {
    if (!opts?.force && typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { at, data } = JSON.parse(cached) as { at: number; data: LiveApplicationStatus }
        if (Date.now() - at < CACHE_TTL_MS) return data
      }
    }
  } catch {
    /* ignore */
  }

  const q = opts?.force ? '?force=1' : ''
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

/** Format last_checked for UI — always prefer the server-provided date. */
export function formatChecked(status: LiveApplicationStatus): string {
  if (status.last_checked_iso) {
    try {
      return new Date(status.last_checked_iso).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      /* fall through */
    }
  }
  return status.last_checked
}

/** Intents that should pull live application-status knowledge. */
export const LIVE_STATUS_INTENTS = new Set([
  'deadline',
  'how-to-apply',
  'reapplication',
  'eligibility',
  'academic-session',
  'official-sources',
])

export function questionNeedsLiveStatus(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\b(is\s+(nelfund|it)\s+open|application\s*(window|period|status)|still\s+open|deadline|closing\s+date|opening\s+date|when\s+(can|do)\s+i\s+apply|latest\s+(nelfund\s+)?(update|news|status)|current\s+(status|cycle)|2026\s*\/?\s*2027|2025\s*\/?\s*2026)\b/i.test(
      t,
    ) || /\b(open\s+today|apply\s+today|portal\s+open)\b/i.test(t)
  )
}
