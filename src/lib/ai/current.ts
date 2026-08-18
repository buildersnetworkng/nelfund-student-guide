/**
 * Current NELFUND application-status answers from curated + optional live status data.
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
    `**NELFUND status (guide snapshot for ${s.cycle})**`,
    `Last checked: ${s.lastChecked || 'date not recorded'}. ${freshnessLine}`,
    '',
    `Summary: ${s.status_label}.`,
    '',
    s.note,
    '',
    '**Do not mix these up:**',
    '• Account creation on the portal ≠ loan application still open',
    '• A closed session notice (past end date) ≠ “you cannot create an account”',
    '• Social media dates are not official until on nelf.gov.ng or the portal',
    '',
    `Confirm live: ${SITE} and ${PORTAL}`,
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

  if (!officialSources.length) {
    officialSources.push(
      { id: 'nelf-site', label: 'NELFUND official site', url: SITE, official: true },
      { id: 'nelf-portal', label: 'NELFUND portal', url: PORTAL, official: true },
    )
  }

  return {
    answer,
    whatThisMeans:
      'Account setup and loan-application windows are different. Only official pages define whether applications are open today.',
    nextActions,
    sources: officialSources,
    lastChecked: s.lastChecked,
  }
}

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
