/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPendingExtras } from './playbookPendingExtras'
import { playbookHourly53 } from './playbookHourly53'
import { playbookHourly54 } from './playbookHourly54'
import { playbookHourly55 } from './playbookHourly55'
import { playbookHourly56 } from './playbookHourly56'
import { playbookHourly57 } from './playbookHourly57'
import { playbookHourly58 } from './playbookHourly58'
import { playbookHourly59 } from './playbookHourly59'
import { playbookHourly60 } from './playbookHourly60'
import { playbookHourly61 } from './playbookHourly61'
import { playbookHourly62 } from './playbookHourly62'
import { playbookHourly63 } from './playbookHourly63'
import { playbookHourly64 } from './playbookHourly64'
import { playbookHourly65 } from './playbookHourly65'
import { playbookHourly66 } from './playbookHourly66'
import { playbookHourly67 } from './playbookHourly67'
import { playbookHourly68 } from './playbookHourly68'
import { playbookHourly69 } from './playbookHourly69'
import { playbookHourly70 } from './playbookHourly70'
import { playbookHourly71 } from './playbookHourly71'
import { playbookHourly72 } from './playbookHourly72'
import { playbookHourly73 } from './playbookHourly73'
import { playbookHourly74 } from './playbookHourly74'
import { playbookHourly75 } from './playbookHourly75'

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

function isGreetingText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (/nelfund|explain|eligib|\bapply\b|application|\bportal\b|missing|upkeep|repay|\bjamb\b|\bnin\b|\bbvn\b|\bloan\b|how\s*to|pending|login|sign\s*in/i.test(t)) return false
  return /^(hi|hii+|hello|hey|heyy+|yo|yoo+|sup|suh|wassup|whatsup|howdy|how\s*far|howfar|how\s*fa|wetin\s*dey|how\s*you\s*dey|good\s*(morning|afternoon|evening)|sharp|correct|i\s*dey|thanks|thank\s*you)(\s+\w+){0,2}$/i.test(t)
}

const WELCOME = `How far, welcome.\n\nI am here to help with **NELFUND**: applications, portal issues, eligibility, upkeep, repayment, and school-record problems.\n\nWhat do you need help with today?`
