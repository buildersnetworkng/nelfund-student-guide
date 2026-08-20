/**
 * Offline NELFUND intelligence playbook.
 * Government-grade, no external LLM required.
 * Covers major student angles with multi-turn variants; never invents official dates.
 */

import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex: number
  lastAssistant?: string
  userText: string
}

function instLine(ctx: PlaybookContext): string {
  return ctx.institutionName ? ` (for **${ctx.institutionName}**)` : ''
}

export function isNearDuplicate(prev: string | undefined, next: string): boolean {
  if (!prev || prev.length < 40) return false
  const a = prev.toLowerCase().replace(/\s+/g, ' ').slice(0, 160)
  const b = next.toLowerCase().replace(/\s+/g, ' ').slice(0, 160)
  if (a === b) return true
  let same = 0
  const wa = new Set(a.split(' ').filter((w) => w.length > 3))
  const wb = b.split(' ').filter((w) => w.length > 3)
  for (const w of wb) if (wa.has(w)) same += 1
  return wb.length > 8 && same / wb.length > 0.65
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const t = ctx.userText.toLowerCase()
  const n = ctx.turnIndex
  const asksMoney = /when\s*will\s*i\s*(get|receive)|disburse|credit\s*(my\s*)?account|money\s*no\s*dey|pay\s*me/i.test(t)
  const asksHowLong = /how\s*long|how\s*many\s*(days|weeks|months)/i.test(t)

  if (intent === 'nelfund-purpose' || /purpose\s*of\s*nelfund|why\s*(was\s*)?nelfund|aim\s*of\s*nelfund|goal\s*of\s*nelfund/i.test(t)) {
    return `**Purpose of NELFUND**\n\nNELFUND exists to **remove financial barriers** to tertiary education for eligible Nigerian students.\n\n• Interest-free student loans for **institutional charges** (paid to the school)\n• **Upkeep** support when that component applies\n• Goal: fewer students drop out only because of school fees\n\nIt is still a **loan you repay**, not a scholarship.\n\nOfficial site: ${SITE} · Portal: ${PORTAL}`
  }
  if (intent === 'nelfund-history' || /when\s*(was\s*)?nelfund|who\s*(built|created|established|founded)\s*nelfund|student\s*loans?\s*act|history\s*of\s*nelfund/i.test(t)) {
    return `**When / who established NELFUND**\n\nNELFUND was established by the **Federal Government of Nigeria** under the **Student Loans (Access to Higher Education) Act, 2023** (with a **2024 re-enactment**).\n\n• It is a **public education-loan fund**, not a private company product\n• Implemented by the **Nigerian Education Loan Fund**\n• This student guide is independent and was **not** built by NELFUND\n\nAlways confirm current rules on ${SITE} and ${PORTAL}.`
  }

  if (intent === 'what-is-nelfund' || /what\s*is\s*nelfund|explain\s*nelfund|about\s*nelfund|wetin\s*be\s*nelfund|how\s*nelfund\s*work|meaning\s*of\s*nelfund/i.test(t)) {
    if (n > 0 && /repay|loan|scholarship|free/i.test(t)) {
      return `NELFUND is a **loan**, not a scholarship or free money.\n\n• **Institutional charges** are paid to your school, not into your pocket.\n• **Upkeep** is living support when approved — this guide treats **₦20,000/month** as current unless ${SITE} changes it.\n• You repay after studies under official rules.\n\nOverview: ${SITE} · FAQ: ${FAQ}`
    }
    return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nIt helps eligible students in public Nigerian tertiary institutions with:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when that component applies)\n\nIt is a **loan you repay**, not a grant.\n\n• Your school must have your student record in order\n• Create/login on ${PORTAL}\n• Apply only when the application window is officially open\n• Support tickets: ${ESUPPORT}\n\nAsk next: how to apply, missing information, BVN, upkeep, or whether applications are open.`
  }

  if (/interest|zero\s*interest|any\s*interest/i.test(t)) {
    return `**Interest on NELFUND**\n\nOfficial NELFUND FAQ: **zero interest** on the student loan.\n\nYou still **repay the principal** under official rules (not a grant).\n\n${SITE} · FAQ: ${FAQ}`
  }
  if (/how\s*much\s*(can\s*i|loan|borrow|get)|loan\s*amount|maximum\s*loan|amount\s*of\s*(the\s*)?loan/i.test(t)) {
    return `**How much can you borrow?**\n\nOfficial FAQ: the amount is **determined by the institutional charges of each school**. The loan can cover institutional charges and upkeep if required.\n\nThere is **no single fixed naira amount** for every student nationwide.\n\n${SITE} · ${PORTAL}`
  }
  if (/private\s*(uni|university|school|poly)|can\s*private/i.test(t)) {
    return `**Private institutions**\n\nOfficial coverage is for **public** Nigerian universities, polytechnics, colleges of education, and vocational schools as stated by NELFUND.\n\nConfirm any change **only** on ${SITE}.`
  }
  if (/part[-\s]?time|full[-\s]?time/i.test(t)) {
    return `**Full-time vs part-time**\n\nOfficial FAQ: the loan is open to **new and existing full-time students**. Confirm part-time rules only on ${SITE} / ${PORTAL}.`
  }
  if (/citizen|nigerian\s*only|foreign\s*student|must\s*i\s*be\s*nigerian/i.test(t)) {
    return `**Citizenship**\n\nApplicants must be **Nigerian citizens**. Identity verification typically uses **NIN** and **BVN** on ${PORTAL}.`
  }
  if ((/nysc|when\s*(do\s*i|does)\s*repay|repayment\s*start|when\s*is\s*(the\s*)?loan\s*due/i.test(t)) && /repay|nysc|due|start/i.test(t)) {
    return `**When repayment starts**\n\nOfficial FAQ: the loan is due for repayment **2 years after completion of NYSC**.\n\n• Employed: **10% of salary** deducted at source\n• Self-employed: **10% of monthly profit**\n• You may repay more than 10%\n\n${SITE} · ${PORTAL}`
  }
  if (/10\s*%|ten\s*percent|how\s*much\s*(deduct|repay|monthly)/i.test(t)) {
    return `**Monthly repayment rate**\n\nOfficial FAQ:\n• **10% of salary** at source (employed)\n• **10% of monthly profit** (self-employed)\n• You may repay **more** than 10%\n\n${SITE}`
  }
  if (/how\s*(do\s*i\s*)?know.*(approv|status)|am\s*i\s*approv|application\s*approv/i.test(t)) {
    return `**Approval status**\n\nOfficial FAQ: you receive a **notification**, and you can see status in your **profile on the portal**.\n\n${PORTAL} · ${ESUPPORT}`
  }
  if (/who\s*(gets|receives)\s*(the\s*)?(money|fees|payment)|paid\s*to\s*(school|me)/i.test(t)) {
    return `**Where the money goes**\n\n• **Institutional charges** → paid to your **school**\n• **Upkeep** (if approved) → student under official rules\n\n${PORTAL}`
  }
  if (/student\s*loans?\s*act|which\s*law|nelfund\s*act/i.test(t)) {
    return `**Legal basis**\n\n**Student Loans (Access to Higher Education) Act, 2023**, strengthened by the **2024 re-enactment**.\n\n${SITE}`
  }

  if (
    intent === 'current-information' ||
    intent === 'deadline' ||
    intent === 'academic-session' ||
    (/bvn/i.test(t) && /(expire|deadline|registr|account|apply|yet|don'?t|dont|no\s*bvn|when)/i.test(t)) ||
    /expire|deadline|open\s*now|still\s*open|closing|2026\s*\/?\s*2027|is\s*nelfund\s*(open|closed)/i.test(t)
  ) {
    if (/bvn/i.test(t) && /(expire|deadline|registr|account|apply|yet|don'?t|dont|no\s*bvn|when)/i.test(t)) {
      return `You do **not** need to panic about BVN right now.\n\n• Sort BVN with your bank\n• You can often still create/prepare your account on ${PORTAL}\n• Loan window opens only when NELFUND announces it on ${SITE} — this guide will not invent dates\n\nOnly ${SITE} and ${PORTAL} are authoritative.`
    }
    return `**Current application status (how to check — not a guessed date)**\n\nNELFUND opening and closing dates **change by cycle**. This assistant does not invent dates.\n\n• Official site: ${SITE}\n• Student portal: ${PORTAL}\n• FAQ: ${FAQ}\n\nAccount creation ≠ loan application still open.\n\nSay what you are trying to do (create account, apply for loan, sort BVN, missing information).`
  }

  if (intent === 'missing-information' || /missing\s*(info|information)|no\s*school\s*info|e\s*dey\s*show\s*missing/i.test(t)) {
    if (n >= 1 && ctx.institutionName) {
      return `For **${ctx.institutionName}**, missing information almost always means the portal cannot match your student record yet.\n\n1. Contact **ICT / Registry / NELFUND desk**\n2. Retry ${PORTAL}\n3. Still failing after school confirms → ${ESUPPORT}\n\nSay **“draft the email”** for a school message.`
    }
    return `**Missing information** usually means NELFUND cannot match your details to a school record yet.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry ${PORTAL}\n4. Still failing → ${ESUPPORT}\n\nWhich school do you attend?`
  }

  if (intent === 'pending-application') {
    return `**Pending** usually means still processing — not automatically rejected.\n\n• Exact status on ${PORTAL}\n• School NELFUND desk${instLine(ctx)}\n• Long stuck → ${ESUPPORT}\n\nThere is no single official “X days” number for every case.`
  }

  if (intent === 'how-to-apply' || /how\s*(do\s*i|to)\s*apply|start\s*(my\s*)?application/i.test(t)) {
    return `**How to apply (nationwide)**\n\n1. Admission into a covered public institution + IDs (JAMB, NIN; BVN for banking)\n2. Create / sign in only at ${PORTAL}\n3. Complete profile and verification steps\n4. Apply for loan/upkeep **only when that window is officially open** (${SITE})\n5. School must have matching data — fix missing information with the school first\n\nNo paid agents. No OTP/password sharing.\n\n${SITE} · ${FAQ} · ${ESUPPORT}`
  }

  if (intent === 'upkeep' || (asksMoney && /upkeep|20k|allowance/i.test(t))) {
    return `**Upkeep** is living support (separate from school charges).\n\n• Confirmed figure on this guide: **₦20,000 per month**, unless official pages change it\n• Only when approved\n• Ignore WhatsApp ₦25k claims unless ${SITE} or ${PORTAL} confirms\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
  }

  if (asksMoney && intent === 'unknown') {
    return `**Payment timing** is controlled by approval and official disbursement — not by this chat.\n\n• School charges → institution\n• Upkeep → only if approved\n• Status: ${PORTAL}\n• Approved but stuck → ${ESUPPORT}`
  }

  if (intent === 'institution-verification') {
    return `Students **cannot** open a private NELFUND “upload log.”\n\nAsk **ICT / Registry / NELFUND desk** about name, NIN, JAMB, matric.${ctx.institutionName ? `\n\n**${ctx.institutionName}** — say “draft the email”.` : '\n\nTell me your school name.'}\n\nPortal: ${PORTAL}`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB verification issues**\n\n• Re-check every digit\n• Name / DOB should match JAMB and NIN\n• Still failing → school records desk, then ${ESUPPORT}\n\nPortal: ${PORTAL}`
  }

  if (intent === 'nin-verification') {
    return `**NIN verification issues**\n\n• Confirm NIN digits against your official NIN slip\n• Name and date of birth should match across NIN and NELFUND profile\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
  }

  if (intent === 'portal-login' || /which\s*(link|url|website).{0,30}(login|apply)/i.test(t)) {
    return `**Official login / application**\n\nUse only:\n• Portal: ${PORTAL}\n• Website: ${SITE}\n\nSupport tickets: ${ESUPPORT}`
  }

  if (intent === 'loan-or-scholarship' || /scholarship|free\s*money|is\s*it\s*a\s*loan/i.test(t)) {
    return `NELFUND is a **loan**, not a scholarship or free money. You are expected to repay under official NELFUND rules.\n\n${SITE} · ${FAQ}`
  }

  if (intent === 'repayment' || intent === 'gsi' || /repay|pay\s*back|\bgsi\b/i.test(t)) {
    return `**Repayment**\n\nOfficial FAQ: due **2 years after NYSC**.\n• **10% of salary** at source (employed)\n• **10% of monthly profit** (self-employed)\n• **GSI** may support recovery from linked accounts\n\n${SITE} · ${PORTAL}`
  }

  if (intent === 'scam-safety' || /scam|fraud|\botp\b|pay\s*(an?\s*)?agent/i.test(t)) {
    return `**Safety**\n\n• Never pay an agent to “process” or “speed up” NELFUND\n• Never share OTP, password, or full bank login\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
  }

  if (intent === 'eligibility' || intent === 'documents-needed' || intent === 'guarantor') {
    return `**Eligibility (official FAQ)**\n\n• Nigerian citizen\n• Admission into a **public** university, polytechnic, college of education, or vocational school\n• Full-time (per official FAQ)\n• Admission proof + JAMB, matric, NIN, BVN as required on the portal\n\nGuarantor: under the 2024 framework the earlier hard guarantor requirement was removed — follow the current portal checklist.\n\n${SITE} · ${PORTAL}`
  }

  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `For official support use ${ESUPPORT} and ${SITE}. For school-record issues, contact your institution ICT / Registry / NELFUND desk.\n\nPortal: ${PORTAL}`
  }

  return null
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (ctx.institutionName && /missing|upload|school/i.test(ctx.problemSummary || ctx.userText || '')) {
    return `Next for **${ctx.institutionName}**: confirm with ICT/Registry that your record was uploaded, then retry ${PORTAL}. If they confirm upload and it still fails, open ${ESUPPORT}.`
  }
  if (intent === 'current-information' || /open|deadline|bvn/i.test(ctx.userText || '')) {
    return `Still: only ${SITE} and ${PORTAL} define whether applications are open. I will not invent a date.`
  }
  return `Tell me the next detail — school name, exact portal message, or what you want to do (apply, contact school, draft email, check if open).\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
}
