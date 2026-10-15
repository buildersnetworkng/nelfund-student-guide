/**
 * Offline candidate v5 — post-application journey knowledge
 * Institutional amount vs school fees, Verified status, Pay School, upkeep linkage.
 *
 * Evidence classes:
 * - OFFICIAL: nelf.gov.ng FAQ / terms (loan amount = institutional charge logged on portal;
 *   institutional remitted to school; upkeep to student; apply both for upkeep eligibility)
 * - SCREENSHOT: student portal UI (Action Required + Pay School; Verified on Institutional
 *   and Upkeep; linked upkeep not processed if Pay School not used)
 * - CONDITIONAL: guidance when fees unknown / higher than portal amount — verify with
 *   institution + portal; not a universal guarantee
 *
 * Do not invent deadlines, fixed national fee amounts, or post-Pay-School steps not observed.
 */

export const PORTAL = 'https://portal.nelf.gov.ng/'
export const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
export const ESUPPORT = 'https://nelfund.esupport.ng/create'
export const SITE = 'https://nelf.gov.ng/'

/** Core distinction: portal institutional amount ≠ always full school bill */
export const AMOUNT_VS_FEES =
  '**Institutional loan amount vs your school fees**\n\n' +
  'These are not always the same number.\n\n' +
  '• **NELFUND institutional amount** is what the portal shows for your school fees loan for that session. Official policy: the amount is as verified and logged on your portal account, based on the institution’s charges.\n' +
  '• **Your school’s actual fees** may be higher, lower, not yet published, or confirmed later by bursary.\n' +
  '• **Applying / Verified / Pay School / school receiving money / you clearing a balance** are different steps — one does not prove the others.\n\n' +
  '**If you do not know the exact school fees yet**\n' +
  'You may still use the institutional amount shown on the portal to continue, **subject to live portal rules and your school’s process**. Confirm with bursary / campus NELFUND desk when the fee schedule is available.\n\n' +
  '**If actual fees are higher than the institutional loan**\n' +
  'NELFUND covers the institutional amount logged on the portal. The **difference** (any remaining balance) is typically paid to the **school** by the student unless your school or NELFUND states otherwise. Confirm the fee schedule and payment rules with the institution — do not assume a refund or automatic top-up.\n\n' +
  '**If the portal amount looks wrong**\n' +
  '1. Confirm session, institution, and programme with bursary.\n' +
  '2. Before Submit (while still pending): use **Raise a dispute** / Fee Disputes if the shown fee ≠ bursary figure.\n' +
  '3. After verification, follow portal instructions (e.g. **Pay School**) and ask the school how balances are handled.\n\n' +
  `Portal: ${PORTAL}\n` +
  `Support ticket: ${ESUPPORT}`

/** Verified + Pay School (screenshot-backed portal behaviour) */
export const PAY_SCHOOL_VERIFIED =
  '**Status: Verified — what it means**\n\n' +
  '**Verified** on an institutional (school) loan means NELFUND has verified that loan request. It does **not** by itself mean the school has already received the money or that upkeep has been paid to you.\n\n' +
  '**Action Required / Pay School**\n' +
  'When the portal shows a banner like: *Your school loan has been verified. Click "Pay School" to send it to your institution* — you still need to use **Pay School** on the **Institutional Loans** row so the institutional fee can be sent to the school.\n\n' +
  'The same banner may warn: if you do not, **neither** this institutional loan **nor** your linked upkeep loan will be processed.\n\n' +
  '**What to do**\n' +
  `1. Log in: ${LOGIN_URL}\n` +
  '2. Open **☰ → Loans → Institutional Loans**.\n' +
  '3. Find the **Verified** institutional fee row for the correct session.\n' +
  '4. Tap **Pay School** and complete only the steps the official portal shows.\n' +
  '5. Recheck **Institutional** and **Upkeep** status after.\n\n' +
  '**Upkeep also shows Verified**\n' +
  'Verification of upkeep does not prove money is already in your account. Upkeep is linked to institutional processing in the portal warning above. Check status on the portal; do not invent pay dates.\n\n' +
  `Only use ${PORTAL}. Do not use unofficial “pay on my behalf” links.\n` +
  `Stuck after following the portal: ${ESUPPORT}`

