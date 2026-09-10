/**
 * NELFUND AI answer playbook — verified reply clusters for student goals.
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

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  const site = `Portal: ${PORTAL}\nWebsite: ${SITE}\nFAQ: ${FAQ}\nSupport: ${ESUPPORT}`
  if (intent === 'what-is-nelfund' || intent === 'nelfund-history' || intent === 'nelfund-purpose') {
    return `**NELFUND** is the Nigerian Education Loan Fund.\nInterest-free loans for eligible students in public Nigerian tertiary institutions: institutional charges to the school, and upkeep to the student when approved. It is a loan you repay, not a grant.\n\n${site}`
  }
  if (intent === 'how-to-apply') {
    return `**How to apply**\n1. Confirm school uploaded your record\n2. Sign in / sign up at ${PORTAL}\n3. Complete JAMB, NIN, bank details\n4. Submit when the official window is open\nLoan is applied for every academic session.\nEnglish or Pidgin is fine — say if you are stuck on account creation.\n\n${site}`
  }
  if (intent === 'upkeep') {
    return `**Upkeep**\nOfficial FAQ: apply for both institutional loan and upkeep at registration or you will not get upkeep.\nGuide figure often cited is N20,000/month unless nelf.gov.ng changes it. Paid only after approval.\n\n${site}`
  }
  if (intent === 'missing-information' || intent === 'school-not-found') {
    return `**Missing info / school not showing**\nAsk campus ICT / Registry / NELFUND desk to confirm upload, then retry ${PORTAL}. Still failing → ${ESUPPORT}. Name your school (UNILAG, LASU, OOU, YABATECH, …) for a tighter next step.\n\n${site}`
  }
  if (intent === 'portal-login' || intent === 'official-sources') {
    return `**Official access**\nSign in: ${SITE}\nSign up / apply: ${PORTAL}\nIf you see invalid login, session expired, or a pasted error, retry the official pages only. Never share OTP. Avoid random social links.\n\n${site}`
  }
  if (intent === 'jamb-verification') {
    return `**JAMB issues**\nRecheck every digit. Name/DOB should match JAMB and NIN. Direct Entry students need a JAMB number (official FAQ). Then school desk or ${ESUPPORT}.`
  }
  if (intent === 'nin-verification' || intent === 'bank-information' || intent === 'profile-update') {
    return `**NIN / bank / profile**\nMatch official slip and bank records. Use an account in your own name. Fix mismatches through proper channels, not agents. ${PORTAL} · ${ESUPPORT}`
  }
  if (intent === 'scam-safety') {
    return `**Safety**\nNo payment is required before disbursement (official FAQ). Never pay an agent or share OTP. Apply only on ${PORTAL}. Tickets: ${ESUPPORT}`
  }
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support**\n${site}\nSchool-record issues start with campus ICT / Registry / NELFUND desk.\nPortal error dumps: copy the exact message into a ticket at ${ESUPPORT}.`
  }
  if (intent === 'pending-application' || intent === 'institution-verification') {
    return `**Pending / under review**\nOnly ${PORTAL} shows true status. Pending is not automatic rejection. Official FAQ: disbursement within 30 days of approval (clock starts after approval). Long delay after approval → school desk + ${ESUPPORT}.`
  }
  if (intent === 'repayment' || intent === 'gsi' || intent === 'loan-or-scholarship') {
    return `**Repayment / GSI / loan vs scholarship**\nNELFUND is an interest-free loan, not a scholarship.\nOfficial FAQ: due 2 years after NYSC; 10% of salary or monthly profit; affidavit every 3 months if still unemployed after that.\nNELFUND labelled viral life-imprisonment claims as fake news. Confirm only on ${SITE} and ${FAQ}.`
  }
  if (intent === 'school-fees') {
    return `**Institutional charges**\nAmount follows each school. Paid to the institution, not the student. Zero interest. No payment required before disbursement.\n${site}`
  }
  if (intent === 'documents-needed' || intent === 'guarantor' || intent === 'reapplication' || intent === 'readiness') {
    return `**Docs / guarantor / reapply**\nOfficial FAQ: no guarantor. Apply each academic session. Common details: institution, admission number, JAMB, DOB, NIN, BVN; scanned admission letter for new students.\n${site}`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    return `**Is NELFUND open right now?**\nWindows change by cycle. I will not invent a closing date. Check ${SITE} and ${PORTAL} only.\nIf you only said help / abeg / stuck, start here, then tell me apply, pending, login, or missing info.\n${FAQ}`
  }
  if (intent === 'refund' || intent === 'email-draft') {
    return `**Fees already paid / draft email**\nAsk school bursary about refund or reconciliation. Institutional charges go to the school when approved. Say your school name and I can draft the campus email.\n${ESUPPORT}`
  }
  return `**I can help with NELFUND**\nEnglish or Pidgin is fine. Say one of these, or paste the portal screen text:\n- How to apply / create account / login\n- Missing information or school not showing\n- I don apply — pending or under review\n- JAMB / NIN / BVN / password error\n- Upkeep or repayment\n- Official links or a school email\n\n${site}\nI only follow official NELFUND guidance — not WhatsApp agents.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|portal|jamb|nin|scam|open|status|abeg|wahala|help|stuck|ticket|esupport|school|pending|password|error/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (ctx.institutionName) {
    return `Next for **${ctx.institutionName}**: confirm ICT/Registry uploaded your record, then retry ${PORTAL}. If it still fails, open ${ESUPPORT}.`
  }
  return `What next — apply, missing information, upkeep, contacts, or a draft email?\n${PORTAL} · ${ESUPPORT}`
}
