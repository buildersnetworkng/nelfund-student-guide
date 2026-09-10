/**
 * NELFUND AI answer playbook — verified reply clusters for student goals.
 * FG hardened: history, eligibility, Pidgin, school-not-found, YouTube, safety.
 * Always returns an answer — never null silence for residual / unknown intents.
 */

import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string
  userText?: string
  priorIntent?: IntentId | null
}

const YOUTUBE: Record<string, string> = {
  apply: 'https://www.youtube.com/results?search_query=NELFUND+how+to+apply',
  missing: 'https://www.youtube.com/results?search_query=NELFUND+missing+information',
  upkeep: 'https://www.youtube.com/results?search_query=NELFUND+upkeep',
  whatis: 'https://www.youtube.com/results?search_query=what+is+NELFUND',
}

function videoLinksFor(key: string): string {
  const url = YOUTUBE[key]
  return url ? `\n\nRelated videos: ${url}` : ''
}
