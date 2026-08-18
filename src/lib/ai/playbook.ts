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

/** Avoid repeating the same core explanation in one conversation. */
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

  // —— What is NELFUND ——
  if (
    intent === 'what-is-nelfund' ||
    /what\s*is\s*nelfund|explain\s*nelfund|about\s*nelfund|wetin\s*be\s*nelfund|how\s*nelfund\s*work/i.test(t)
  ) {
    if (n > 0 && /repay|loan|scholarship|free/i.test(t)) {
      return `NELFUND is a **loan**, not a scholarship or free money.\n\n• **Institutional charges** are paid to your school, not into your pocket.\n• **Upkeep** is living support when approved — this guide treats **₦20,000/month** as current unless ${SITE} changes it.\n• You repay after studies under official rules.\n\nOverview: ${SITE} · FAQ: ${FAQ}`
    }
    if (n > 0 && /how|work|process|apply|step/i.test(t)) {
      return `**How NELFUND works (process)**\n\n1. School holds your admission + student data (JAMB, NIN, matric when available).\n2. You create/sign in only on ${PORTAL}\n3. You apply when that **loan/upkeep window** is officially open (check ${SITE}).\n4. Institutional charges go to the school; upkeep (if approved) follows official rules.\n5. If the portal shows **missing information**, fix records with school ICT/Registry first.\n\nSupport tickets: ${ESUPPORT}`
    }
    return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nIt helps eligible students in public Nigerian tertiary institutions with:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when that component applies)\n\nIt is a **loan you repay**, not a grant. Pathways include universities, polytechnics, colleges of education, and other covered public institutions — confirm on ${SITE}.\n\n**How it works in practice**\n• Your school must have your student record in order (admission, JAMB, matric, etc.).\n• You create/login on ${PORTAL}\n• You apply only when that **application window** is officially open.\n• Support tickets: ${ESUPPORT}\n\nAsk next: how to apply, missing information, BVN, upkeep, or whether applications are open.`
  }

  // —— Current / open / deadline / BVN timing ——
  if (
    intent === 'current-information' ||
    intent === 'deadline' ||
    intent === 'academic-session' ||
    (/bvn/i.test(t) && /(expire|deadline|registr|account|apply|yet|don'?t|dont|no\s*bvn|when)/i.test(t)) ||
    /expire|deadline|open\s*now|still\s*open|closing|2026\s*\/?\s*2027|is\s*nelfund\s*(open|closed)/i.test(t)
  ) {
    if (/bvn/i.test(t) && /(expire|deadline|registr|account|apply|yet|don'?t|dont|no\s*bvn|when)/i.test(t)) {
      if (n >= 1 && ctx.lastAssistant && /bvn|account creation|portal\.nelf/i.test(ctx.lastAssistant)) {
        return `Still on the **BVN vs registration** point:\n\n• Sort BVN with your **bank** when you can.\n• You can often still create/prepare your account on ${PORTAL} while you wait.\n• The **loan application window** only opens when NELFUND officially announces it on ${SITE} — this guide will not invent that date.\n\nTell me whether you are stuck on **account creation** or waiting for the **loan window**.`
      }
      return `You do **not** need to panic about BVN right now.\n\nThe NELFUND account creation path on ${PORTAL} is separate from whether the **loan/upkeep application window** is open.\n\n• You can create your account and prepare while you sort BVN with your bank.\n• A deadline notice about a **previous** loan/upkeep cycle that already closed is **not** the same as “you can never register again.”\n• The next 2026/2027 loan and upkeep window opens only when NELFUND **officially announces** it — this assistant will not invent opening or closing dates.\n\n**What to do next**\n1. Try account setup on ${PORTAL} if available\n2. Sort BVN with your bank\n3. Watch official updates on ${SITE}\n\nOnly ${SITE} and ${PORTAL} are authoritative for opening/closing dates.`
    }
    if (n >= 1 && ctx.lastAssistant && /nelf\.gov|portal\.nelf/i.test(ctx.lastAssistant)) {
      return `Same rule still applies: **only** ${SITE} and ${PORTAL} define whether applications are open today.\n\nI will not invent a closing date. Tell me if you are stuck on **account creation**, **loan application**, **BVN**, or **missing information**.`
    }
    return `**Current application status (how to check — not a guessed date)**\n\nNELFUND opening and closing dates **change by cycle**. This assistant does not invent dates.\n\n**Reliable sources only:**\n• Official site: ${SITE}\n• Student portal: ${PORTAL}\n• FAQ: ${FAQ}\n\n**Do not mix these up:**\n• Account creation ≠ loan application still open\n• A closed *previous* session notice ≠ “you can never create an account”\n• Social media “deadlines” are unofficial until they match nelf.gov.ng or the portal\n\nSay what you are trying to do (create account, apply for loan, sort BVN, missing information) and I will guide that path.`
  }

  // —— Missing information ——
  if (intent === 'missing-information' || /missing\s*(info|information)|no\s*school\s*info|e\s*dey\s*show\s*missing/i.test(t)) {
    if (n >= 1 && ctx.institutionName) {
      return `For **${ctx.institutionName}**, missing information almost always means the portal cannot match your student record yet.\n\n**Do this next:**\n1. Contact **ICT / Registry / NELFUND desk** — confirm name, NIN, JAMB, and matric were uploaded correctly.\n2. Retry ${PORTAL} after they confirm.\n3. If school says upload is done but the portal still fails → ${ESUPPORT} (no passwords/OTP).\n\nSay **“draft the email”** for a school message.`
    }
    if (n >= 1) {
      return `Still on missing information${instLine(ctx)}.\n\nI need your **school name**, or say **“draft the email”** / **“contact NELFUND”**.\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    return `**Missing information** usually means NELFUND cannot match your details to a school record yet (name, NIN, JAMB, or matric).\n\n**Not** automatically a permanent rejection.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry ${PORTAL}\n4. Still failing after school confirms → ${ESUPPORT}\n\nWhich school do you attend?`
  }

  // —— Pending ——
  if (intent === 'pending-application') {
    if (asksHowLong) {
      return `There is **no single official “X days” number** this guide can invent for every pending case.\n\nPending means processing is still open. Times vary by verification stage and school.\n\n**Practical approach**\n• Exact status text on ${PORTAL}\n• Ask school NELFUND desk if anything waits on them${instLine(ctx)}\n• Far longer than your school expects → ${ESUPPORT} with screenshots (no passwords)`
    }
    if (n >= 1) {
      return `If your **application** is still pending${instLine(ctx)}, processing can take time. Dashboard **“Pending Loans”** is **not** your personal status.\n\n• Exact status on ${PORTAL}\n• School verification complete?\n• Long stuck → ${ESUPPORT}\n\nWhat exact status text do you see?`
    }
    return `**Pending** usually means still processing — not automatically rejected.\n\n• Personal pending ≠ dashboard “Pending Loans” counters\n• Schools may still need to finish institutional steps\n\n**Next**\n1. Exact status on ${PORTAL}\n2. School NELFUND desk${instLine(ctx)}\n3. ${ESUPPORT} if it stays stuck\n\nTell me your school and exact status wording if you can.`
  }

  // —— How to apply ——
  if (intent === 'how-to-apply' || /how\s*(do\s*i|to)\s*apply|start\s*(my\s*)?application/i.test(t)) {
    if (n >= 1) {
      return `Next application detail${instLine(ctx)}:\n\n• Portal only: ${PORTAL}\n• Confirm the window is open on ${SITE} before treating the form as this cycle’s loan application\n• **Missing information** → fix school records first\n\nWhat step are you on (account, profile, school list, or submit)?`
    }
    return `**How to apply (nationwide)**\n\n1. Admission into a covered public institution + IDs (JAMB, NIN; BVN for banking)\n2. Create / sign in only at ${PORTAL}\n3. Complete profile and verification steps\n4. Apply for loan/upkeep **only when that window is officially open** (${SITE})\n5. School must have matching data — fix missing information with the school first\n\nNo paid agents. No OTP/password sharing.\n\n${SITE} · ${FAQ} · ${ESUPPORT}`
  }

  // —— Upkeep / disbursement ——
  if (intent === 'upkeep' || (asksMoney && /upkeep|20k|allowance/i.test(t))) {
    if (asksMoney) {
      return `**When money arrives** depends on approval and official disbursement — this guide will not invent your personal credit date.\n\n• Institutional charges → paid to the **school**\n• Upkeep → only if approved, then per NELFUND rules\n• Confirmed upkeep figure here: **₦20,000/month** unless ${SITE} changes it\n\nCheck ${PORTAL}. Approved but nothing moves after school/NELFUND desk expects it → ${ESUPPORT}.`
    }
    return `**Upkeep** is living support (separate from school charges paid to the institution).\n\n• Confirmed figure on this guide: **₦20,000 per month**, unless official pages change it\n• Only when approved and disbursement rules are met\n• Ignore WhatsApp ₦25k claims unless ${SITE} or ${PORTAL} confirms\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
  }

  if (asksMoney && (intent === 'unknown' || intent === 'current-information')) {
    return `**Payment timing** is controlled by approval and official disbursement — not by this chat.\n\n• School charges → to the **institution**\n• Upkeep → only if approved\n• Status: ${PORTAL}\n• Approved but stuck → ${ESUPPORT}\n\nI will not invent a personal credit date.`
  }

  // —— Institution verification ——
  if (intent === 'institution-verification') {
    return `Students **cannot** open a private NELFUND “upload log.”\n\n**Signals**\n• Missing information / no school data → record may not be matched yet\n• Ask **ICT / Registry / NELFUND desk** about name, NIN, JAMB, matric\n• School confirms upload but portal fails → ${ESUPPORT}\n\nPortal: ${PORTAL}${ctx.institutionName ? `\n\n**${ctx.institutionName}** — say “draft the email” for a school message.` : '\n\nTell me your school name for more specific guidance.'}`
  }

  // —— JAMB ——
  if (intent === 'jamb-verification') {
    return `If the portal **rejects or will not accept your JAMB number**:\n\n1. Re-type from your JAMB slip (no spaces/extra digits)\n2. Confirm the same number is what your **school** uploaded\n3. Direct Entry still needs a valid JAMB registration number\n4. Slip + school match but portal fails → ${ESUPPORT}\n\nPortal: ${PORTAL}\nDo not paste full JAMB numbers in random chats.`
  }

  // —— NIN ——
  if (intent === 'nin-verification' || (/\bnin\b/i.test(t) && /fail|reject|not|verif|match|work|invalid/i.test(t))) {
    return `If **NIN verification** fails:\n\n1. Enter NIN exactly as on NIMC/NIN slip (no spaces)\n2. Name and DOB on NELFUND profile must match NIN\n3. Temporary system issues happen — retry if digits are correct\n4. Still failing → ${ESUPPORT}\n\nPortal: ${PORTAL}\nDo not share full NIN in this chat.`
  }

  // —— Eligibility ——
  if (intent === 'eligibility') {
    return `**Who can apply (official direction)**\n\nAdmission into covered **public** Nigerian tertiary institutions (universities, polytechnics, colleges of education, and other categories NELFUND lists), with identity and admission proof (including JAMB where required).\n\n**Denial risks** include prior loan default with a licensed financial institution, fraudulent documents, and serious issues listed on official FAQ.\n\nIncomplete school records can **block verification** even if you are otherwise eligible.\n\n${FAQ} · ${SITE}`
  }

  // —— School fees ——
  if (intent === 'school-fees' || intent === 'institutional-charges') {
    return `**Institutional charges** are generally paid **to the school**, not as cash to you.\n\nUpkeep (if approved) is separate living support.\n\nConfirm coverage on ${PORTAL} and with bursary/NELFUND desk${instLine(ctx)}.\n\nSite: ${SITE}`
  }

  // —— Repayment / GSI ——
  if (intent === 'repayment' || intent === 'gsi') {
    return `NELFUND is a **loan**. Repayment generally starts after a grace period following programme completion — confirm on ${SITE}.\n\n**GSI** can support recovery via bank instructions. This guide will not invent rates or exact deduction schedules.\n\n${PORTAL} · ${SITE}`
  }

  // —— Portal / official ——
  if (
    intent === 'portal-login' ||
    intent === 'official-sources' ||
    /which\s*(link|site|website|url).*login|where\s*(do\s*i|to)\s*(login|apply)/i.test(t)
  ) {
    return `Use **only** the official student portal:\n\n${PORTAL}\n\nPublic info: ${SITE}\nFAQ: ${FAQ}\nSupport: ${ESUPPORT}\n\nNever use third-party login links. Never share OTP, password, or PIN.`
  }

  // —— Contact ——
  if (intent === 'contact-support' || /contact\s*nelfund|nelfund\s*support|customer\s*care/i.test(t)) {
    return `**Contact NELFUND**\n\n• Tickets: ${ESUPPORT}\n• Portal: ${PORTAL}\n• Site: ${SITE}\n\nSchool-side records → ICT / Registry / NELFUND desk first${instLine(ctx)}.\n\nNo passwords or OTP.`
  }

  // —— Loan vs scholarship ——
  if (intent === 'loan-or-scholarship') {
    return `NELFUND is a **student loan**, not a scholarship or free money. Approved funding creates a repayment obligation under official rules.\n\n${SITE}`
  }

  // —— Documents / readiness ——
  if (intent === 'documents-needed' || intent === 'readiness') {
    return `**Typically prepare** (confirm on the portal):\n• Admission / school details\n• JAMB registration number\n• NIN\n• Matriculation number when issued\n• Bank details + BVN for banking steps\n\nStart: ${PORTAL}\nSchool must upload matching records for verification to succeed.\n\nFAQ: ${FAQ}`
  }

  // —— Scam ——
  if (intent === 'scam-safety') {
    return `**Safety**\n\n• Only ${PORTAL} and ${SITE}\n• Never pay an “agent” to approve a loan\n• Never share OTP, password, PIN, full BVN/NIN with strangers\n• Official tickets: ${ESUPPORT}`
  }

  // —— Rejected ——
  if (intent === 'rejected-application') {
    return `If the portal shows **rejected / declined**, note the **exact reason** on ${PORTAL}.\n\n• Some issues are fixable (data mismatch) with school + portal rules\n• Some relate to eligibility/documents on ${FAQ}\n\nDo not pay anyone to “reverse” rejection. ${ESUPPORT} + school NELFUND desk with evidence only.`
  }

  // —— School not found ——
  if (intent === 'school-not-found') {
    return `If your **school does not appear**:\n\n1. Full official name (not only abbreviation)\n2. Ask school if they submit data to NELFUND for your programme\n3. Retry ${PORTAL} after they confirm\n4. School says live but still missing → ${ESUPPORT}\n\nTell me the full official institution name.`
  }

  // —— Bank / BVN fail ——
  if (intent === 'bank-information') {
    if (/don'?t|dont|no\s*bvn|yet|expire|deadline/i.test(t)) {
      return playbookAnswer('current-information', ctx)
    }
    return `Bank / BVN problems are usually mismatches or incomplete banking steps.\n\n• Confirm BVN is linked to that account (via your bank)\n• Re-enter details carefully on ${PORTAL}\n• Account in your name where required\n• Do not share full BVN here\n• Still failing after bank confirmation → ${ESUPPORT}`
  }

  // —— Refund ——
  if (intent === 'refund') {
    return `If you **already paid school fees** before NELFUND:\n\nRefund/credit handling is between **your institution** and NELFUND processes — no invented automatic amount here.\n\n• Keep receipts\n• Bursary / NELFUND desk at school${instLine(ctx)}\n• Then ${ESUPPORT} if you need a tracked NELFUND ticket`
  }

  // —— Profile update ——
  if (intent === 'profile-update') {
    return `To **update profile / account information**, use only ${PORTAL} where edit options exist.\n\n• Correct fields the portal allows\n• Save and re-run related verification\n• Do not pay third parties to “edit NELFUND for you”\n\nIf edits are blocked, note the exact message → ${ESUPPORT}.`
  }

  // —— Guarantor ——
  if (intent === 'guarantor') {
    return `Whether a **guarantor** is required depends on **current** portal rules — this guide will not invent a permanent yes/no for every student.\n\nCheck requirements during application on ${PORTAL} and notes on ${SITE} / ${FAQ}.`
  }

  // —— Reapplication ——
  if (intent === 'reapplication') {
    return `If you need to **apply again**:\n\n1. Read rejection/failure reason on ${PORTAL}\n2. Fix data mismatches with your school if needed\n3. Re-apply only when the portal allows it for an **open** cycle (${SITE})\n4. Avoid endless duplicate submissions\n\nSupport: ${ESUPPORT}`
  }

  // —— Create account ——
  if (/create\s*(an?\s*)?account|still\s*(create|register|sign\s*up)|can\s*i\s*(still\s*)?(create|register)/i.test(t)) {
    return `**Account creation** ≠ **loan application**.\n\n• Try ${PORTAL} — if it lets you open an account, you can proceed even while a previous application cycle is closed\n• Loan/upkeep only when that window is officially open\n• Deadlines only from ${SITE}, not social media\n\nIf account creation shows a specific error, paste it or upload a screenshot.`
  }

  return null
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const lines = [
    `I already covered the main point for this${instLine(ctx)}.`,
    '',
    'Pick a **different** next action so we do not repeat the same answer:',
    '• “draft the email” to your school or NELFUND',
    '• Share your **school name** for contacts',
    '• Paste the **exact portal message**',
    '• Ask about **upkeep**, **how to apply**, **BVN**, or **whether applications are open**',
    '',
    `Portal: ${PORTAL}`,
    `Support: ${ESUPPORT}`,
  ]
  if (intent === 'current-information' || intent === 'deadline') {
    lines.splice(
      3,
      0,
      '• Clarify **account creation** vs **loan application window**',
      '• Ask about **BVN timing** if that is the blocker',
    )
  }
  return lines.join('\n')
}
