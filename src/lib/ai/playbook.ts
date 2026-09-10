/**
 * NELFUND AI playbook — adaptive replies that match what the student asked.
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

const MENU = `Pick one:\n• Sign **up** (new account) — ${PORTAL}\n• Sign **in** / login — ${SITE}\n• Loan application (fees / upkeep)\n• Pending / under review status\n• Missing information / school not on list\n• Upkeep vs school fees / repayment\n• Support ticket — ${ESUPPORT}\n\nPidgin or English is fine. Official pages only: ${SITE}`

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string {
  const t = (ctx.userText || '').trim()

  if (intent === 'eligibility') return eligibilityAnswer({ userText: t })

  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp or Telegram “portal” links.\n\nIf you pasted a long error, say whether it is login, pending, JAMB, or missing school.`
  }

  if (intent === 'what-is-nelfund') {
    return `NELFUND is the Nigeria Education Loan Fund — **interest-free** loans for institutional charges and optional monthly upkeep for eligible students in **public** tertiary institutions.\n\nIt is a **loan**, not a scholarship. Repayment starts **2 years after NYSC** (10% of salary / profit). No guarantor.\n\n${MENU}`
  }

  if (intent === 'pending-application') {
    return `**Pending / under review** means NELFUND or your school is still checking your record. That is not a rejection.\n\nWhat to do:\n1. Open ${PORTAL} and note the exact status word (Pending, Under review, Approved, Declined).\n2. Confirm your school has uploaded your data.\n3. If it stays pending for a long time, open a ticket: ${ESUPPORT}\n\nPidgin: *e no dey move* usually still means verification — check the portal status word, then ticket if nothing changes.\n\nI cannot see your personal file. I will not invent an approval date.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile (no extra spaces or letters).\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. If the portal says *invalid JAMB number format*, fix the number and retry — do not create a second account.\n4. Still failing? Ticket: ${ESUPPORT} and keep a screenshot.\n\nPortal: ${PORTAL}`
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (!t) {
      return `Send a short line about what you need.\n\n${MENU}\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    if (t.length < 48 || /help|abeg|stuck|wahala|what\s*next|empty|wetin|una\s*fit|reply|are\s*you\s*there/i.test(t)) {
      return `${MENU}`
    }
    return `Live notices only from ${SITE} and ${PORTAL}. I will not invent a deadline or “still open until…” date.\n\nAccount sign-up and a loan application **window** are different. Confirm on the portal before you act.\n\nWhat are you trying to do — sign up, login, submit a loan, or check pending status?`
  }

  if (intent === 'upkeep') {
    return `**Upkeep** is the monthly living allowance. Official FAQ: you must apply for **both** institutional charges and upkeep at registration. Institutional-only applications do not later receive upkeep.\n\nUpkeep is paid to the student; school fees go to the institution. Amounts and timing are only confirmed on ${PORTAL} / ${SITE}.\n\nFAQ: ${FAQ}`
  }

  if (intent === 'school-fees') {
    return `**Institutional charges / school fees** are paid **to your school**, not into your personal account.\n\nUpkeep (if you applied for it) is separate and monthly to you.\n\nIf you already paid fees yourself, still apply if eligible — NELFUND does not replace that decision on this chat. Confirm live on ${PORTAL}. FAQ: ${FAQ}`
  }

  if (intent === 'repayment') {
    return `**Repayment (official FAQ):** due **2 years after NYSC**. Employers deduct **10% of salary**; self-employed remit 10% of monthly profit. You may pay earlier.\n\nNo job after that window: notify NELFUND with a sworn affidavit every 3 months.\n\nViral “life imprisonment for unpaid loans” claims are **not** official policy as stated on nelf.gov.ng FAQ. Default can bring penalties / credit damage — read the FAQ, do not trust WhatsApp posters.\n\nFAQ: ${FAQ}`
  }

  if (intent === 'gsi') {
    return `**GSI** (Global Standing Instruction) is a bank instruction some lenders use so repayments can be collected from your accounts when due.\n\nNELFUND repayment on the official FAQ is: 10% of salary at source after the NYSC + 2 years window, or 10% of profit if self-employed. Confirm any GSI checkbox **on the portal itself** before you tick it.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'loan-or-scholarship') {
    return `NELFUND is an **interest-free loan**, not a scholarship and not “free money”.\n\nYou repay after NYSC + 2 years (see FAQ). Institutional charges go to the school; upkeep (if selected) comes to you.\n\nFAQ: ${FAQ} · Apply: ${PORTAL}`
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    const school = ctx.institutionName ? ` You mentioned **${ctx.institutionName}**.` : ''
    return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND’s public-institution list.${school}\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school’s NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}\n\nPrivate institutions are not in the current public-institution scheme described on nelf.gov.ng.`
  }

  if (intent === 'how-to-apply') {
    return `**Apply**\n1. Create account: ${PORTAL}\n2. Complete profile (NIN, BVN, JAMB, admission / matric).\n3. Submit **institutional charges** and, if you need it, **upkeep** in the same session.\n4. Track status on the portal. Approval notice also appears in your profile (official FAQ).\n\nLogin for an existing account is ${SITE}, not the same as sign-up.`
  }

  if (intent === 'portal-login') {
    return `**Login / sign in:** ${SITE}\n**New account / apply:** ${PORTAL}\n\nForgot password — use the portal reset, do not create a second profile. Never send OTP to anyone.\nTicket if login keeps failing: ${ESUPPORT}`
  }

  if (intent === 'contact-support' || intent === 'email-draft') {
    return `Official support:\n• Ticket: ${ESUPPORT}\n• Site: ${SITE}\n• Portal: ${PORTAL}\n• FAQ: ${FAQ}\n\nSay your full name, school, JAMB number, and the exact portal error. Do not send BVN/NIN in random chats.`
  }

  if (intent === 'unknown' || !intent) {
    return t.length < 8
      ? `I am here for NELFUND.\n\n${MENU}`
      : `I mapped that as general help so you are not stuck.\n\n${MENU}\n\nPortal: ${PORTAL}`
  }

  return `${MENU}\n\nCheck live status on ${PORTAL}. Reply with the exact portal message or whether you mean **sign up**, **login**, **loan application**, **pending**, **school fees**, or **upkeep**.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|sign\s*up|portal|jamb|nin|scam|open|status|abeg|wahala|help|stuck|ticket|esupport|school|pending|password|error|fees/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (intent === 'pending-application') return `Next: open ${PORTAL} and tell me the exact status word (Pending, Under review, Approved).`
  if (intent === 'missing-information' || intent === 'school-not-found') return 'Which school do you attend? (e.g. UNILAG, LASU, OOU, YABATECH) — that lets me narrow the next step.'
  if (intent === 'how-to-apply') return 'Are you stuck on **sign up**, **profile**, or **submit loan**? Those are different steps.'
  if (intent === 'portal-login') return 'Still on login — wrong password, session expired, or blank page?'
  return 'What next — sign up, login, loan application, school fees, or upkeep?'
}
