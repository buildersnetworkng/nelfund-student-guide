/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPendingExtras } from './playbookPendingExtras'

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

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  if (ctx.userText && isGreetingText(ctx.userText)) return WELCOME

  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  if (intent === 'portal-login') {
    return `**Log in, do not create a new account** if that email was used before.\n\n1. Sign **in** at ${SITE} with the same email.\n2. Sign **up** only if you never created an account: ${PORTAL}\n3. Forgot password or OTP no dey come: use the reset on ${SITE}. Do not open a second account.\n4. Still locked: ticket ${ESUPPORT}.`
  }
  if (intent === 'official-sources') {
    if (ctx.userText && /portal|link|website|sign\s*(in|up)|login|official|url/i.test(ctx.userText)) {
      return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in is not the same as sign up, and that is not the same as the loan window.`
    }
    return WELCOME
  }
  if (intent === 'missing-information' || intent === 'school-not-found') {
    const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
    return `**Missing information / school not on the list**${inst}\n\nUsually the school has not finished uploading your record, or the name does not match NELFUND public-institution list.\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry ${PORTAL}. Still failing: ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    const extra = ctx.userText ? playbookPendingExtras(ctx.userText) : null
    if (extra) return extra
    return `**Pending / money never enter** is a wait, not a new apply.\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your file from this chat.\n2. Institutional charges go to the **school**. No personal alert does not mean declined.\n3. Upkeep only if you ticked it in the same session, and it can land later.\n4. I will not invent a pay date. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
  }
  if (intent === 'how-to-apply') {
    return `**How to apply**\n\n1. Confirm school listed and record uploaded.\n2. Create or sign in at ${PORTAL}.\n3. Complete profile (JAMB, NIN, BVN).\n4. Use Request for Student Loan only when the official loan window is open. Confirm on ${SITE} / ${PORTAL}. I will not invent dates.`
  }
  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return `**Why NELFUND exists:** the Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary institutions can get **interest-free** loans for school charges and living costs.\n\nInstitutional charges go to the **school**. Optional monthly upkeep goes to the **student**. It is a loan, not a scholarship.\n\n${SITE} · ${PORTAL}`
  }
  if (intent === 'upkeep') {
    return `**Upkeep** is living support, separate from school charges.\n\n1. Tick it in the **same** session as institutional charges when the loan window is open.\n2. It goes to the bank account on your profile, not a wallet-only account.\n3. I will not invent a monthly figure or pay date. Confirm on ${PORTAL}.`
  }
  if (intent === 'repayment' || intent === 'gsi') {
    return `**Repayment** generally starts after the applicable NYSC / study period under official NELFUND rules. Confirm on ${SITE} and ${PORTAL}. I will not invent a start date or percentage here.`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    return `**As of the live knowledge check:** account creation can be open while the **loan / upkeep window is not confirmed** for 2026/2027.\n\n• Sign up / profile / BVN: ${PORTAL}\n• Sign in: ${SITE}\n\nDo not use social media for opening or closing dates. I will not invent a deadline.`
  }
  if (intent === 'jamb-verification') {
    return `**Invalid JAMB / JAMB wahala**\n\n1. Type the JAMB number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still uses a JAMB registration, not a made-up number.\n4. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not create a second account.`
  }
  if (intent === 'scam-safety') {
    return `**Safety**\n\n• Never pay an agent.\n• Never share OTP or password.\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
  }
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support**\n\n• Tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}`
  }
  if (intent === 'bank-information') {
    return `**Bank on the profile**\n\n1. Use a regular Nigerian bank account in your name, not only a wallet if the portal rejects it.\n2. Name must match NIN / BVN.\n3. Fix it on ${PORTAL} while signed in. Do not open a second account.\n4. Still failing: ${ESUPPORT}`
  }
  if (intent === 'refund') {
    return `**You already paid school fees yourself.** Institutional charges from NELFUND go to the **school**, not your pocket. Ask the campus bursary / NELFUND desk about any refund process. I will not invent a refund rule. Confirm status on ${PORTAL}.`
  }
  if (intent === 'guarantor') {
    return `**Guarantor / surety:** follow only what ${PORTAL} and ${FAQ} ask for this cycle. I will not invent extra people you must attach. If the form has no guarantor field, do not pay anyone to stand for you.`
  }
  if (intent === 'documents-needed') {
    return `**Documents commonly asked on the portal**\n\n1. JAMB admission letter (usually required).\n2. School ID or invoice only if the form asks.\n3. NIN, BVN, and a bank account in your name.\n4. Upload JPEG or PDF on ${PORTAL}. Confirm the live form, do not invent extra papers.`
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
  if (/^(so\s+)?(what('?s|\s+is)?\s+)?(the\s+)?(solution|next|first\s*step)/i.test(t)) return false
  if (/wetin\s*(i\s*)?(go|to)\s*do|what\s*next|what'?s\s*next/i.test(t)) return false
  return /what\s*is\s*nelfund|how\s*to\s*apply|eligib|missing\s*information|upkeep|repay|login|jamb|scam|is\s*(nelfund|application)\s*open/i.test(t)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
  if (intent === 'missing-information' || intent === 'school-not-found' || intent === 'institution-verification') {
    return `**First step right now**${inst}\n\n1. Ask ICT / Registry / NELFUND desk to confirm your record is uploaded\n2. Retry ${PORTAL}\n3. Still failing after school confirms → ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    return `**First step**\n\n1. Open ${PORTAL} and note the exact status word\n2. If pending a long time, ask school desk about institutional verification\n3. Still stuck → ${ESUPPORT}`
  }
  return `**Next step**\n\nReply with what the portal shows, or what you are trying to do.\n\n${PORTAL} · ${ESUPPORT}`
}
