/**
 * NELFUND AI playbook — adaptive replies that match what the student asked.
 * Clear distinctions: sign-up vs login vs loan application; school fees vs upkeep.
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

function schoolLabel(ctx: PlaybookContext): string {
  return ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
}

function askSchool(): string {
  return 'Which school do you attend? (e.g. UNILAG, LASU, OOU, YABATECH) — that lets me narrow the next step.'
}

function isShortAsk(text: string): boolean {
  const t = (text || '').trim()
  return t.length > 0 && t.length < 48
}

function wantsLinks(text: string): boolean {
  return /link|website|portal|url|site|where\s*(do\s*i|to)\s*(go|apply)|official/i.test(text || '')
}

function linkLine(kind: 'portal' | 'support' | 'site' | 'faq' | 'both'): string {
  if (kind === 'portal') return `Portal: ${PORTAL}`
  if (kind === 'support') return `Support ticket: ${ESUPPORT}`
  if (kind === 'site') return `Official site: ${SITE}`
  if (kind === 'faq') return `FAQ: ${FAQ}`
  return `Portal: ${PORTAL} · Support: ${ESUPPORT}`
}

function acknowledge(ctx: PlaybookContext, fallback: string): string {
  const t = (ctx.userText || '').toLowerCase()
  if (/abeg|please|help|stuck|wahala|e\s*no\s*dey|how\s*far/.test(t)) {
    return "I hear you — let's sort this."
  }
  if (/error|invalid|fail|not\s*work|can'?t|cannot/.test(t)) {
    return 'That error is common on the portal — here is the practical fix.'
  }
  if (/pending|under\s*review|still\s*waiting/.test(t)) {
    return 'Pending is stressful, but it is not the same as rejected.'
  }
  if (ctx.exactError) {
    return `About the message **“${ctx.exactError.slice(0, 80)}”**:`
  }
  return fallback
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const t = (ctx.userText || '').trim()
  const short = isShortAsk(t)
  const school = schoolLabel(ctx)
  const inst = ctx.institutionName

  if (intent === 'eligibility') {
    return eligibilityAnswer({ userText: t })
  }

  if (intent === 'what-is-nelfund' || intent === 'nelfund-history' || intent === 'nelfund-purpose') {
    if (/when|who\s*establish|history|act\s*,?\s*2023|created/i.test(t)) {
      return `NELFUND was created under the **Student Loans (Access to Higher Education) Act, 2023**. It is run by the Nigerian Education Loan Fund for eligible students in **public** tertiary institutions.\n\nIt is an **interest-free loan you repay**, not a grant.\n\n${linkLine('site')}`
    }
    if (/purpose|why|wetin.*for|what.*for/i.test(t)) {
      return `Purpose: remove money as a barrier to higher education.\n\nIt can cover two **different** things:\n1. **Institutional charges (school fees)** — paid **to the school**\n2. **Upkeep** — living support paid **to you** when approved\n\nYou repay after study under the Act’s rules — not free money.\n\n${linkLine('site')}`
    }
    if (short || /what\s*is|wetin\s*be|explain/i.test(t)) {
      return `**NELFUND** is Nigeria’s interest-free **student loan** for eligible students in **public** tertiary schools.\n\nTwo money paths (do not mix them up):\n• **School fees / institutional charges** → paid to your **school**\n• **Upkeep** → living support to **you** (only if approved and selected)\n\nWant apply steps, eligibility, or the portal link?`
    }
    return `**NELFUND** = interest-free student loan (public tertiary). School charges go to the institution; upkeep can go to you when approved. Loan, not grant.\n\n${wantsLinks(t) ? linkLine('both') : 'Ask me how to apply, eligibility, fees vs upkeep, or paste a portal error.'}`
  }

  if (intent === 'how-to-apply') {
    if (/sign\s*up|create\s*(an?\s*)?account|register/i.test(t) && !/loan\s*application|how\s*to\s*apply|submit/i.test(t)) {
      return `${acknowledge(ctx, '**Sign up / create account** is not the same as submitting a loan application.')}\n\n**Create account (one-time setup):**\n1. Open ${PORTAL}\n2. Sign **up** (new account) with correct JAMB, NIN, phone, email\n3. Verify OTP — use your own number\n4. Complete profile / bank details\n\nAfter the account exists, you still need an **open loan application window** to submit the actual loan/upkeep request.\n\nStuck on sign-up error? Paste the exact message.`
    }
    if (short) {
      return `Three different steps people mix up:\n\n1. **Sign up** — create account at ${PORTAL}\n2. **Sign in / login** — return to an existing account (${SITE} or portal)\n3. **Loan application** — submit institutional loan ± upkeep when the official window is open\n\nWhich of the three are you on?`
    }
    return `${acknowledge(ctx, 'Loan application path (after you already have an account):')}\n\n1. Confirm **${inst || 'your school'}** uploaded your student record\n2. Sign **in** at ${PORTAL} (or sign **up** first if you have no account)\n3. Complete JAMB, NIN, bank (own name)\n4. Choose **institutional charges** and/or **upkeep** as the portal allows\n5. Submit only when the **official application window** is open (${SITE})\n\n**Sign up ≠ loan submitted.** Account creation can be available even when a new loan window is not yet open.\n\nWhich step failed?`
  }

  if (intent === 'portal-login') {
    return `${acknowledge(ctx, 'This is about **sign in / login**, not creating a new account.')}\n\n**Sign in (existing account):**\n• Prefer ${SITE} for sign-in, or the portal login if that is where your session lives\n• Use the password you set at sign-up; reset only on the **official** page\n• Session expired / blank screen → another browser or clear site data, then retry\n\n**Not the same as:**\n• **Sign up** = first-time account at ${PORTAL}\n• **Loan application** = submitting for school fees / upkeep when the window is open\n\nWhat do you see — wrong password, session expired, or blank page?`
  }

  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp “portal” links.`
  }

  if (intent === 'upkeep') {
    return `${acknowledge(ctx, '**Upkeep** is not school fees.')}\n\n| | **Upkeep** | **School fees (institutional charges)** |\n|---|------------|----------------------------------------|\n| Who receives it? | **You** (student) | **Your school** |\n| What for? | Living support (when approved) | Tuition / institutional charges |\n| Typical guide | Often cited **₦20,000/month** unless ${SITE} changes it | Amount set by your school |\n\nOfficial FAQ: apply for **both** institutional loan and upkeep at registration if you want upkeep — missing upkeep at that stage can mean no upkeep for the cycle.\n\nPaid only **after approval**. Ignore WhatsApp “urgent upkeep” messages.\n\nAre you asking about the amount, timing, or that upkeep was not selected?`
  }

  if (intent === 'school-fees') {
    return `${acknowledge(ctx, '**School fees / institutional charges** are not upkeep.')}\n\n| | **School fees** | **Upkeep** |\n|---|---------------|------------|\n| Paid to | **The school** | **You** |\n| Covers | Tuition / institutional charges | Living support |\n| In your bank? | No — school receives it | Yes, when approved |\n\nZero interest. No agent fee before disbursement.\n\nIf **you** already paid school fees before NELFUND approval, ask your **bursary** about refund/reconciliation — that is a school process, not an upkeep payment.\n\nWant the upkeep explanation instead, or how to apply for institutional charges?`
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    if (inst) {
      return `${acknowledge(ctx, 'This is usually a school-record match issue.')}\n\nFor **${inst}**:\n1. Contact **ICT / Registry / NELFUND desk** and ask them to confirm your record was uploaded\n2. Retry ${PORTAL} after they confirm\n3. If they confirm upload and the portal still fails → open ${ESUPPORT}\n\nSay **“draft the email”** if you want a short message for the school desk.`
    }
    if (short) {
      return `Missing information almost always means NELFUND cannot match you to a school record yet.\n\n${askSchool()}`
    }
    return `${acknowledge(ctx, 'Missing information / school not on the list is a record problem, not “you are rejected”.')}\n\n1. Tell me your **institution**\n2. Ask campus ICT / Registry / NELFUND desk whether your record was uploaded\n3. Retry ${PORTAL}\n4. Still failing after they confirm → ${ESUPPORT}\n\n${askSchool()}`
  }

  if (intent === 'pending-application' || intent === 'institution-verification') {
    if (/30\s*day|how\s*long|when\s*will|disburse/i.test(t)) {
      return `Official guidance: after **approval**, disbursement is expected within about **30 days** (clock from approval, not submission day).\n\nOnly ${PORTAL} shows true status. Pending ≠ rejected.\n\nLong delay after approval${school} → school desk + ${ESUPPORT}.`
    }
    if (short || /how\s*far|e\s*no\s*dey|status/i.test(t)) {
      return `Only the portal shows live status: ${PORTAL}\n\nPending / under review is **not** automatic rejection.\n\nWhat does it show — Pending, Under review, or Approved?`
    }
    return `${acknowledge(ctx, 'On pending applications:')}\n\n• Trust **${PORTAL}**, not WhatsApp screenshots\n• Pending = still processing\n• Disbursement clock starts at **approval**\n• Long delay after approval → school NELFUND desk${school} + ${ESUPPORT}`
  }

  if (intent === 'jamb-verification') {
    return `${acknowledge(ctx, 'For JAMB verification failures:')}\n\n1. Re-type every digit (no spaces)\n2. Name and DOB must match **JAMB and NIN**\n3. Direct Entry still needs a valid JAMB number per official FAQ\n4. Still failing → school records desk, then ${ESUPPORT}\n\nPaste the exact red error if you have it.`
  }

  if (intent === 'nin-verification' || intent === 'bank-information' || intent === 'profile-update') {
    if (/\bbvn\b|bank/i.test(t)) {
      return `Use a bank account **in your own name**. BVN must match the bank. Fix bank-side issues before retrying ${PORTAL}. No paid “BVN agents”. Still blocked → ${ESUPPORT}`
    }
    if (/\bnin\b/i.test(t)) {
      return `Check NIN on your official slip. Name/DOB must match NELFUND profile and JAMB. Fix through proper ID channels — not agents.\n\n${linkLine('portal')}`
    }
    return `Update only what ${PORTAL} allows. What exactly are you trying to change?`
  }

  if (intent === 'repayment' || intent === 'gsi' || intent === 'loan-or-scholarship') {
    if (/scholarship|free\s*money|is\s*it\s*free/i.test(t)) {
      return `NELFUND is an **interest-free loan**, not a scholarship. Confirm rules on ${SITE}.`
    }
    if (/\bgsi\b/i.test(t)) {
      return `**GSI** can debit linked accounts when repayment is due. Details: ${SITE} / ${FAQ}.`
    }
    return `${acknowledge(ctx, 'Repayment in plain terms:')}\n\n• Interest-free **loan**, not a grant\n• Official FAQ: often due **2 years after NYSC**; guide ~**10% of salary** (or profit if self-employed)\n• Viral “life imprisonment” claims have been called fake by NELFUND\n\nCheck ${PORTAL} / ${SITE} for your case — I will not invent a personal calendar.`
  }

  if (intent === 'scam-safety') {
    return `**Do not pay** anyone to process NELFUND. No payment is required before disbursement.\n\n• Never share OTP or password\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
  }

  if (intent === 'contact-support' || intent === 'contact-lookup') {
    if (inst || /school|campus|registry|ict/i.test(t)) {
      return `School-record issues${school}: campus **ICT / Registry / NELFUND desk** first.\n\nNELFUND tickets: ${ESUPPORT}\nWant me to **draft the email**?`
    }
    return `Official: ${ESUPPORT} · ${SITE} · ${PORTAL}\nSchool upload problems → campus ICT first.`
  }

  if (intent === 'documents-needed' || intent === 'guarantor' || intent === 'reapplication' || intent === 'readiness') {
    if (/guarantor|surety/i.test(t)) {
      return `Official FAQ: **no guarantor** required. Do not pay anyone to “stand as guarantor”. Follow ${PORTAL} only.`
    }
    if (/re-?apply|again/i.test(t)) {
      return `Apply **each academic session**. Fix missing data with your school, then ${PORTAL}. Still blocked → ${ESUPPORT}.`
    }
    return `Usually needed: JAMB, NIN, bank + BVN, admission/matric as the portal asks. No guarantor per FAQ. Apply only on ${PORTAL}.`
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/open|deadline|window|still\s*accept|still\s*dey/i.test(t)) {
      return `I will **not invent** a closing date.\n\nAlso remember:\n• **Account creation** can be open while a **loan window** is still unconfirmed\n• **Sign in** is for existing accounts; **sign up** is new accounts\n\nCheck ${SITE} and ${PORTAL}. Say apply, login, or pending if you want that path.`
    }
    if (!t) {
      return `Send a short line about what you need.\n\nUseful starters: sign up, login, how to apply, pending status, missing information, upkeep vs school fees.\n\n${linkLine('both')}`
    }
    if (short || /help|abeg|stuck|wahala|what\s*next|empty/i.test(t)) {
      return `Pick one:\n• Sign **up** (new account)\n• Sign **in** / login (existing account)\n• Loan application (fees / upkeep)\n• Missing information / pending\n• Upkeep vs school fees\n\nOne short sentence is enough. Portal: ${PORTAL}`
    }
    return `Live notices only from ${SITE} and ${PORTAL}. I will not invent a deadline or approval date.\n\nWhat are you trying to do — sign up, login, submit a loan, or check pending status?`
  }

  if (intent === 'refund') {
    return `If you paid **school fees** yourself before NELFUND approval, ask **bursary** about refund/reconciliation. Institutional charges go to the school when approved — that is not upkeep in your account.\n\n${inst ? `For **${inst}**, start with bursary.` : askSchool()}`
  }
  if (intent === 'email-draft') {
    if (inst) {
      return `Draft for **${inst}** ICT / Registry / NELFUND desk:\n\nSubject: Request to confirm NELFUND student record upload\n\nDear Sir/Madam,\nI am a student of ${inst}. My NELFUND portal shows missing information / school not matched. Please confirm whether my record has been uploaded.\nFull name: [Your name]\nMatric / JAMB: [Number]\nThank you.`
    }
    return `I can draft the school email — ${askSchool()}`
  }

  if (intent === 'unknown' || !intent) {
    return `Tell me in one line — for example “I want to sign up”, “I cannot login”, “how to apply for the loan”, “upkeep vs school fees”, or paste the portal error.\n\nPortal: ${PORTAL}`
  }

  return `Check live status on ${PORTAL}. Reply with the exact portal message or whether you mean **sign up**, **login**, **loan application**, **school fees**, or **upkeep**.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|sign\s*up|portal|jamb|nin|scam|open|status|abeg|wahala|help|stuck|ticket|esupport|school|pending|password|error|fees/i.test(
    text,
  )
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const t = (ctx.userText || '').toLowerCase()
  if (ctx.institutionName) {
    return `Next for **${ctx.institutionName}**: ask ICT/Registry to confirm upload, then retry ${PORTAL}. Still failing → ${ESUPPORT}.`
  }
  if (intent === 'pending-application') {
    return `Next: open ${PORTAL} and tell me the exact status word (Pending, Under review, Approved).`
  }
  if (intent === 'missing-information' || intent === 'school-not-found') {
    return askSchool()
  }
  if (intent === 'how-to-apply') {
    return `Are you stuck on **sign up**, **profile**, or **submit loan**? Those are different steps.`
  }
  if (intent === 'portal-login') {
    return `Still on login — wrong password, session expired, or blank page?`
  }
  if (/yes|ok|okay|continue|what\s*next|more/i.test(t)) {
    return `Sure — sign up, login, loan apply, school fees, or upkeep? One is enough.`
  }
  return `What next — sign up, login, loan application, school fees, or upkeep?`
}
