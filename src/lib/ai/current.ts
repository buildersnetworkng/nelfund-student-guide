/**
 * Current-information answers — never invent official open/close dates.
 * Live path: /api/knowledge/status (+ optional official-page lookup) with exact check timestamp.
 */

import type { GroundedAnswer } from './types'

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const FAQ = 'https://nelf.gov.ng/faq'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

type LiveStatus = {
  cycle?: string
  status?: string
  status_label?: string
  note?: string
  last_checked?: string
  last_checked_iso?: string
  freshness?: string
  verified?: boolean
  confidence?: string
  signals?: string[]
  sources?: Array<{ id: string; label: string; url: string }>
}

function formatWhen(isoOrDay?: string): string {
  if (!isoOrDay) return 'unknown time'
  try {
    const d = new Date(isoOrDay.includes('T') ? isoOrDay : `${isoOrDay}T12:00:00Z`)
    if (Number.isNaN(d.getTime())) return isoOrDay
    // Africa/Lagos (WAT, UTC+1, no DST)
    const wat = new Date(d.getTime() + 60 * 60 * 1000)
    const y = wat.getUTCFullYear()
    const m = String(wat.getUTCMonth() + 1).padStart(2, '0')
    const day = String(wat.getUTCDate()).padStart(2, '0')
    const hh = String(wat.getUTCHours()).padStart(2, '0')
    const mm = String(wat.getUTCMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm} WAT`
  } catch {
    return isoOrDay
  }
}

function todayWatLabel(): string {
  return formatWhen(new Date().toISOString())
}

export function buildCurrentInformationAnswer(): GroundedAnswer {
  const answer = `**Current application status (checked ${todayWatLabel()})**

I do **not invent** opening or closing dates.

**Check only:**
• Official site: ${SITE}
• Student portal: ${PORTAL}
• FAQ: ${FAQ}

**Remember:**
• Account creation ≠ the full ${new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1} loan window being open
• Social media deadlines are unofficial until they match nelf.gov.ng or the portal

Say what you need (create account, apply, pending, missing information) and I will guide that path.`

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: 0.85,
    responseMode: 'conversation',
    problem: null,
    answer,
    whatThisMeans: null,
    nextActions: [SITE, PORTAL, FAQ],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
}

function answerFromLiveStatus(data: LiveStatus, extraSnippets?: string[]): GroundedAnswer {
  const when = formatWhen(data.last_checked_iso || data.last_checked)
  const cycle = data.cycle || 'current cycle'
  const label = data.status_label || 'Status from official sources'
  const note = data.note || ''
  const freshness =
    data.freshness === 'live'
      ? 'live from official pages'
      : data.freshness === 'cached'
        ? 'recently verified from official pages'
        : 'safe fallback — confirm on the portal'

  let body = `**NELFUND current status as of ${when}**

**${cycle}** — ${label}

${note}

_Source freshness: ${freshness}${data.verified ? ' · verified signals' : ''}._`

  if (extraSnippets && extraSnippets.length > 0) {
    body += `\n\n**From official pages (snippets):**\n`
    for (const s of extraSnippets.slice(0, 3)) {
      body += `• ${s}\n`
    }
  }

  body += `\nI will not invent a closing date. For the final word use ${PORTAL} and ${SITE}.`

  const sources =
    data.sources && data.sources.length > 0
      ? data.sources.map((s) => ({
          id: s.id,
          label: s.label,
          url: s.url,
          official: true,
        }))
      : [
          { id: 'site', label: 'NELFUND website', url: SITE, official: true },
          { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
        ]

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: data.confidence === 'high' ? 0.92 : data.confidence === 'low' ? 0.7 : 0.85,
    responseMode: 'conversation',
    problem: null,
    answer: body,
    whatThisMeans: null,
    nextActions: [PORTAL, SITE, FAQ],
    clarifyingQuestions: [],
    evidence: [],
    sources,
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
}

async function fetchOfficialSnippets(question: string): Promise<string[]> {
  try {
    if (typeof fetch === 'undefined') return []
    const res = await fetch('/api/knowledge/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: question || 'NELFUND application open deadline status' }),
    })
    if (!res.ok) return []
    const data = (await res.json().catch(() => null)) as {
      snippets?: string[]
      results?: Array<{ text?: string; snippet?: string }>
    } | null
    if (data?.snippets && Array.isArray(data.snippets)) return data.snippets.filter(Boolean)
    if (data?.results && Array.isArray(data.results)) {
      return data.results
        .map((r) => r.snippet || r.text || '')
        .filter((s) => s.length > 20)
        .slice(0, 3)
    }
  } catch {
    /* ignore */
  }
  return []
}

/**
 * Live current-information for the student AI.
 * Pulls dated status from /api/knowledge/status and optional official-page snippets.
 */
export async function buildCurrentInformationAnswerLive(
  userQuestion?: string,
): Promise<GroundedAnswer> {
  try {
    if (typeof fetch === 'undefined') return buildCurrentInformationAnswer()

    // Prefer same-day cached status; client may pass refresh via status endpoint
    const statusRes = await fetch('/api/knowledge/status?refresh=1', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const statusData = statusRes.ok
      ? ((await statusRes.json().catch(() => null)) as LiveStatus | null)
      : null

    const wantDeep =
      !userQuestion ||
      /open|deadline|window|news|announce|latest|today|current|status|when|date|2026|2027|still/i.test(
        userQuestion,
      )

    const snippets = wantDeep ? await fetchOfficialSnippets(userQuestion || 'NELFUND application status') : []

    if (statusData && (statusData.status_label || statusData.note)) {
      return answerFromLiveStatus(statusData, snippets)
    }

    if (snippets.length > 0) {
      const base = buildCurrentInformationAnswer()
      base.answer = `**From official NELFUND pages (as of ${todayWatLabel()})**\n\n${snippets
        .map((s) => `• ${s}`)
        .join('\n')}\n\nAlways re-check ${PORTAL} — pages can change the same day.`
      base.confidence = 0.8
      return base
    }
  } catch {
    /* fall through */
  }
  return buildCurrentInformationAnswer()
}

/** True when the student is asking for time-sensitive / dated NELFUND info */
export function questionNeedsCurrentLive(text: string): boolean {
  return /\b(is\s+(nelfund|it)\s+open|still\s+open|still\s+accept|deadline|closing\s+date|opening\s+date|when\s+(can|do|will|is)|application\s*(window|period|status)|latest\s+(update|news|status)|current\s+(status|information|update)|as\s+of\s+today|today|announce|any\s+update|news\s+about\s+nelfund|2026\s*\/?\s*2027)\b/i.test(
    text || '',
  )
}
