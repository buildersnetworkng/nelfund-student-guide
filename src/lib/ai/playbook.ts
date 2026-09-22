/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPendingExtras } from './playbookPendingExtras'
import { playbookHourly112 } from './playbookHourly112'
import { playbookHourly113 } from './playbookHourly113'
import { playbookHourly106 } from './playbookHourly106'
import { playbookHourly116 } from './playbookHourly116'
import { playbookHourly117 } from './playbookHourly117'
import { playbookHourly118 } from './playbookHourly118'
import { playbookHourly119 } from './playbookHourly119'
import { playbookHourly120 } from './playbookHourly120'
import { playbookHourly121 } from './playbookHourly121'
import { playbookHourly122 } from './playbookHourly122'
import { playbookHourly123 } from './playbookHourly123'
import { playbookHourly124 } from './playbookHourly124'

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
  if (/^(so\s*)?what\s*will\s*i\s*do(\s*now)?$/i.test(t)) return true
  if (/^wetin\s*i\s*go\s*do(\s*now)?$/i.test(t)) return true
  if (/^what\s*should\s*i\s*do\s*now$/i.test(t)) return true
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

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  if (ctx.userText) {
    const extra124 = playbookHourly124(intent, ctx.userText)
    if (extra124) return extra124
    const extra123 = playbookHourly123(intent, ctx.userText)
    if (extra123) return extra123
    const extra122 = playbookHourly122(intent, ctx.userText)
    if (extra122) return extra122
    const extra121 = playbookHourly121(intent, ctx.userText)
    if (extra121) return extra121
    const extra120 = playbookHourly120(intent, ctx.userText)
    if (extra120) return extra120
    const extra119 = playbookHourly119(intent, ctx.userText)
    if (extra119) return extra119
    const extra118 = playbookHourly118(intent, ctx.userText)
    if (extra118) return extra118
    const extra117 = playbookHourly117(intent, ctx.userText)
    if (extra117) return extra117
    const extra116 = playbookHourly116(intent, ctx.userText)
    if (extra116) return extra116
    const extra113 = playbookHourly113(intent, ctx.userText)
    if (extra113) return extra113
    const extra112 = playbookHourly112(intent, ctx.userText)
    if (extra112) return extra112
    const extra106 = playbookHourly106(intent, ctx.userText)
    if (extra106) return extra106
  }

  if (ctx.userText && isGreetingText(ctx.userText) && !(ctx.priorIntent && ctx.priorIntent !== 'unknown' && ctx.priorIntent !== 'official-sources'))
    return WELCOME

  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  if (intent === 'portal-login') {
    return `**Log in, do not create a new account** if that email was used before.\n\n1. Sign in at ${SITE} with the same email.\n2. Sign up only if you never created an account: ${PORTAL}\n3. Forgot password or OTP no dey come: use the reset on ${SITE}. Do not open a second account.\n4. Portal hang: refresh once, try another network, then ${ESUPPORT}.`
  }
  if (intent === 'nin-verification' || intent === 'nin-bvn') {
    return `**NIN / BVN must be yours and must match the name on JAMB.**\n\n1. Finish NIN and BVN in your name first.\n2. Do not type a parent or friend number.\n3. Retry ${PORTAL}. Still failing: campus desk, then ${ESUPPORT}.`
  }
  if (intent === 'official-sources') {
    if (ctx.priorIntent && ctx.priorIntent !== 'unknown' && ctx.priorIntent !== 'official-sources' && ctx.userText && isConversationalFollowUp(ctx.userText)) {
      return nextStepAdvance(ctx, ctx.priorIntent)
    }
    return WELCOME
  }
  if (intent === 'missing-information' || intent === 'school-not-found' || intent === 'institution-verification') {
    const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
    return `**Missing information / school not on the list**${inst}\n\nUsually the school has not finished uploading your record.\n\n1. Confirm you attend a public institution.\n2. Ask the campus NELFUND desk if your data is uploaded.\n3. Retry ${PORTAL}. Still failing: ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    const extra = ctx.userText ? playbookPendingExtras(ctx.userText) : null
    if (extra) return extra
    return `**How far / money never enter** means your file is still waiting. Do not open a second account.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the institution. No SMS does not mean declined.\n3. I will not invent a pay date. Same word for a long time: campus desk, then ${ESUPPORT}.`
  }
  if (intent === 'how-to-apply') {
    return `**How to apply**\n\n1. Confirm school listed and record uploaded.\n2. Create or sign in at ${PORTAL}.\n3. Complete profile (JAMB, NIN, BVN).\n4. Use Request for Student Loan only when the official loan window is open. I will not invent dates.`
  }
  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return `**Why NELFUND exists:** the Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in public tertiary institutions can get interest-free loans for school charges and living costs.\n\nInstitutional charges go to the school. Optional upkeep goes to the student. It is a loan, not a scholarship.\n\n${SITE} / ${PORTAL}`
  }
  if (intent === 'upkeep' || intent === 'upkeep-payment' || intent === 'upkeep-vs-fees') {
    return `**Upkeep** is living support, separate from school charges.\n\n1. Tick it in the same session as institutional charges when the loan window is open.\n2. It goes to the bank account on your profile.\n3. I will not invent a monthly figure or pay date. Confirm on ${PORTAL}.`
  }
  if (intent === 'repayment' || intent === 'gsi') {
    return `**Repayment** starts after the applicable NYSC or study period under official NELFUND rules.\n\n1. Confirm on ${SITE} and ${PORTAL}. I will not invent a start date, percentage, or jail term.\n2. Life-jail graphics are not official unless the same text is on ${SITE}.`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    return `**As of today:** account creation can be OPEN while the loan and upkeep window is not confirmed for this cycle.\n\n- Create account, finish profile: ${PORTAL}\n- Already registered last year: sign in at ${SITE}, do not open a new account\n\nDo not use social media for dates. I will not invent a deadline.`
  }
  if (intent === 'jamb-verification') {
    return `**Invalid JAMB / JAMB wahala**\n\n1. Type the JAMB number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not create a second account.`
  }
  if (intent === 'scam-safety') {
    return `**Safety**\n\n- Never pay an agent.\n- Never share OTP or password.\n- Apply only on ${PORTAL}\n- Tickets: ${ESUPPORT}`
  }
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support only**\n\n- Tickets: ${ESUPPORT}\n- Website: ${SITE}\n- Portal: ${PORTAL}\n\nI will not invent a WhatsApp group or agent number.`
  }
  if (intent === 'bank-information') {
    return `**Bank on the profile**\n\n1. Use a regular Nigerian bank account in your name.\n2. Name must match NIN / BVN.\n3. Fix it on ${PORTAL} while signed in.\n4. Still failing: ${ESUPPORT}`
  }
  if (intent === 'refund') {
    return `**You already paid school fees yourself.** Institutional charges from NELFUND go to the school, not your pocket. Ask the campus bursary / NELFUND desk. I will not invent a refund rule. Confirm on ${PORTAL}.`
  }
  if (intent === 'guarantor') {
    return `**Guarantor / surety:** follow only what ${PORTAL} and ${FAQ} ask for this cycle. I will not invent extra people you must attach.`
  }
  if (intent === 'documents-needed') {
    return `**Documents commonly asked on the portal**\n\n1. JAMB admission letter.\n2. Clear passport photo or school ID only if the form asks.\n3. NIN, BVN, and a bank account in your name.\n4. Upload on ${PORTAL}.`
  }
  if (ctx.userText && isConversationalFollowUp(ctx.userText) && ctx.priorIntent && ctx.priorIntent !== 'unknown') {
    return nextStepAdvance(ctx, ctx.priorIntent)
  }
  return null
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (isConversationalFollowUp(t)) return false
  if (/^(so\s+)?(what('?s|\s+is)?\s+)?(the\s+)?(solution|next|first\s*step)/i.test(t)) return false
  if (/wetin\s*(i\s*)?(go|to)\s*do|what\s*next|what'?s\s*next|wetin\s*next|so\s*wetin\s*now|make\s*i\s*do\s*wetin/i.test(t)) return false
  return /what\s*is\s*nelfund|how\s*to\s*apply|eligib|missing\s*information|upkeep|repay|login|jamb|scam|is\s*(nelfund|application)\s*open/i.test(t)
}
