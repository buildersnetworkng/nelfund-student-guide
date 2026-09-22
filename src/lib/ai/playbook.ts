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
import { playbookHourly82 } from './playbookHourly82'
import { playbookHourly87 } from './playbookHourly87'
import { playbookHourly88 } from './playbookHourly88'
import { playbookHourly89 } from './playbookHourly89'
import { playbookHourly90 } from './playbookHourly90'
import { playbookHourly91 } from './playbookHourly91'
import { playbookHourly92 } from './playbookHourly92'
import { playbookHourly93 } from './playbookHourly93'
import { playbookHourly94 } from './playbookHourly94'
import { playbookHourly95 } from './playbookHourly95'
import { playbookHourly96 } from './playbookHourly96'
import { playbookHourly97 } from './playbookHourly97'
import { playbookHourly98 } from './playbookHourly98'
import { playbookHourly104 } from './playbookHourly104'
import { playbookHourly112 } from './playbookHourly112'
import { playbookHourly106 } from './playbookHourly106'

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

export function isConversationalFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!?.]+$/g, '').trim()
  if (!t || t.length > 120) return false
  if (/^(yes|yeah|yep|ok|okay|sure|please|continue|more|thanks|thank\s*you|abeg|alright|all\s*right|correct|true|go\s*on)\.?$/i.test(t)) return true
  if (/^(alright|okay|ok|so|and|then|now|please|abeg)?\s*(so\s+)?(what|wetin|how|where)\b/i.test(t) && /(next|do|solution|first\s*step|first\s*thing|should\s*i|will\s*i|i\s*go\s*do|wattin|wetin)/i.test(t)) return true
  if (/what\s*(should|will|can)\s*i\s*(do|take)|what'?s\s*(the\s*)?(next|solution|first)|what\s*next|so\s*what|wetin\s*(i\s*)?(go|to)\s*do|wattin\s*i\s*go\s*do|first\s*(step|thing)|wetin\s*next|so\s*wetin\s*now|make\s*i\s*do\s*wetin|first\s*thing\s*i\s*go\s*do|so\s*what\s*will\s*i\s*do|what\s*should\s*i\s*do\s*now|wetin\s*i\s*go\s*do\s*now/i.test(t)) return true
  if (t.length < 40 && /^(and|then|also|but|so)\b/i.test(t)) return true
  if (/^(so\s*)?(what|wetin)\s*(will|go)\s*i\s*do(\s*now)?$/i.test(t)) return true
  if (/^(what'?s|wetin)\s*next$/i.test(t)) return true
  if (/^first\s*step$/i.test(t)) return true
  return false
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
  if (intent === 'missing-information' || intent === 'school-not-found' || intent === 'institution-verification') {
    return `**First step right now**${inst}\n\n1. Ask ICT / Registry / NELFUND desk to confirm your record is uploaded\n2. Retry ${PORTAL}\n3. Still failing after school confirms -> ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    return `**First step for how far / pending**\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your file from this chat.\n2. School charges go to the school. No SMS does not mean declined.\n3. Still the same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }
  return `**Next step**\n\n1. Open ${PORTAL} and act on the exact status or error you see\n2. If the portal asks for school confirmation, use your campus NELFUND desk\n3. Still stuck after that -> ${ESUPPORT}\n\n${PORTAL}`
}
