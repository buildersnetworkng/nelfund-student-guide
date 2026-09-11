/**
 * NELFUND AI playbook, adaptive replies that match what the student asked.
 * Clear distinctions: sign-up vs login vs loan application; school fees vs upkeep.
 * Never returns empty/null for residual or unknown intents.
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

const MENU = `Pick one:\n• Sign **up** (new account): ${PORTAL}\n• Sign **in** / login: ${SITE}\n• Loan application (fees / upkeep)\n• Pending / under review status\n• Missing information / school not on list\n• Upkeep vs school fees / repayment\n• Support ticket: ${ESUPPORT}\n\nPidgin or English is fine. Official pages only: ${SITE}`

function isFeesUpkeepContrast(t: string): boolean {
  return /\bupkeep\b|monthly\s*allowance|stipend/.test(t) && /school\s*fees|institutional\s*charges|tuition|school\s*money/.test(t)
}

function feesVsUpkeepAnswer(): string {
  return `**School fees vs upkeep** (two different things)\n\n• **Institutional charges / school fees:** paid **to your school**, not your personal account.\n• **Upkeep:** monthly living allowance paid **to you**, if you applied for it.\n\nOfficial FAQ: apply for **both** at registration. An institutional-only application does not later get upkeep.\n\nAmounts and pay dates only on ${PORTAL} / ${SITE}. FAQ: ${FAQ}`
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string {
  const t = (ctx.userText || '').trim()

  if (intent === 'eligibility') return eligibilityAnswer({ userText: t })

  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp or Telegram portal links.\n\nIf you pasted a long error, say whether it is login, pending, JAMB, or missing school.`
  }

  if (intent === 'what-is-nelfund') {
    return `**Why NELFUND was created:** to remove financial barriers so eligible students in **public** tertiary institutions can access higher education without paying school charges upfront.\n\n**What it is:** the Nigeria Education Loan Fund: **interest-free** loans for **institutional charges** (paid to the school) and optional **monthly upkeep** (paid to the student).\n\nIt is a **loan**, not a scholarship. Repayment starts **2 years after NYSC** (10% of salary / profit), as described on nelf.gov.ng.\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'pending-application') {
    return `**Pending / under review / money never enter** is not a rejection.\n\nWhat to do:\n1. Open ${PORTAL} and note the exact status word (Pending, Under review, Approved, Declined).\n2. Confirm your school has uploaded your data.\n3. School-level upkeep can lag after NELFUND pays the institution, check the portal first, then your school NELFUND desk.\n4. If it stays pending a long time, ticket: ${ESUPPORT}\n\nPidgin: *e no dey move* / *una never see upkeep* still means verify the portal word, then ticket. I cannot see your personal file and I will not invent a pay date.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile (no extra spaces or letters).\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. If the portal says *invalid JAMB number format*, fix the number and retry, do not create a second account.\n4. Still failing? Ticket: ${ESUPPORT} and keep a screenshot.\n\nPortal: ${PORTAL}`
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/why\s+(was|is|dem|they)|purpose|wetin\s*be|what\s*is\s*(this\s+)?nelfund/i.test(t)) {
      return playbookAnswer('what-is-nelfund', ctx)
    }
    if (!t) {
      return `Empty message received, I can still help.\n\n${MENU}\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    if (t.length < 64 || /help|abeg|stuck|wahala|what\s*next|empty|wetin|una\s*fit|reply|are\s*you\s*there|this\s*thing|i\s*no\s*sabi|confused|pls+|please/i.test(t)) {
      return `I can still help even if the question is short or mixed (Pidgin is fine).\n\n${MENU}\n\nIf you pasted a portal error, say **login**, **pending**, **JAMB**, or **missing school**. I will not invent NELFUND policy or dates.`
    }
    return `For **live** open/closed and dates, use the home status card and ${PORTAL}.\n\nI only report what official pages support. I will not invent a closing date.\n\n${MENU}`
  }

  if (intent === 'upkeep' || intent === 'school-fees') {
    if (isFeesUpkeepContrast(t)) return feesVsUpkeepAnswer()
  }

  if (intent === 'upkeep') {
    return `**Upkeep** is the monthly living allowance paid **to you** if you applied for it.\n\nIt is separate from school fees (paid to the school). Official FAQ: apply for institutional charges and upkeep in the same registration session.\n\nAmounts and payment dates only on ${PORTAL}. FAQ: ${FAQ}`
  }

  if (intent === 'school-fees') {
    return `**Institutional charges / school fees** go **to your school**, not your personal account.\n\nUpkeep is different: monthly to you.\n\nIf you already paid fees yourself, still apply if eligible, NELFUND does not replace that decision on this chat. Confirm live on ${PORTAL}. FAQ: ${FAQ}`
  }

  if (intent === 'repayment') {
    return `**Repayment (official FAQ):** due **2 years after NYSC**. Employers deduct **10% of salary**; self-employed remit 10% of monthly profit. You may pay earlier.\n\nNo job after that window: notify NELFUND with a sworn affidavit every 3 months.\n\nViral life-imprisonment claims for unpaid loans are **not** official policy as stated on nelf.gov.ng FAQ. Default can bring penalties / credit damage, read the FAQ, do not trust WhatsApp posters.\n\nFAQ: ${FAQ}`
  }

  if (intent === 'gsi') {
    return `**GSI** (Global Standing Instruction) is a bank instruction some lenders use so repayments can be collected from your accounts when due.\n\nNELFUND repayment on the official FAQ is: 10% of salary at source after the NYSC + 2 years window, or 10% of profit if self-employed. Confirm any GSI checkbox **on the portal itself** before you tick it.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'loan-or-scholarship') {
    return `NELFUND is an **interest-free loan**, not a scholarship and not free money.\n\nYou repay after NYSC + 2 years (see FAQ). Institutional charges go to the school; upkeep (if selected) comes to you.\n\nFAQ: ${FAQ} · Apply: ${PORTAL}`
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    const school = ctx.institutionName ? ` You mentioned **${ctx.institutionName}**.` : ''
    return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND's public-institution list.${school}\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}\n\nPrivate institutions are not in the current public-institution scheme described on nelf.gov.ng.`
  }

  if (intent === 'how-to-apply') {
    return `**Apply**\n1. Create account: ${PORTAL}\n2. Complete profile (NIN, BVN, JAMB, admission / matric).\n3. Submit **institutional charges** and, if you need it, **upkeep** in the same session.\n4. Track status on the portal. Approval notice also appears in your profile (official FAQ).\n\nLogin for an existing account is ${SITE}, not the same as sign-up.`
  }

  if (intent === 'portal-login') {
    return `**Login / sign in:** ${SITE}\n**New account / apply:** ${PORTAL}\n\nThose are different pages. Sign up creates the account; login opens an existing one; submitting a loan is a later step after profile.\n\nForgot password, use the portal reset, do not create a second profile. Never send OTP to anyone.\nTicket if login keeps failing: ${ESUPPORT}`
  }

  if (intent === 'scam-safety') {
    return `**Scam warning:** NELFUND does **not** collect application fees through WhatsApp, Telegram, or random agents.\n\n• Only use ${SITE} and ${PORTAL}\n• Never send OTP, BVN, or NIN to private numbers\n• Support ticket: ${ESUPPORT}\n\nIf someone asked you to pay to process a loan, stop and use the official portal only.`
  }

  if (intent === 'documents-needed') {
    return `**Typical portal profile items** (confirm live on the portal):\n• NIN and BVN\n• JAMB registration number\n• Admission / matric details\n• Bank account for upkeep if you apply for it.\n\nExact document list can change, use ${PORTAL} and FAQ: ${FAQ}. Do not email BVN/NIN to strangers.`
  }

  if (intent === 'contact-support' || intent === 'email-draft') {
    return `Official support:\n• Ticket: ${ESUPPORT}\n• Site: ${SITE}\n• Portal: ${PORTAL}\n• FAQ: ${FAQ}\n\nSay your full name, school, JAMB number, and the exact portal error. Do not send BVN/NIN in random chats.`
  }

  if (intent === 'unknown' || !intent) {
    return `I am here for NELFUND, pick a lane so I answer the right thing:\n\n${MENU}\n\nPortal: ${PORTAL} · Ticket: ${ESUPPORT}`
  }

  return `${MENU}\n\nCheck live status on ${PORTAL}. Reply with the exact portal message or whether you mean **sign up**, **login**, **loan application**, **pending**, **school fees**, or **upkeep**.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.toLowerCase().replace(/\s+/g, ' ').slice(0, 180)
  const b = next.toLowerCase().replace(/\s+/g, ' ').slice(0, 180)
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /\b(new\s*question|different\s*issue|another\s*problem|something\s*else)\b/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (intent === 'pending-application') return `Next: open ${PORTAL} and tell me the exact status word (Pending, Under review, Approved).`
  if (intent === 'missing-information' || intent === 'school-not-found') return 'Which school do you attend? (e.g. UNILAG, LASU, OOU, YABATECH), that lets me narrow the next step.'
  if (intent === 'how-to-apply') return 'Are you stuck on **sign up**, **profile**, or **submit loan**? Those are different steps.'
  if (intent === 'portal-login') return 'Still on login, wrong password, session expired, or blank page?'
  return `Portal: ${PORTAL} · Ticket: ${ESUPPORT}`
}
