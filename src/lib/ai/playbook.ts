/**
 * NELFUND AI playbook — adaptive replies that match what the student asked.
 * Style: answer the actual question first, one clear next step, links only when useful.
 * Never dump the same portal/FAQ block on every turn.
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

/** Detect short / vague asks so we answer briefly */
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
    return "That error is common on the portal — here is the practical fix."
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

  // ——— What is NELFUND / history / purpose ———
  if (intent === 'what-is-nelfund' || intent === 'nelfund-history' || intent === 'nelfund-purpose') {
    if (/when|who\s*establish|history|act\s*,?\s*2023|created/i.test(t)) {
      return `NELFUND was created under the **Student Loans (Access to Higher Education) Act, 2023**. It is run by the Nigerian Education Loan Fund for eligible students in **public** tertiary institutions.\n\nIt is an **interest-free loan you repay**, not a grant.\n\n${linkLine('site')}`
    }
    if (/purpose|why|wetin.*for|what.*for/i.test(t)) {
      return `Purpose: remove money as a barrier to higher education.\n\nIt can cover:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (living support when approved)\n\nYou repay after study under the Act’s rules — it is not free money.\n\n${linkLine('site')}`
    }
    if (short || /what\s*is|wetin\s*be|explain/i.test(t)) {
      return `**NELFUND** is Nigeria’s interest-free **student loan** for eligible students in **public** tertiary schools.\n\n• Fees go to the school when approved\n• Upkeep can go to you when approved\n• It is a **loan**, not a scholarship\n\nWant the apply steps, eligibility, or the official portal link?`
    }
    return `**NELFUND** = Nigerian Education Loan Fund: interest-free loans for eligible public tertiary students (school charges + upkeep when approved). Loan, not grant.\n\n${wantsLinks(t) ? linkLine('both') : 'Ask me how to apply, eligibility, or paste a portal error if you are stuck.'}`
  }

  // ——— How to apply ———
  if (intent === 'how-to-apply') {
    if (/account|sign\s*up|register|create/i.test(t)) {
      return `${acknowledge(ctx, 'To create your account:')}\n\n1. Open ${PORTAL}\n2. Sign up with accurate JAMB, NIN, and personal details\n3. Use your own phone/email — you will need OTP access\n4. Complete the profile before submitting\n\nStuck on a specific step or error message? Paste it here.`
    }
    if (short) {
      return `To apply: confirm your school has uploaded your record → sign up at ${PORTAL} → fill JAMB / NIN / bank → submit when the official window is open.\n\nWhich part are you on — account, profile, or submit?`
    }
    return `${acknowledge(ctx, 'Here is the clean apply path:')}\n\n1. Confirm **${inst || 'your school'}** has uploaded your student record\n2. Sign up / sign in at ${PORTAL}\n3. Complete JAMB, NIN, and bank (own account)\n4. Submit only when the official window is open on ${SITE}\n\nYou apply **each academic session**. If something fails, send the exact portal text — not a screenshot description only.`
  }

  // ——— Missing info / school not showing ———
  if (intent === 'missing-information' || intent === 'school-not-found') {
    if (inst) {
      return `${acknowledge(ctx, 'This is usually a school-record match issue.')}\n\nFor **${inst}**:\n1. Contact **ICT / Registry / NELFUND desk** and ask them to confirm your record was uploaded\n2. Retry ${PORTAL} after they confirm\n3. If they confirm upload and the portal still fails → open ${ESUPPORT}\n\nSay **“draft the email”** if you want a short message for the school desk.`
    }
    if (short) {
      return `Missing information almost always means NELFUND cannot match you to a school record yet.\n\n${askSchool()}`
    }
    return `${acknowledge(ctx, 'Missing information / school not on the list is a record problem, not “you are rejected”.')}\n\n1. Tell me your **institution**\n2. Ask campus ICT / Registry / NELFUND desk whether your record was uploaded\n3. Retry ${PORTAL}\n4. Still failing after they confirm → ${ESUPPORT}\n\n${askSchool()}`
  }

  // ——— Pending ———
  if (intent === 'pending-application' || intent === 'institution-verification') {
    if (/30\s*day|how\s*long|when\s*will|disburse/i.test(t)) {
      return `Official guidance: after **approval**, disbursement is expected within about **30 days** (the clock starts from approval, not from the day you submitted).\n\nUntil then, only ${PORTAL} shows your real status. Pending ≠ rejected.\n\nIf you are already approved and past that window${school}, talk to the school desk and ${ESUPPORT}.`
    }
    if (short || /how\s*far|e\s*no\s*dey|status/i.test(t)) {
      return `Only the portal shows your live status: ${PORTAL}\n\nPending / under review is normal and is **not** automatic rejection. If it has been long after approval, use school desk${school} + ${ESUPPORT}.\n\nWhat does the portal show exactly — Pending, Under review, or Approved?`
    }
    return `${acknowledge(ctx, 'On pending applications:')}\n\n• Trust **${PORTAL}**, not WhatsApp screenshots\n• Pending means still processing\n• Disbursement timing is tied to **approval**, not submission day\n• Long delay after approval → school NELFUND desk${school} and ${ESUPPORT}\n\nPaste the status line from the portal if you want a tighter read.`
  }

  // ——— JAMB ———
  if (intent === 'jamb-verification') {
    return `${acknowledge(ctx, 'For JAMB verification failures:')}\n\n1. Re-type every digit of the JAMB registration number (no spaces)\n2. Name and date of birth must match **JAMB and NIN**\n3. Direct Entry students still need a valid JAMB number per official FAQ\n4. If it still fails after a careful recheck → school records desk, then ${ESUPPORT}\n\nIf the portal shows a specific red error, paste that exact line.`
  }

  // ——— NIN / bank / profile ———
  if (intent === 'nin-verification' || intent === 'bank-information' || intent === 'profile-update') {
    if (/\bbvn\b|bank/i.test(t)) {
      return `Use a bank account **in your own name**. BVN digits must match the bank’s records. Fix bank-side mismatches before retrying ${PORTAL}.\n\nDo not pay anyone to “correct BVN” for NELFUND. Still blocked after bank confirms? ${ESUPPORT}`
    }
    if (/\bnin\b/i.test(t)) {
      return `Check NIN digits on your official slip. Name and DOB must match your NELFUND profile and JAMB. Mismatches are fixed through proper ID channels — not agents.\n\n${linkLine('portal')}`
    }
    return `Update only what ${PORTAL} allows. Name / JAMB / NIN mismatches often need official ID or school channels.\n\nWhat exactly are you trying to change?`
  }

  // ——— Login / official links ———
  if (intent === 'portal-login' || intent === 'official-sources') {
    if (wantsLinks(t) || short) {
      return `Official only:\n• Sign in: ${SITE}\n• Apply / sign up: ${PORTAL}\n• Support ticket: ${ESUPPORT}\n\nIgnore random WhatsApp or Instagram links. Never share OTP or password.`
    }
    return `${acknowledge(ctx, 'If login is failing:')}\n\n1. Use only ${SITE} (sign in) or ${PORTAL} (apply)\n2. Reset password from the official page if needed\n3. Try another browser / clear site data if you see a blank screen\n4. Still stuck → ${ESUPPORT} with the exact error text\n\nWhat do you see — wrong password, session expired, or blank page?`
  }

  // ——— Upkeep ———
  if (intent === 'upkeep') {
    return `${acknowledge(ctx, 'On upkeep:')}\n\n• Apply for **both** institutional loan and upkeep when you register — official FAQ says missing upkeep at registration means you will not get it for that cycle\n• Guide figure often cited: **₦20,000 / month** unless ${SITE} publishes a change\n• Paid only **after approval** — ignore WhatsApp “urgent payment” claims\n\nAre you asking about the amount, when it pays, or that you did not select upkeep?`
  }

  // ——— Repayment / GSI / loan vs scholarship ———
  if (intent === 'repayment' || intent === 'gsi' || intent === 'loan-or-scholarship') {
    if (/scholarship|free\s*money|is\s*it\s*free/i.test(t)) {
      return `NELFUND is an **interest-free loan**, not a scholarship or free money. You repay under the Act after the study / NYSC-related trigger.\n\nConfirm rules on ${SITE} — not social media.`
    }
    if (/\bgsi\b/i.test(t)) {
      return `**GSI** (Global Standing Instruction) is a repayment mechanism that can debit linked accounts when repayment is due under NELFUND rules. Details stay on ${SITE} / ${FAQ}.`
    }
    return `${acknowledge(ctx, 'Repayment in plain terms:')}\n\n• It is a **loan** (interest-free), not a grant\n• Official FAQ: repayment is due **2 years after NYSC**; typical guide is about **10% of salary** (or monthly profit for self-employed)\n• If still unemployed after that window, the FAQ describes periodic affidavits — follow current text on ${FAQ}\n• Viral “life imprisonment” claims have been called out as fake by NELFUND\n\nI will not invent a personal repayment calendar — check ${PORTAL} and ${SITE} for your case.`
  }

  // ——— Fees ———
  if (intent === 'school-fees') {
    return `Institutional charges are paid **to the school**, not into your pocket. The amount follows your school’s published charges and approval.\n\nZero interest. No agent fee is required before disbursement.\n\nAlready paid school fees yourself? Ask your **bursary** about their refund / reconciliation process.`
  }

  // ——— Safety / scam ———
  if (intent === 'scam-safety') {
    return `**Do not pay** anyone to “process” or “speed up” NELFUND. Official FAQ: no payment is required before disbursement.\n\n• Never share OTP, password, or full bank login\n• Apply only on ${PORTAL}\n• Report pressure or fraud patterns via ${ESUPPORT}\n\nIf someone is demanding money now, stop and use only the official links above.`
  }

  // ——— Support / contact ———
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    if (inst || /school|campus|registry|ict/i.test(t)) {
      return `For school-record problems${school}, start with campus **ICT / Registry / NELFUND desk**.\n\nNELFUND-wide tickets: ${ESUPPORT}\nPortal: ${PORTAL}\n\nWant me to **draft the email** to the school desk?`
    }
    return `Official channels only:\n• Tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}\n\nSchool upload / missing record → campus ICT / Registry first. Tell me your school if you want that path spelled out.`
  }

  // ——— Docs / guarantor / reapply / readiness ———
  if (intent === 'documents-needed' || intent === 'guarantor' || intent === 'reapplication' || intent === 'readiness') {
    if (/guarantor|surety/i.test(t)) {
      return `Official FAQ: **no guarantor** is required for NELFUND. Do not pay anyone to “stand as guarantor”.\n\nFollow only what ${PORTAL} asks for your cycle.`
    }
    if (/re-?apply|again/i.test(t)) {
      return `You apply **each academic session**. Fix any missing data with your school first, then use ${PORTAL}. If the portal still blocks you after corrections → ${ESUPPORT}.`
    }
    return `Usually needed (follow the portal for your cycle):\n• JAMB details\n• NIN\n• Bank account + BVN\n• Admission / matric evidence as requested\n\nNo guarantor per official FAQ. Ready checklist: school uploaded your record, details consistent, apply only on ${PORTAL}.`
  }

  // ——— Current / deadline / vague help ———
  if (intent === 'current-information' || intent === 'deadline') {
    if (/open|deadline|window|still\s*accept|still\s*dey/i.test(t)) {
      return `I will **not invent** a closing date. Application windows change by cycle.\n\nCheck the notice on ${SITE} and your status on ${PORTAL} only.\n\nIf you say what you need (apply, pending, login, missing info), I will give the exact next step.`
    }
    if (short || /help|abeg|stuck|wahala|what\s*next/i.test(t)) {
      return `I can help — pick the closest one (or paste the portal message):\n\n• How to apply / create account\n• Login or password problem\n• Missing information / school not showing\n• Pending or under review\n• JAMB / NIN / BVN error\n• Upkeep or repayment\n\nOne short sentence is enough.`
    }
    return `Live status and open/close notices only come from ${SITE} and ${PORTAL}. I will not guess dates.\n\nWhat are you trying to do right now?`
  }

  // ——— Refund / email draft ———
  if (intent === 'refund') {
    return `If you already paid school fees before NELFUND approval, ask your **school bursary / fees office** about refund or reconciliation. NELFUND institutional charges go to the school when approved — not as a personal cash refund from NELFUND.\n\n${inst ? `For **${inst}**, start with bursary.` : askSchool()}`
  }
  if (intent === 'email-draft') {
    if (inst) {
      return `Here is a short draft you can send to **${inst}** ICT / Registry / NELFUND desk:\n\nSubject: Request to confirm NELFUND student record upload\n\nDear Sir/Madam,\nI am a student of ${inst}. My NELFUND portal shows missing information / school not matched. Please confirm whether my record has been uploaded to NELFUND and advise if any correction is needed.\nFull name: [Your name]\nMatric / JAMB: [Number]\nThank you.\n\nEdit the brackets, then send from your student email if required.`
    }
    return `I can draft the school email — ${askSchool()}`
  }

  // ——— Residual / unknown-safe ———
  if (intent === 'unknown' || !intent) {
    return `I can help with NELFUND in plain language.\n\nTell me in one line what is going on — for example “portal says missing information”, “JAMB invalid”, “how far with my loan”, or “how to apply”.\n\nOfficial portal if you need it: ${PORTAL}`
  }

  // Generic named intent fallback — still specific, not a link wall
  return `For this NELFUND question, the safest next step is to check your live status on ${PORTAL} and only use ${SITE} / ${ESUPPORT} for official notices and tickets.\n\nReply with the **exact portal message** or what you are trying to do (apply, pending, missing info, login), and I will answer that directly.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|portal|jamb|nin|scam|open|status|abeg|wahala|help|stuck|ticket|esupport|school|pending|password|error/i.test(
    text,
  )
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const t = (ctx.userText || '').toLowerCase()
  if (ctx.institutionName) {
    return `Next for **${ctx.institutionName}**: ask ICT/Registry to confirm upload, then retry ${PORTAL}. If they confirm and it still fails, open ${ESUPPORT}.\n\nWant the email draft for the school desk?`
  }
  if (intent === 'pending-application') {
    return `Next: open ${PORTAL} and tell me the exact status word you see (Pending, Under review, Approved). That changes the advice.`
  }
  if (intent === 'missing-information' || intent === 'school-not-found') {
    return askSchool()
  }
  if (/yes|ok|okay|continue|what\s*next|more/i.test(t)) {
    return `Sure — do you want apply steps, pending status help, missing-information fix, or official support links? One is enough.`
  }
  return `What should we tackle next — apply, missing information, pending status, or a school email draft?`
}
