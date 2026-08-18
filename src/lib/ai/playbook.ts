/**
 * Offline NELFUND intelligence playbook.
 * Government-grade, no external LLM required.
 * Answers are situational, multi-turn aware, and never invent official dates.
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
  const a = prev.toLowerCase().replace(/\s+/g, ' ').slice(0, 120)
  const b = next.toLowerCase().replace(/\s+/g, ' ').slice(0, 120)
  if (a === b) return true
  let same = 0
  const wa = new Set(a.split(' ').filter((w) => w.length > 3))
  const wb = b.split(' ').filter((w) => w.length > 3)
  for (const w of wb) if (wa.has(w)) same += 1
  return wb.length > 8 && same / wb.length > 0.72
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const t = ctx.userText.toLowerCase()
  const n = ctx.turnIndex

  // —— What is NELFUND ——
  if (intent === 'what-is-nelfund' || /what\s*is\s*nelfund|explain\s*nelfund|about\s*nelfund/i.test(t)) {
    if (n > 0 && /repay|loan|scholarship|free/i.test(t)) {
      return `NELFUND is a **loan**, not a scholarship or free money.\n\n• **Institutional charges** (school-related charges) are paid to your school, not into your pocket.\n• **Upkeep** (living support) is a separate component when approved — currently guided as **₦20,000/month** unless official pages change it.\n• You repay after studies under official repayment rules.\n\nOfficial overview: ${SITE} and ${FAQ}`
    }
    return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nIt helps eligible students in public Nigerian tertiary institutions with:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when that component applies)\n\nIt is a **loan you repay**, not a grant. Eligible pathways include universities, polytechnics, colleges of education, and other covered public institutions — always confirm coverage on ${SITE}.\n\n**How it works in practice**\n• Your school must have your student record in order (admission, JAMB, matric, etc.).\n• You create/login on ${PORTAL}\n• You apply only when that **application window** is officially open.\n• Support tickets: ${ESUPPORT}\n\nAsk me anything next: how to apply, missing information, BVN, upkeep, or whether applications are open.`
  }

  // —— Current / open / deadline / expire / BVN timing ——
  if (
    intent === 'current-information' ||
    intent === 'deadline' ||
    intent === 'academic-session' ||
    /bvn|expire|deadline|when\s*will|open\s*now|still\s*open|closing|2026|2027/i.test(t)
  ) {
    if (/bvn/i.test(t) && /expire|deadline|registr|account|apply/i.test(t)) {
      return `You do **not** need to panic about BVN right now.\n\n**Separate these three things:**\n\n1. **NELFUND account creation** on ${PORTAL} — you can often create your account and prepare your profile while you sort BVN through your bank.\n2. **Loan / upkeep application window** — only open during an **officially announced** period. A notice about a *previous* cycle that already closed is **not** the same as “you can never register again.”\n3. **BVN** — needed for banking steps. Not having BVN yet should not stop you from reading official guidance and starting account setup if the portal allows it.\n\nThis guide **will not invent** the next 2026/2027 opening or closing date. When NELFUND announces it, it appears on ${SITE} and ${PORTAL} — not on random WhatsApp dates.\n\n**What to do next**\n• Try account creation on ${PORTAL} if available\n• Sort BVN with your bank\n• Watch ${SITE} for the next official application window`
    }
    if (n >= 1 && ctx.lastAssistant && /nelf\.gov|portal\.nelf/i.test(ctx.lastAssistant)) {
      return `Still the same rule: **only** ${SITE} and ${PORTAL} define whether applications are open today.\n\nI will not invent a closing date. If you tell me whether you are stuck on **account creation**, **loan application**, or **BVN**, I can give the exact next step for that situation.`
    }
    return `**Current application status (how to check — not a guessed date)**\n\nNELFUND opening and closing dates **change by cycle**. This assistant does not invent dates.\n\n**Reliable sources only:**\n• Official site: ${SITE}\n• Student portal: ${PORTAL}\n• FAQ: ${FAQ}\n\n**Do not mix these up:**\n• Account creation ≠ loan application still open\n• A closed *previous* session notice ≠ “you can never create an account”\n• Social media “deadlines” are unofficial until they match nelf.gov.ng or the portal\n\nIf you say what you are trying to do (create account, apply for loan, sort BVN, missing information), I will guide that path.`
  }

  // —— Missing information ——
  if (intent === 'missing-information') {
    if (n >= 1 && ctx.institutionName) {
      return `For **${ctx.institutionName}**, missing information almost always means the portal cannot match your student record yet.\n\n**Do this next:**\n1. Contact **ICT / Registry / NELFUND desk** at your school — ask them to confirm name, NIN, JAMB, and matric were uploaded correctly.\n2. Retry ${PORTAL} after they confirm.\n3. If school says upload is done but the portal still fails → open a ticket at ${ESUPPORT} (no passwords/OTP).\n\nI can draft a short message to your school — say **“draft the email”**.`
    }
    if (n >= 1) {
      return `Still on missing information${instLine(ctx)}.\n\nI need your **school name** to point you to the right office, or say **“draft the email”** / **“contact NELFUND”**.\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    return `**Missing information** on the portal usually means NELFUND cannot match your details to a school record yet (name, NIN, JAMB, or matric).\n\n**What this is not:** it is not automatically a permanent rejection.\n\n**Next steps**\n1. Tell me your institution so guidance is specific.\n2. Ask school ICT / Registry / NELFUND desk to confirm your record was uploaded correctly.\n3. Retry ${PORTAL}\n4. If school confirms upload but portal still fails → ${ESUPPORT}\n\nWhich school do you attend?`
  }

  // —— Pending application ——
  if (intent === 'pending-application') {
    if (n >= 1) {
      return `If your **application** is still pending${instLine(ctx)}, processing can take time after submission. Dashboard counters labelled “Pending Loans” are **not** the same as your personal application status.\n\n**Useful checks**\n• Re-open ${PORTAL} and note the exact status text under your application\n• Confirm your school finished any verification steps they handle\n• If it stays pending far beyond what your school/NELFUND desk expects → ${ESUPPORT}\n\nWhat exact status text do you see?`
    }
    return `**Pending** usually means your application is still being processed — not automatically rejected.\n\nImportant:\n• Personal application “pending” ≠ dashboard tile “Pending Loans” (those are summary counters)\n• Schools sometimes still need to complete institutional steps\n\n**Next**\n1. Check the exact status line on ${PORTAL}\n2. Ask your school NELFUND desk if any action is waiting on them\n3. Escalate with evidence only via ${ESUPPORT} if it stays stuck\n\nTell me your school and the exact status wording if you can.`
  }

  // —— How to apply ——
  if (intent === 'how-to-apply') {
    return `**How to apply (nationwide process)**\n\n1. Confirm you have admission into a covered public institution and basic IDs (JAMB, NIN; BVN for banking steps).\n2. Create / sign in on the official portal only: ${PORTAL}\n3. Complete profile and verification steps the portal shows.\n4. Apply for the **loan/upkeep session only when that window is officially open** (check ${SITE}).\n5. Your school must have submitted matching student data — if you see missing information, fix records with the school first.\n\nNever use third-party “agents” or share OTP/password.\n\nOfficial info: ${SITE} · FAQ: ${FAQ} · Support: ${ESUPPORT}`
  }

  // —— Upkeep ——
  if (intent === 'upkeep') {
    return `**Upkeep** is the living-support component of NELFUND (separate from school charges paid to the institution).\n\n• The figure this guide currently treats as confirmed is **₦20,000 per month**, unless official pages publish a change.\n• You only receive upkeep when that component is approved for your application and disbursement rules are met.\n• Do not rely on WhatsApp figures of ₦25k or other amounts unless ${SITE} or ${PORTAL} confirms them.\n\nCheck your portal status on ${PORTAL}. Questions about missing disbursement → school NELFUND desk, then ${ESUPPORT}.`
  }

  // —— Institution verification / upload ——
  if (intent === 'institution-verification') {
    return `Students **cannot** open a private NELFUND “upload log” for their school.\n\n**Practical signals**\n• Portal still shows missing information / no school data → record may not be matched yet\n• Ask **ICT / Registry / NELFUND desk** whether they submitted your name, NIN, JAMB, and matric correctly\n• If the school confirms upload but the portal still fails → ${ESUPPORT} with clear evidence (no passwords)\n\nPortal: ${PORTAL}${ctx.institutionName ? `\n\nYou mentioned **${ctx.institutionName}** — I can help draft a message to that school if you say “draft the email”.` : '\n\nTell me your school name for more specific contact guidance.'}`
  }

  // —— JAMB ——
  if (intent === 'jamb-verification') {
    return `If the portal **rejects or will not accept your JAMB number**:\n\n1. Re-type carefully from your JAMB slip (no spaces or extra digits).\n2. Confirm the same JAMB number is what your **school** has on file for NELFUND upload.\n3. Direct Entry students still need a valid JAMB registration number in the NELFUND flow.\n4. If school data and your slip match but the portal still fails → ${ESUPPORT}\n\nPortal: ${PORTAL}\nDo not send full JAMB numbers in random chats — keep them for official forms only.`
  }

  // —— Eligibility ——
  if (intent === 'eligibility') {
    return `**Who can apply (official direction)**\n\nStudents with admission into covered **public** Nigerian tertiary institutions (universities, polytechnics, colleges of education, and other categories NELFUND lists) may apply, with proof covering identity and admission details (including JAMB where required).\n\n**Denial / risk areas** include prior loan default with a licensed financial institution, fraudulent documents, and serious disciplinary/criminal issues listed on official FAQ pages.\n\nIncomplete school records can **block verification** even when you are otherwise eligible.\n\nAlways confirm current rules on ${FAQ} and ${SITE}.`
  }

  // —— School fees ——
  if (intent === 'school-fees' || intent === 'institutional-charges') {
    return `**School / institutional charges** under NELFUND are generally paid **to the institution**, not as cash to the student.\n\nUpkeep (if approved) is the separate living-support component.\n\nExact coverage depends on your approval and what NELFUND + your school process for that cycle — confirm on ${PORTAL} and with your school bursary/NELFUND desk.\n\nOfficial site: ${SITE}`
  }

  // —— Repayment / GSI ——
  if (intent === 'repayment' || intent === 'gsi') {
    return `NELFUND is a **loan**. Repayment generally starts after a grace period following programme completion — confirm current rules on ${SITE}.\n\n**GSI** (Global Standing Instruction) is a recovery mechanism that can link to bank accounts for repayment. Treat detailed mechanics as official-only; this guide will not invent rates or exact deduction schedules.\n\nPortal: ${PORTAL} · Site: ${SITE}`
  }

  // —— Portal login ——
  if (intent === 'portal-login' || intent === 'official-sources') {
    return `Use **only** the official student portal:\n\n${PORTAL}\n\nPublic information: ${SITE}\nFAQ: ${FAQ}\nSupport tickets: ${ESUPPORT}\n\nNever log in on third-party links. Never share OTP, password, or PIN in chat.`
  }

  // —— Contact support ——
  if (intent === 'contact-support') {
    return `**Contact NELFUND**\n\n• Tracked support: ${ESUPPORT}\n• Portal: ${PORTAL}\n• Website: ${SITE}\n\nFor school-side record problems, contact your institution’s ICT / Registry / NELFUND desk first${instLine(ctx)}.\n\nNo passwords or OTP in any message.`
  }

  // —— Loan vs scholarship ——
  if (intent === 'loan-or-scholarship') {
    return `NELFUND is a **student loan**, not a scholarship and not free money. Institutional charges and upkeep (when approved) create a repayment obligation under official rules.\n\nMore: ${SITE}`
  }

  // —— Documents ——
  if (intent === 'documents-needed') {
    return `**Typically needed** (confirm live on the portal):\n• Admission / school details\n• JAMB registration number\n• NIN\n• Matriculation number when issued\n• Bank details and BVN for banking steps\n\nStart on ${PORTAL}. Your school must also have matching records uploaded for verification to succeed.`
  }

  // —— Scam ——
  if (intent === 'scam-safety') {
    return `**Safety**\n\n• Only ${PORTAL} and ${SITE}\n• NELFUND will not ask you to pay an “agent” to approve a loan\n• Never share OTP, password, PIN, or full BVN/NIN in WhatsApp with strangers\n• Report suspicious pages and use ${ESUPPORT} for official tickets`
  }

  // —— Rejected ——
  if (intent === 'rejected-application') {
    return `If the portal shows **rejected / declined** for your application, note the exact reason text on ${PORTAL}.\n\n• Some issues are fixable (data mismatch) with school + reapplication rules\n• Some relate to eligibility or document problems listed on ${FAQ}\n\nDo not pay anyone to “reverse” a rejection. Use ${ESUPPORT} and your school NELFUND desk with evidence only.`
  }

  // —— School not found ——
  if (intent === 'school-not-found') {
    return `If your **school does not appear** on the portal:\n\n1. Confirm the official institution name spelling\n2. Ask your school whether they are onboarded / submitting data to NELFUND for your programme\n3. Retry ${PORTAL} later after the school confirms\n4. Escalate via ${ESUPPORT} if the school says they are live but you still cannot select them\n\nTell me the full official name of your institution.`
  }

  // —— Bank / BVN verification fail ——
  if (intent === 'bank-information') {
    return `Bank / BVN problems are usually data mismatches or incomplete banking steps.\n\n• Confirm BVN is linked to the account you are using (via your bank)\n• Re-enter account details carefully on ${PORTAL}\n• Do not share full BVN in this chat\n• If the portal still fails after bank confirmation → ${ESUPPORT}`
  }

  // —— Refund / already paid fees ——
  if (intent === 'refund') {
    return `If you **already paid school fees** before NELFUND support:\n\nFee reconciliation / refund policy is handled between **your institution** and NELFUND processes — this guide will not invent a refund amount or automatic guarantee.\n\nSpeak with your **bursary / NELFUND desk** at school, keep receipts, and use ${ESUPPORT} if you need a tracked NELFUND ticket after the school advises next steps.`
  }

  return null
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  return `I already covered the main point for this${instLine(ctx)}.\n\nPick a next action:\n• “draft the email” to your school or NELFUND\n• Share your **school name** for contacts\n• Paste the **exact portal message**\n• Ask about **upkeep**, **how to apply**, or **whether applications are open**\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
}
