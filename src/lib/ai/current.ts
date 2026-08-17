/**
 * Current / time-sensitive NELFUND information.
 * Uses verified application-status data + official links.
 * Does not invent announcements. Encourages live official checks.
 */
import { applicationStatus, sources } from '../data'
import type { AnswerSource } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function buildCurrentInformationAnswer(): {
  answer: string
  whatThisMeans: string
  nextActions: string[]
  sources: AnswerSource[]
  lastChecked: string | null
} {
  const status = applicationStatus
  const lastChecked = status.last_checked || null
  const cycle = status.cycle || 'current cycle'
  const label = status.status_label || status.status || 'pending verification'
  const note = status.note || ''

  const answer = [
    `Here is what this guide has on file for current NELFUND status (${cycle}).`,
    `Last checked: ${lastChecked || 'date not recorded'}.`,
    '',
    `Status summary: ${label}.`,
    '',
    note,
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
    .filter((s) => s.official)
    .slice(0, 4)
    .map((s) => ({ id: s.id, label: s.label, url: s.url, official: s.official }))

  if (!officialSources.some((s) => s.url === PORTAL)) {
    officialSources.unshift({
      id: 'nelfund-portal-live',
      label: 'NELFUND application portal',
      url: PORTAL,
      official: true,
    })
  }
  if (!officialSources.some((s) => s.url === SITE)) {
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
    lastChecked,
  }
}
