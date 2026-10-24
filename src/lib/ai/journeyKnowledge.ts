/**
 * Offline candidate v5 — post-application journey knowledge
 * Institutional amount vs school fees, Verified status, Pay School, upkeep linkage.
 *
 * Use the portal and institution for account-specific steps. Do not infer hidden
 * processing rules from a status label or an isolated screenshot phrase.
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
  'A **Verified** label is a portal status; it does **not** by itself confirm that money has reached your school or your account.\n\n' +
  'If the Institutional Loans row also shows **Action Required** or **Pay School**, read the exact portal prompt and follow only the steps shown there. The text in a screenshot does not establish what happens next or whether a transfer completed.\n\n' +
  `1. Log in: ${LOGIN_URL}\n` +
  '2. Open **☰ → Loans** and check the relevant Institutional and Upkeep rows.\n' +
  '3. If the next step is unclear, do not submit a duplicate request. Ask campus bursary whether the school received funds, or contact official support with the exact wording and a screenshot.\n\n' +
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
  '• Check the Upkeep row separately; this guide cannot confirm its processing sequence or payment date.\n' +
  '• Email “Loan Verified” confirms verification of that request, not that cash has already landed.\n\n' +
  '**Check next**\n' +
  `1. ${LOGIN_URL} → ☰ → Loans → Institutional and Upkeep tabs.\n` +
  '2. If **Action Required** / **Pay School** appears, read the exact portal instruction; do not assume it proves a transfer.\n' +
  '3. Confirm bank details under Profile → Account Details if upkeep is expected.\n' +
  '4. Ask campus bursary whether institutional funds have been received for your session.\n\n' +
  `No progress after portal steps: ${ESUPPORT} (attach screenshots). I will not invent processing days.`

export const BOTH_VERIFIED =
  '**Both institutional and upkeep show Verified**\n\n' +
  'Both requests are verified on the portal. That still does **not** mean:\n' +
  '• the school has already received institutional funds, or\n' +
  '• upkeep has already been paid into your account.\n\n' +
  'If either row shows **Action Required**, read that row’s exact portal instruction. This guide cannot confirm whether one loan’s processing depends on the other.\n\n' +
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

export const PAY_SCHOOL_REAPPLICATION =
  '**Pay School during reapplication**\n\n' +
  'I cannot verify the exact effect of **Pay School** during reapplication from the public NELFUND information available to this guide. A click or status label alone does not confirm that your school has been credited.\n\n' +
  'Read the portal confirmation carefully, then check **☰ → Loans** for the resulting status. Ask your school bursary whether funds were received. If the portal does not explain the result, contact official support with a screenshot. Do not submit a duplicate request just to check.\n\n' +
  `Portal: ${PORTAL}\nLogin: ${LOGIN_URL}`

export const UPKEEP_TIMING =
  '**Upkeep timing**\n\n' +
  'I cannot verify a fixed start month or whether upkeep disbursement must follow tuition / institutional-fee payment progress. Applying or seeing a status label does not confirm a bank-credit date.\n\n' +
  'Check the Upkeep row in **☰ → Loans** and follow any instructions shown there. If the status is unclear or unchanged, ask your campus NELFUND desk or contact official support with a screenshot.\n\n' +
  `Login: ${LOGIN_URL}\nPortal: ${PORTAL}`

export const JAMB_WAIT_FOR_MATRIC =
  '**JAMB registration number vs Matriculation Number**\n\n' +
  'I cannot verify that applying with a JAMB registration number before a matriculation upload causes faculty or department errors. Use the identifiers and fields the official portal requests; do not guess or enter a different number.\n\n' +
  'If your school record is missing or the portal reports a problem, ask your campus NELFUND, registry, or ICT desk to check the record for your session. If they confirm it is uploaded but the portal still cannot verify it, contact official support with the exact error and a screenshot.\n\n' +
  `Portal: ${PORTAL}\nLogin: ${LOGIN_URL}\nSupport: ${ESUPPORT}`

export const MISSING_INFO_SCHOOL_UPLOAD =
  '**Missing information**\n\n' +
  'This message alone does not establish the cause. It can be related to a student record that is missing or not matched, but it can also require checking the portal details and session.\n\n' +
  '1. Check the exact field or instruction shown, and confirm your institution, programme, and session details.\n' +
  '2. Ask your campus NELFUND, registry, or ICT desk to confirm your record for the session.\n' +
  '3. If the school says it has uploaded the record, refresh or sign in again and retry verification. If it remains missing, contact official support with the exact wording and screenshot.\n' +
  'Do not pay agents or use unofficial “fix” sites.\n\n' +
  `Portal: ${PORTAL}\nLogin: ${LOGIN_URL}\nSupport: ${ESUPPORT}`

/**
 * Match post-application / amount / Pay School questions.
 * Returns null if no high-confidence match (caller falls through).
 */
export function matchJourneyKnowledge(text: string): { intent: string; text: string; evidence: string } | null {
  const t = (text || '').trim()
  if (!t) return null

  if (
    /pay\s*school/i.test(t) &&
    /re-?apply|reapplication|new\s*(academic\s*)?session|another\s*session|next\s*session|instant|immediately|credit\s*(my\s*)?school/i.test(
      t,
    )
  ) {
    return { intent: 'reapplication', text: PAY_SCHOOL_REAPPLICATION, evidence: 'conditional+screenshot' }
  }

  if (
    /upkeep/i.test(t) &&
    /(october|november|start\s*(dropping|paying|coming)|when\s*(will|does)\s*upkeep|upkeep\s*(timing|begin|start|disburs)|after\s*(tuition|school\s*fees?|institutional)\s*(is\s*)?paid)/i.test(
      t,
    )
  ) {
    return { intent: 'upkeep', text: UPKEEP_TIMING, evidence: 'conditional' }
  }

  if (
    /jamb\s*(reg|registration|number)|apply.{0,40}jamb|jamb.{0,40}apply/i.test(t) &&
    /(matric|wait|upload|avoid|rush|department|faculty|school\s*(has\s*)?not\s*(yet\s*)?uploaded)/i.test(t)
  ) {
    return { intent: 'how-to-apply', text: JAMB_WAIT_FOR_MATRIC, evidence: 'conditional' }
  }

  if (/missing\s*information/i.test(t)) {
    return { intent: 'missing-information', text: MISSING_INFO_SCHOOL_UPLOAD, evidence: 'conditional' }
  }

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