export const PAY_SCHOOL_NO_AMOUNT =
  '**Pay School is visible but no amount is shown**\n\n' +
  'A **Pay School** button alone does not prove a correct payment amount is ready.\n\n' +
  '1. Open **View** on that loan row and note session, loan type, and any amount.\n' +
  '2. Confirm institution and academic session match your real registration.\n' +
  '3. If amount is missing or looks wrong, **do not invent** a figure — check bursary and the portal, then use official support if needed.\n' +
  '4. Only complete **Pay School** when the official portal instructions are clear.\n\n' +
  `Portal: ${LOGIN_URL}\nSupport: ${ESUPPORT}`

export const VERIFIED_NO_MONEY =
  '**Loan shows Verified but I have not received money**\n\n' +
  '**Verified ≠ disbursed to you.**\n\n' +
  '• **Institutional loan** goes to the **school**, not your personal account. After verification you may still need **Pay School** so the school can receive it.\n' +
  '• **Upkeep** goes to the bank account on your profile, but only after the portal’s processing rules are met (including any link to institutional Pay School).\n' +
  '• Email “Loan Verified” confirms verification of that request, not that cash has already landed.\n\n' +
  '**Check next**\n' +
  `1. ${LOGIN_URL} → ☰ → Loans → Institutional and Upkeep tabs.\n` +
  '2. Look for **Action Required** / **Pay School** on institutional.\n' +
  '3. Confirm bank details under Profile → Account Details if upkeep is expected.\n' +
  '4. Ask campus bursary whether institutional funds have been received for your session.\n\n' +
  `No progress after portal steps: ${ESUPPORT} (attach screenshots). I will not invent processing days.`

export const BOTH_VERIFIED =
  '**Both institutional and upkeep show Verified**\n\n' +
  'Both requests are verified on the portal. That still does **not** mean:\n' +
  '• the school has already received institutional funds, or\n' +
  '• upkeep has already been paid into your account.\n\n' +
  'If **Pay School** / **Action Required** appears on Institutional Loans, complete that step first. The portal may block processing of linked upkeep until institutional is sent to the school.\n\n' +
  `Then recheck both tabs on ${PORTAL}. Support: ${ESUPPORT}`

export const WAIT_OR_PROCEED_FEES =
  '**Wait for the school fee update, or proceed with the portal amount?**\n\n' +
  'Official framing: the institutional loan amount is what is verified and logged on your portal account for that institution.\n\n' +
  '• If the portal already shows an institutional amount and allows you to continue, you may proceed **subject to live portal rules**.\n' +
  '• Actual school fees can still differ; a balance may remain for you to settle with the school.\n' +
  '• If your bursary has not published fees yet, ask them when the schedule will be ready and whether they expect you to use the portal amount for now.\n' +
  '• Do not pay third parties to “fix” the amount.\n\n' +
  `Confirm live on ${PORTAL}. School-side questions → campus bursary / NELFUND desk. NELFUND process issues → ${ESUPPORT}`

export const PERSONAL_BALANCE =
  '**Do I pay the remaining school fees myself?**\n\n' +
  'If your institution’s total charges are higher than the institutional amount logged on the NELFUND portal, you may need to pay the difference directly to the school under the school’s normal fee rules.\n\n' +
  'This guide cannot set a naira figure or promise a refund. Confirm:\n' +
  '1. Official fee schedule from bursary for your programme and session.\n' +
  '2. How much NELFUND institutional funding is shown on your portal for that session.\n' +
  '3. How the school records NELFUND payments vs student balances.\n\n' +
  `Portal: ${PORTAL}\nSupport (NELFUND process): ${ESUPPORT}`

export const CONFLICTING_INFO =
  '**Portal and school say different things**\n\n' +
  'Treat them as two checkpoints:\n' +
  '• **Portal** — application status, Verified / Pay School, institutional vs upkeep rows.\n' +
  '• **School (bursary / NELFUND desk)** — official fee schedule, whether funds were received, student balance.\n\n' +
  'Do not assume one screen overrides the other without checking both. Share your tracking ID / session with campus staff when asking if institutional funds arrived.\n\n' +
  `Portal only: ${PORTAL}\nNELFUND help form: ${ESUPPORT}`

/**
 * Match post-application / amount / Pay School questions.
 * Returns null if no high-confidence match (caller falls through).
 */
