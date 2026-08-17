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
    `Here is the current status this guide has on file for the ${cycle} cycle (last checked: ${lastChecked || 'date not recorded'}).`,
    '',
    `Status: ${label}.`,
    note,
    '',
    'This guide does not invent live announcements. For anything time-sensitive (whether applications are open, new deadlines, or fresh policy changes), confirm directly on the official NELFUND website and portal today.',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')

  const nextActions = [
    `Check official announcements on ${SITE}`,
    `Open the application portal: ${PORTAL}`,
    `If you need tracked support: ${ESUPPORT}`,
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

  return {
    answer,
    whatThisMeans:
      'Current information can change quickly. Treat official NELFUND channels as authoritative over secondary guides or social posts.',
    nextActions,
    sources: officialSources,
    lastChecked,
  }
}
