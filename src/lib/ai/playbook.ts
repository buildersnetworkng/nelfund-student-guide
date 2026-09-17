/**
 * NELFUND AI answer playbook
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

function isGreetingText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (/nelfund|explain|eligib|\bapply\b|application|\bportal\b|missing|upkeep|repay|\bjamb\b|\bnin\b|\bbvn\b|\bloan\b|how\s*to|pending|login|sign\s*in/i.test(t)) return false
  return /^(hi|hii+|hello|hey|heyy+|yo|yoo+|sup|suh|wassup|whatsup|howdy|how\s*far|howfar|how\s*fa|wetin\s*dey|how\s*you\s*dey|good\s*(morning|afternoon|evening)|sharp|correct|i\s*dey|thanks|thank\s*you)(\s+\w+){0,2}$/i.test(t)
}

const WELCOME = `How far — welcome.\n\nI am here to help with **NELFUND**: applications, portal issues, eligibility, upkeep, repayment, and school-record problems.\n\nWhat do you need help with today?`

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  if (ctx.userText && isGreetingText(ctx.userText)) return WELCOME

  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  if (intent === 'portal-login') {
    return `**Log in / sign in**\n\nUse: ${SITE}\n\n**Sign up** (create account / apply):\n${PORTAL}\n\nSupport: ${ESUPPORT}`
  }
  if (intent === 'official-sources') {
    if (ctx.userText && /portal|link|website|sign\s*(in|up)|login|official|url/i.test(ctx.userText)) {
      return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application.`
    }
    return WELCOME
  }
  if (intent === 'missing-information' || intent === 'school-not-found') {
    const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
    return `**Missing information / school not on the list**${inst}\n\nUsually the school has not finished uploading your record, or the name does not match NELFUND's public-institution list.\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school\n2. Ask your school's NELFUND desk whether your data is uploaded\n3. Retry ${PORTAL}. Still failing → ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    return `**Approval status**\n\nOnly ${PORTAL} shows your true status. Pending is not automatic rejection. For long delays, ask the school desk and ${ESUPPORT}.`
  }
  if (intent === 'how-to-apply') {
    return `**How to apply**\n\n1. Confirm school listed and record uploaded\n2. Create / sign in at ${PORTAL}\n3. Complete profile (JAMB, NIN, BVN required to finish)\n4. Submit when the loan window is open (${SITE})`
  }
  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return `**NELFUND** is the Nigerian Education Loan Fund — interest-free loans for eligible students in public tertiary institutions (institutional charges + upkeep when approved). It is a loan you repay, not a grant.\n\n${SITE} · ${PORTAL}`
  }
  if (intent === 'upkeep') {
    return `**Upkeep**\n\nLiving support separate from school charges. Guide figure ~₦20,000/month when approved. Apply for both institutional + upkeep when the window is open.\n\n${PORTAL}`
  }
  if (intent === 'repayment' || intent === 'gsi') {
    return `**Repayment**\n\nGenerally starts after the applicable NYSC / study period under NELFUND rules. Confirm on ${SITE} and ${PORTAL}.`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    return `**Is the NELFUND loan application open?**\n\n• Account creation: portal may be open — you still need NIN, BVN, JAMB to finish registration\n• 2026/2027 loan + upkeep window: confirm only on ${SITE} / ${PORTAL}\n\nI will not invent dates.`
  }
  if (intent === 'jamb-verification') {
    return `**JAMB issues**\n\n• Re-check every digit\n• Name / DOB must match JAMB and NIN\n• Still failing → school desk, then ${ESUPPORT}`
  }
  if (intent === 'scam-safety') {
    return `**Safety**\n\n• Never pay an agent\n• Never share OTP or password\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
  }
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support**\n\n• Tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}`
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