export function matchJourneyKnowledge(text: string): { intent: string; text: string; evidence: string } | null {
  const t = (text || '').trim()
  if (!t) return null

  // Pay School / Action Required / verified institutional payment step
  if (
    /pay\s*school|pay\s*school\s*fees?|action\s*required|click\s*["']?pay\s*school|send\s*it\s*to\s*(your\s*)?institution|linked\s*upkeep/i.test(
      t,
    )
  ) {
    if (/no\s*amount|amount\s*(not|isn'?t|missing)|button\s*(but\s*)?no/i.test(t)) {
      return { intent: 'pending-application', text: PAY_SCHOOL_NO_AMOUNT, evidence: 'screenshot+conditional' }
    }
    return { intent: 'pending-application', text: PAY_SCHOOL_VERIFIED, evidence: 'screenshot' }
  }

  // Verified status / email verified / both verified
  if (
    /loan\s*(has\s*been\s*)?verified|status\s*[:\s]*verified|\bverified\b|\bverify\b.*\b(loan|institutional|upkeep)|both\s*(loans?\s*)?verified|don\s*verify/i.test(
      t,
    )
  ) {
    if (/both|institutional.{0,60}upkeep|upkeep.{0,60}institutional/i.test(t)) {
      if (/no\s*(money|payment|disburs)|not\s*(receive|received|get|seen)|haven'?t\s*(got|received)|nothing/i.test(t)) {
        return { intent: 'pending-application', text: BOTH_VERIFIED, evidence: 'screenshot' }
      }
      return { intent: 'pending-application', text: BOTH_VERIFIED, evidence: 'screenshot' }
    }
    if (/no\s*(money|payment|disburs|upkeep)|not\s*(receive|received|get|seen)|haven'?t\s*(got|received)|nothing/i.test(t)) {
      return { intent: 'pending-application', text: VERIFIED_NO_MONEY, evidence: 'screenshot+official' }
    }
    return { intent: 'pending-application', text: PAY_SCHOOL_VERIFIED, evidence: 'screenshot' }
  }

  // Amount vs fees / wrong amount / fees higher / unknown fees
  if (
    /fee\s*(amount|shown)|portal\s*amount|institutional\s*(loan\s*)?amount|amount\s*(on\s*)?(the\s*)?portal|amount\s*(for\s*)?nelfund|school\s*fees?\s*(higher|more|exceed|differ|not\s*match|no\s*match|wrong)|not\s*(my\s*)?(real|exact)\s*(school\s*)?fees?|don'?t\s*know\s*(the\s*)?(exact\s*)?fees?|do\s*not\s*know\s*(the\s*)?(exact\s*)?fees?|fees?\s*(not\s*)?(published|out\s*yet|unknown)|balance\s*(to\s*)?pay|pay\s*(the\s*)?(rest|remaining|difference|balance)|exact\s*school\s*fees/i.test(
      t,
    )
  ) {
    if (/pay\s*(the\s*)?(rest|remaining|difference|balance)|balance\s*(myself|personally)/i.test(t)) {
      return { intent: 'pending-application', text: PERSONAL_BALANCE, evidence: 'conditional+official' }
    }
    if (/wait\s*(for\s*)?(the\s*)?(school|fee)|proceed|use\s*(the\s*)?portal\s*amount/i.test(t)) {
      return { intent: 'pending-application', text: WAIT_OR_PROCEED_FEES, evidence: 'conditional+official' }
    }
    return { intent: 'pending-application', text: AMOUNT_VS_FEES, evidence: 'official+conditional' }
  }

  // Conflicting portal vs school
  if (/portal.{0,30}(school|bursary|institution).{0,30}(different|conflict|disagree)|(school|bursary).{0,30}portal.{0,30}(different|conflict)/i.test(t)) {
    return { intent: 'pending-application', text: CONFLICTING_INFO, evidence: 'conditional' }
  }

  // Verified but no money (without explicit verified word patterns already caught)
  if (
    /approved|verified/.test(t) === false &&
    /institutional.{0,20}(no\s*money|not\s*paid)|upkeep.{0,20}(not\s*(come|arrive|paid|received)|no\s*money)/i.test(t)
  ) {
    return { intent: 'pending-application', text: VERIFIED_NO_MONEY, evidence: 'screenshot+official' }
  }

  return null
}
