/**
 * Current / time-sensitive NELFUND information.
 * Prefers live refresh from official sources (via /api/knowledge/status).
 * Falls back to verified static application-status data.
 * Does not invent announcements.
 */
import { applicationStatus, sources } from '../data'
import {
  fetchLiveApplicationStatus,
  formatChecked,
  type LiveApplicationStatus,
} from '../knowledge/client'
import type { AnswerSource } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

function fromLiveOrStatic(live: LiveApplicationStatus | null) {
  if (live) {
    return {
      cycle: live.cycle,
      status_label: live.status_label,
      note: live.note,
      lastChecked: formatChecked(live),
      freshness: live.freshness || 'live',
      verified: Boolean(live.verified),
    }
  }
  const status = applicationStatus
  return {
    cycle: status.cycle || 'current cycle',
    status_label: status.status_label || status.status || 'pending verification',
    note: status.note || '',
    lastChecked: status.last_checked || null,
    freshness: 'static_fallback' as const,
    verified: false,
  }
}

function buildPayload(live: LiveApplicationStatus | null): {
  answer: string
  whatThisMeans: string
  nextActions: string[]
  sources: AnswerSource[]
  lastChecked: string | null
} {
  const s = fromLiveOrStatic(live)
  const freshnessLine =
    s.freshness === 'live'
      ? 'Verified from official NELFUND pages in this check.'
      : s.freshness === 'cached'
        ? 'Recently verified from official NELFUND pages.'
        : 'Static guide data — confirm live on the official portal.'

  const answer = [
    `Here is the latest status this guide can confirm for NELFUND (${s.cycle}).`,
    `Last checked: ${s.lastChecked || 'date not recorded'}.`,
    freshnessLine,
    '',
    `Status summary: ${s.status_label}.`,
    '',
    s.note,
    '',
    'This guide does not invent live announcements or unofficial social media dates. For whether you can apply today, open the official portal and check nelf.gov.ng announcements.',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')

  const nextActions = [
    `Check official announcements: ${SITE}`,
    `Open the application portal: ${PORTAL}`,
    `Tracked support if needed: ${ESUPPORT}`,
    'Ignore unofficial social media dates unless confirmed on nelf.gov.ng or the portal.',
  ]

  const officialSources: AnswerSource[] = sources
    .filter((src) => src.official)
    .slice(0, 4)
    .map((src) => ({ id: src.id, label: src.label, url: src.url, official: src.official }))

  if (!officialSources.some((src) => src.url === PORTAL)) {
    officialSources.unshift({
      id: 'nelfund-portal-live',
      label: 'NELFUND application portal',
      url: PORTAL,
      official: true,
    })
  }
  if (!officialSources.some((src) => src.url === SITE)) {
    officialSources.unshift({
      id: 'nelfund-site-live',
      label: 'NELFUND official website',
      url: SITE,
      official: true,
    })
  }

  return {
    answer,
    whatThisMeans:
      'Current information can change quickly. Treat official NELFUND channels as authoritative over secondary guides or social posts.',
    nextActions,
    sources: officialSources,
    lastChecked: s.lastChecked,
  }
}

/** Sync using static JSON (offline / SSR-safe). Prefer buildCurrentInformationAnswerLive when possible. */
export function buildCurrentInformationAnswer(): {
  answer: string
  whatThisMeans: string
  nextActions: string[]
  sources: AnswerSource[]
  lastChecked: string | null
} {
  return buildPayload(null)
}

/** Live official refresh via knowledge API + Redis cache. */
export async function buildCurrentInformationAnswerLive(): Promise<{
  answer: string
  whatThisMeans: string
  nextActions: string[]
  sources: AnswerSource[]
  lastChecked: string | null
}> {
  let live: LiveApplicationStatus | null = null
  try {
    live = await fetchLiveApplicationStatus()
  } catch {
    live = null
  }
  return buildPayload(live)
}
