/**
 * NELFUND AI playbook, adaptive replies that match what the student asked.
 * Clear distinctions: sign-up vs login vs loan application; school fees vs upkeep.
 * Never returns empty/null for residual or unknown intents.
 */

import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPortalLogin } from './playbookLogin'
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
  userText?: string | null
  priorIntent?: IntentId | null
}

const MENU = `Pick one:\n• Sign **up** (new account): ${PORTAL}\n• Sign **in** / login: ${SITE}\n• Loan application (fees / upkeep)\n• Pending / under review status\n• Missing information / school not on list\n• Upkeep vs school fees / repayment\n• Support ticket: ${ESUPPORT}\n\nPidgin or English is fine. Official pages only: ${SITE}`

function isFeesUpkeepContrast(t: string): boolean {
  return /\bupkeep\b|monthly\s*allowance|stipend/.test(t) && /school\s*fees|institutional\s*charges|tuition|school\s*money/.test(t)
}

function feesVsUpkeepAnswer(): string {
  return `**School fees vs upkeep** (two different things)\n\n• **Institutional charges / school fees:** paid **to your school**, not your personal account.\n• **Upkeep:** monthly living allowance paid **to you**, if you applied for it.\n\nOfficial FAQ: apply for **both** at registration. An institutional-only application does not later get upkeep.\n\nAmounts and pay dates only on ${PORTAL} / ${SITE}. FAQ: ${FAQ}`
}

function howToApplyAnswer(t: string): boolean {
  return false
}

function howToApplyText(t: string): string {
  if (/create\s*(account|profile)|sign\s*up|register\s*(first|now)/i.test(t)) {
    return `**Create the account first** (this is not login and not the loan form).\n\n1. Open ${PORTAL} on a browser, not a WhatsApp link.\n2. New students only: Sign **up** with your own email, then verify it.\n3. Fill NIN, BVN, and JAMB number exactly as issued.\n4. After the profile saves, use **Request for Student Loan** for fees and, if you need it, upkeep in the **same** session.\n\nAlready have an account? Sign **in** at ${SITE} instead of creating another one.`
  }
  if (/next\s*step|step\s*(2|two|3|three)|one\s*by\s*one|continue|then\s*wetin|what\s*next/i.test(t)) {
    return `**Next after the account exists:**\n\n1. Sign **in** at ${SITE} (do not sign up again).\n2. Confirm school / session appears. If it does not, that is a school-upload issue, not a second form.\n3. Click **Request for Student Loan**. Tick institutional charges (to the school). Tick upkeep only if you want monthly living money **now**.\n4. Submit once, then watch the status word on the portal.\n\nI will not invent a closing date. Live window: ${PORTAL}`
  }
  return `**How to apply (step by step)**\n1. New account only: ${PORTAL}\n2. Fill profile: NIN, BVN, JAMB registration number, admission / matric.\n3. Submit **institutional charges** (paid to the school). If you need monthly living money, apply for **upkeep in the same session**.\n4. After submit, watch status on the portal. Approval notice also shows in profile (official FAQ).\n\nExisting account = sign **in** at ${SITE}, not another sign-up. I will not invent a closing date here.`
}

function documentsAnswer(t: string): string {
  if (/admission|offer\s*letter/i.test(t)) {
    return `**Admission / offer letter upload**\n\n1. Sign **in** at ${SITE} (do not create a second account).\n2. Open the profile / documents page on ${PORTAL}.\n3. Upload a clear scan or photo of the **same** letter your school issued. Crop extra wallpaper; keep the name and JAMB / matric visible.\n4. If the field is missing, your school may not have uploaded you yet, ask the campus NELFUND desk, then ticket ${ESUPPORT} with a screenshot of the empty field (not the letter itself in chat).\n\nExact required files only exist on the live form.`
  }
  if (/passport|photo|picture/i.test(t)) {
    return `**Passport photograph**\n\n1. Use a recent clear headshot on a plain background.\n2. Upload only where ${PORTAL} shows a photo field.\n3. If upload fails, compress the image and retry on the **same** account.\n4. Locked field → ticket ${ESUPPORT} with the error text, not the photo.`
  }
  if (/signature/i.test(t)) {
    return `**Signature upload**\n\n1. Sign on white paper, photo it in good light, crop extra space.\n2. Upload on ${PORTAL} only.\n3. Fail → smaller file, same login at ${SITE}.\n4. Still blocked → ${ESUPPORT}.`
  }
  if (/upload/i.test(t)) {
    return `**Upload will not go**\n\n1. Stay on the official portal: ${PORTAL}\n2. Use a smaller, clearer file (PDF or JPG as the form asks).\n3. Do not open a second account to retry.\n4. Exact error text → ticket ${ESUPPORT}. I will not invent extra documents.`
  }
  return `**Typical portal profile items** (confirm live on the portal):\n• NIN and BVN\n• JAMB registration number\n• Admission / matric details\n• Bank account for upkeep if you apply for it.\n\nExact document list can change, use ${PORTAL} and FAQ: ${FAQ}. Do not email BVN/NIN to strangers.`
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string {
  const t = (ctx.userText || '').trim()

  if (intent === 'eligibility') return eligibilityAnswer({ userText: t })

  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp or Telegram portal links.\n\nIf you pasted a long error, say whether it is login, pending, JAMB, or missing school.`
  }

  if (intent === 'what-is-nelfund') {
    return `**Why NELFUND was created:** the Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary institutions can get **interest-free** loans for school charges and living costs. Official aim is access to higher education, not a grant.\n\n**What it is:** institutional charges go **to the school**; optional **monthly upkeep** goes **to the student**.\n\nIt is a **loan**, not a scholarship. Official FAQ: repayment starts **2 years after NYSC** (10% of salary / profit).\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'pending-application') {
    const extra = playbookPendingExtras(t)
    if (extra) return extra
    return `**How far / pending / money never enter** is not a rejection.\n\nDo this now:\n1. Open ${PORTAL} and copy the exact status word (Pending, Under review, Approved, Declined).\n2. Check whether your school has uploaded your record. If the school is missing, ask the campus NELFUND desk first.\n3. Upkeep can arrive after the institution is paid. Look at the portal before assuming nobody paid you.\n4. Still the same after a long wait? Ticket: ${ESUPPORT} with your name, school, and the portal status word.\n\nI cannot see your personal file and I will not invent a pay date.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile (no extra spaces or letters).\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. If the portal says *invalid JAMB number format*, fix the number and retry, do not create a second account.\n4. Still failing? Ticket: ${ESUPPORT} and keep a screenshot.\n\nPortal: ${PORTAL}`
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/why\s+(was|is|dem|they|una|fg|government)|purpose|wetin\s*(be|mean|nelfund|make)|what\s*(is|does)\s*(this\s+)?nelfund|nelfund\s+(mean|meaning|purpose)|na\s+wetin/i.test(t)) {
      return playbookAnswer('what-is-nelfund', ctx)
    }
    return `For **live** open/closed and dates, use the home status card and ${PORTAL}.\n\nI only report what official pages support. I will not invent a closing date.\n\nSign **up** and loan window are different. Confirm on ${PORTAL} / ${SITE}.`
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
    return `**Loan, not scholarship.** NELFUND is an interest-free student **loan** under the Students Loans Act. It is not a grant and not free money.\n\n1. School charges go to your **institution**.\n2. Upkeep (only if you ticked it in the same application) goes to **your** bank account.\n3. Official FAQ: repayment starts **2 years after NYSC** (10% of salary or profit).\n4. Do not pay an agent to convert it to a scholarship.\n\nFAQ: ${FAQ} · Portal: ${PORTAL} · Site: ${SITE}`
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    const school = ctx.institutionName ? ` You mentioned **${ctx.institutionName}**.` : ''
    return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND's public-institution list.${school}\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}\n\nPrivate institutions are not in the current public-institution scheme described on nelf.gov.ng.`
  }

  if (intent === 'how-to-apply') {
    return howToApplyText(t)
  }

  if (intent === 'portal-login') {
    return playbookPortalLogin(t)
  }

  if (intent === 'scam-safety') {
    return `**Scam warning:** NELFUND does **not** collect application fees through WhatsApp, Telegram, or random agents.\n\n• Only use ${SITE} and ${PORTAL}\n• Never send OTP, BVN, or NIN to private numbers\n• Support ticket: ${ESUPPORT}\n\nIf someone asked you to pay to process a loan, stop and use the official portal only.`
  }

  if (intent === 'documents-needed') {
    return documentsAnswer(t)
  }

  if (intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return playbookAnswer('what-is-nelfund', ctx)
  }

  if (intent === 'rejected-application') {
    return `**Declined / rejected** is a portal decision, not something I can reverse here.\n\n1. Open ${PORTAL} and copy the **exact** status word and any reason shown.\n2. Typical fixable causes: school has not uploaded your data, JAMB / NIN / BVN mismatch, or a private institution that is outside the public scheme.\n3. Do **not** open a second account. Correct the profile on the same login: ${SITE}\n4. If no reason is shown, ticket ${ESUPPORT} with name, school, JAMB number, and a screenshot of that status page.\n\nI will not invent why *your* file was declined.`
  }

  if (intent === 'reapplication') {
    return `**Apply again / next cycle**\n\n1. Use the **same** account at ${SITE}. Do not create a second profile.\n2. A new request only works when the portal shows an open loan / session button.\n3. Confirm school data is uploaded before you click Request for Student Loan.\n4. Live open/closed is only on ${PORTAL} and ${SITE}. I will not invent a reopening date.\n\nTicket if the button never appears: ${ESUPPORT}`
  }

  if (intent === 'academic-session') {
    return `**Which session / year** is set by what your school uploaded and what the portal lists.\n\n1. Open ${PORTAL} after sign-in and use the session the dropdown actually shows.\n2. If no session appears, that is usually missing school data, not a secret second form.\n3. Ask the school NELFUND desk whether your record is on the current upload.\n4. I will not invent which session is open. Confirm live on ${SITE}.`
  }

  if (intent === 'refund') {
    return `**Already paid school fees / refund**\n\n1. Institutional charges from NELFUND go **to the school**, not back through this chat.\n2. If you paid the school yourself first, ask the **school bursary / NELFUND desk** how they treat that session. Policy is institution-side.\n3. Keep receipts and the portal status screenshot.\n4. I will not promise a refund amount or date. Ticket only if the portal itself shows an error: ${ESUPPORT}`
  }

  if (intent === 'bank-information' || intent === 'profile-update') {
    return `**Change bank / profile**\n\n1. Sign **in** at ${SITE}. Do not create another account.\n2. Edit the field the portal allows (bank for upkeep, phone, email).\n3. Use a real bank account for upkeep, not a wallet, if that is what the form asks.\n4. Never paste account number, BVN, or NIN here. If the field is locked, ticket ${ESUPPORT} with a screenshot of the locked page only.`
  }

  if (intent === 'nin-verification') {
    return `**NIN / BVN will not verify**\n\n1. Type NIN and BVN exactly as issued. No extra spaces.\n2. The names should match what JAMB and your school uploaded.\n3. Do not open a second account to bypass a failed verify.\n4. Still failing? Ticket ${ESUPPORT} with the exact error text (not the numbers themselves).\n\nPortal: ${PORTAL}`
  }

  if (intent === 'guarantor') {
    return `Official student-facing pages describe NIN, BVN, JAMB, and school data. They do **not** list a separate guarantor form on ${SITE}.\n\nIf a portal field asks for a next of kin or similar, fill only what the live form shows. Anyone asking you to pay a guarantor agent is a scam. Ticket: ${ESUPPORT}`
  }

  if (intent === 'readiness' || intent === 'institution-verification') {
    return `**School / readiness check**\n\n1. You must be in a **public** university, poly, COE, or vocational school on NELFUND's list.\n2. The school must upload your record before Request for Student Loan works.\n3. If the school name is missing, that is a school-desk issue first, then ${ESUPPORT}.\n\nLive list and status: ${PORTAL}`
  }

  if (intent === 'institutional-charges') {
    return playbookAnswer('school-fees', ctx)
  }

  if (intent === 'contact-lookup') {
    return playbookAnswer('contact-support', ctx)
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
