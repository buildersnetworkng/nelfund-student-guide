/**
 * Portal UI knowledge from official portal.nelf.gov.ng
 * (student views before and after apply). Ground answers only.
 */
export const SITE = 'https://nelf.gov.ng/'
export const PORTAL = 'https://portal.nelf.gov.ng/'
export const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
export const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Menu items on the student portal (hamburger = three lines). */
export const PORTAL_MENU =
  '**Portal menu (☰ three lines, top-left after login)**\n\n' +
  '• **Home** — dashboard, session notice, loan counts, help cards\n' +
  '• **Loans** — Institutional Loans + Upkeep Loans history (View / Cancel)\n' +
  '• **Disputes** — Fee Disputes (when fee shown ≠ your real school charges)\n' +
  '• **Profile** — Personal, Contact, Educational, Account Details (BVN / bank)\n' +
  '• **Settings** — Change Password\n' +
  '• **Log out**\n\n' +
  `Open only at ${LOGIN_URL}`

export const WHERE_TO_APPLY =
  '**Where do I apply for the loan?**\n\n' +
  `Only on the official student portal:\n` +
  `• Portal / start: ${PORTAL}\n` +
  `• Login: ${LOGIN_URL}\n` +
  `• Public site (info only): ${SITE}\n\n` +
  'There is no separate WhatsApp or agent application. After login: **☰ (three lines) → Loans** to see requests, or use the apply / request flow when your school session is open on Home.'

export const APPLY_WALKTHROUGH =
  '**How to apply (portal walk-through)**\n\n' +
  `1. Open ${PORTAL} — create account (new) or **log in** if you already registered.\n` +
  `2. Login page: ${LOGIN_URL}\n` +
  '3. Complete **Profile** (Personal, Contact, Educational, Account Details: NIN, JAMB, **BVN**, bank). For 2026/2027 re-enter BVN/bank when asked.\n' +
  '4. On **Home**, confirm your institution session is open (not “institution has not opened a session”).\n' +
  '5. Start **Request for Student Loan** / apply when the portal allows it.\n' +
  '6. Choose **institutional (school fees)** and/or optional **upkeep** (paid to you; fees go to the school).\n' +
  '7. When the system shows an institutional fee amount:\n' +
  '   • If it **matches** what your bursary confirms → continue.\n' +
  '   • If it **does not match** → use **Raise a dispute** / Fee Disputes **before** you submit. Enter the correct figure; the school must confirm. **Whatever the school finally confirms is the fee loan amount.**\n' +
  '8. Upload required documents (e.g. admission letter, ID) when the portal asks — do not skip and hope to find the step later without checking Loans/Profile again.\n' +
  '9. Review → **Submit**. Do not submit twice.\n' +
  '10. After submit, **☰ → Loans**: Institutional and/or Upkeep rows should show **Pending** (normal while processing).\n\n' +
  `Stuck: campus NELFUND desk, then ticket ${ESUPPORT}.`

export const CANCEL_LOAN =
  '**How to cancel a loan application**\n\n' +
  `1. Log in: ${LOGIN_URL}\n` +
  '2. Tap the **☰ three-line menu** (top-left).\n' +
  '3. Tap **Loans**.\n' +
  '4. Open **Institutional Loans** (school fees) and/or **Upkeep Loans**.\n' +
  '5. Scroll to the loan row / status (**Pending** or similar).\n' +
  '6. Use **View** / **Cancel** where available.\n' +
  '7. Confirm **Yes, Cancel Loan** only if you are sure.\n\n' +
  '**Portal warning (important):**\n' +
  '• Cancelling the **institutional / school-fees** loan also cancels **upkeep** if you have one.\n' +
  '• **Cannot be undone.**\n' +
  '• You can cancel while the application is still **pending** (or verified) and **nothing has been disbursed** (no fees paid to school, no upkeep to your account).\n' +
  '• Once approved and paid out, full cancellation is not available.\n\n' +
  '**After a successful cancel (no money released):** you are **not** permanently barred — you can start a **new** application on the same account, still meeting eligibility.\n\n' +
  `If Cancel does not complete or status stays stuck: ticket ${ESUPPORT} (Loan Application / cancellation), with name, NIN, screenshots.`

export const FEE_WRONG_NO_DISPUTE =
  '**Fee on the portal is not my real school fees (and I already submitted)**\n\n' +
  '1. First confirm the **exact** current-session charges with your school bursary / student affairs / NELFUND focal officer — not rumours.\n' +
  '2. If still **Pending** and **nothing disbursed**:\n' +
  '   • You **can cancel** (☰ → Loans → Cancel → Yes) then **re-apply**.\n' +
  '   • On the new application, when the fee is shown, use **Raise a dispute** / Fee Disputes if it still does not match.\n' +
  '3. If Cancel fails or status is stuck: ticket https://nelfund.esupport.ng/create asking to cancel the pending application so you can re-apply with the correct fee; attach screenshots.\n' +
  '4. After re-apply, monitor Pending → Verified → Approved → Disbursed. Institutional fees go to the **school**; optional upkeep (e.g. ₦20,000/month if offered and selected) goes to **your** bank — confirm figures only on the portal.\n\n' +
  'The loan is not an open “request any amount up to ₦300k” — it follows **school-confirmed** obligatory charges + optional upkeep.'

export const REAPPLY_AFTER_CANCEL =
  '**Can I apply again after cancelling?**\n\n' +
  '**Yes**, if the application was still **pending** (or verified) and **no funds were released**. Cancellation does not permanently disqualify you.\n\n' +
  `1. Log in on the same account: ${LOGIN_URL}\n` +
  '2. Start a **new** loan request when the session allows.\n' +
  '3. Use **Raise a dispute** if the displayed school fee ≠ bursary figure.\n' +
  '4. Institution verification may run again.\n' +
  '5. Keep cancellation confirmation screenshots and any ticket numbers.\n\n' +
  'Once any part is **disbursed**, you are a beneficiary under repayment rules — full cancel is no longer the path.'

export const UPKEEP_AFTER_FEES_ONLY =
  '**I only applied for school fees — how do I add / reopen upkeep?**\n\n' +
  '1. Log in → **☰ → Loans**. Refresh if a step disappeared after you cancelled part of the flow.\n' +
  '2. Check **Upkeep Loans** tab and Home counters. If upkeep was never submitted, you may need to start or continue a request that includes upkeep when the portal still offers it for this session.\n' +
  '3. If you cancelled a flow because documents (admission letter, ID) were not ready: complete **Profile** / upload steps when they reappear, then open **Loans** again.\n' +
  '4. Bank details sometimes need to be re-linked; after saving bank, the portal may show upkeep options again — stay on Loans and refresh.\n' +
  '5. You generally **cannot** “bolt on” upkeep after institutional is already far along if the portal no longer shows the option; some students cancel (while pending, no disbursement) and re-apply selecting **both**, or ticket support.\n\n' +
  `Login: ${LOGIN_URL}\nTicket: ${ESUPPORT}`

export const INSTITUTION_SESSION =
  '**“Your institution has not opened a session for loan applications yet”**\n\n' +
  'This appears on **Home** when the national window can already be open, but **your school** has not opened its loan session.\n\n' +
  'You will typically see Total / Approved / Pending / Declined Loans all at **0**, and empty Institutional / Upkeep history.\n\n' +
  '1. Contact your **campus NELFUND / registry / student affairs desk**.\n' +
  '2. **Profile Completed 100%** does **not** fix this — the block is school-side.\n' +
  '3. Keep checking Home after the school confirms.\n' +
  `4. Still stuck: ticket ${ESUPPORT} with a screenshot.\n\n` +
  'Do not pay anyone to “open” a session.'

export const OPEN_SESSION_NOTICE =
  '**Active Session notice on Home**\n\n' +
  'When your school session is active you may see:\n' +
  '• Active Session: **2026/2027**\n' +
  '• Notice: 2026/2027 Session Registration starts **23 September 2026** and ends **31 December 2026**\n' +
  '• “You will not be able to apply for a loan this session after the end date.”\n\n' +
  `Login: ${LOGIN_URL}`

export const FEE_DISPUTES =
  '**Fee Disputes (☰ menu → Disputes)**\n\n' +
  'Official idea:\n' +
  'You question the school fee shown. Your school either agrees with your figure or supplies the correct one. **Whichever amount they confirm is the amount you get as the institutional loan.**\n\n' +
  'Best practice: raise the dispute **while applying**, **before Submit**, if the fee shown does not match bursary.\n\n' +
  'If you already submitted with a wrong fee and nothing is disbursed: cancel (if still pending) → re-apply → dispute on the new application.\n\n' +
  `Login: ${LOGIN_URL}`

export const PROFILE_BVN_BANK =
  '**Profile → Account Details (BVN & bank)**\n\n' +
  '☰ → **Profile** → tabs: Personal · Contact · Educational · **Account Details**.\n\n' +
  '• Profile can show **Completed 100%** even while loans are still pending.\n' +
  '• Fields: **BVN**, **Bank Name**, **Bank Account Number** (often partially masked).\n' +
  '• **Reset Account Details** may have limited attempts per session — use carefully.\n' +
  '• For 2026/2027, re-enter BVN and bank when the portal asks.\n' +
  `Login: ${LOGIN_URL}`

export const CHANGE_PASSWORD =
  '**Change password**\n\n' +
  '☰ → **Settings** → **Click to Change Password** (while logged in).\n\n' +
  'If you cannot sign in, use **Forgot password** on the login page.\n' +
  `Login: ${LOGIN_URL}`

export const DASHBOARD_BEFORE =
  '**Home before you apply**\n\n' +
  '• Total / Approved / Pending / Declined often **0**\n' +
  '• Possible message that the institution has not opened a session\n' +
  '• Empty School Loan History and Personal History\n' +
  `Login: ${LOGIN_URL}`

export const DASHBOARD_AFTER =
  '**Home / Loans after you apply**\n\n' +
  'Typical after submitting institutional and/or upkeep:\n' +
  '• **Total Loans** can show 2 (one institutional + one upkeep)\n' +
  '• **Pending Loans** can show 2 while both are processing\n' +
  '• **Approved** and **Declined** stay 0 until processed\n\n' +
  '**Institutional Loans** tab → School Loan History:\n' +
  '• Date, Status **Pending**, Loan Type **Institutional Fee**, session **2026-2027**\n' +
  '• Actions: **View** and often **Cancel**\n\n' +
  '**Upkeep Loans** tab → Personal History:\n' +
  '• Date, Status **Pending**, Loan Type **Upkeep**, session **2026-2027**\n' +
  '• Actions: **View** (Cancel may not always show)\n\n' +
  'Pending means submitted and still processing — **not** declined.\n' +
  `Login: ${LOGIN_URL}`

export const LOANS_TABS =
  '**Loans page (☰ → Loans)**\n\n' +
  '• **Institutional Loans** — school fees component (to the school)\n' +
  '• **Upkeep Loans** — optional stipend (to your account)\n' +
  'Use **View** for details; **Cancel** on institutional when still pending and no disbursement.\n' +
  `Login: ${LOGIN_URL}`

export const HELP_CARDS =
  '**Help on the portal**\n\n' +
  'Home may show help cards (FAQs, how to apply, contact). For real account problems use official tickets only.\n' +
  `Portal: ${PORTAL}\nLogin: ${LOGIN_URL}\nTicket: ${ESUPPORT}`

export const WALLET =
  '**Wallet / balances on the portal**\n\n' +
  'Any wallet or repaid amount display is account-specific. For application status, prefer **Home** counters and **☰ → Loans**.\n' +
  `Login: ${LOGIN_URL}`

/**
 * Match free text / OCR to a grounded portal knowledge block.
 */
export function matchPortalKnowledge(text: string): { intent: string; text: string } | null {
  const t = (text || '').trim()
  if (!t) return null

  if (/where\s*(do\s*i\s*|to\s*)?apply|which\s*(site|website|link|portal)|where\s*(is\s*)?(the\s*)?(loan\s*)?application/i.test(t)) {
    return { intent: 'how-to-apply', text: WHERE_TO_APPLY }
  }
  if (
    /how\s*(do\s*i\s*|to\s*)?cancel|cancel\s*(my\s*)?(loan|application)|should\s*i\s*cancel|can\s*i\s*cancel|why\s*(can'?t|cannot)\s*i\s*cancel|after\s*cancel.*apply|re-?apply\s*after\s*cancel|cancel.*re-?apply/i.test(
      t,
    )
  ) {
    if (/re-?apply|apply\s*again|after\s*cancel/i.test(t)) {
      return { intent: 'pending-application', text: CANCEL_LOAN + '\n\n' + REAPPLY_AFTER_CANCEL }
    }
    if (/wrong\s*(fee|amount)|not\s*(my\s*)?(real|exact)\s*(fee|school)|didn'?t\s*raise\s*dispute|fee\s*(is\s*)?(wrong|incorrect)/i.test(t)) {
      return { intent: 'pending-application', text: FEE_WRONG_NO_DISPUTE + '\n\n' + CANCEL_LOAN }
    }
    return { intent: 'pending-application', text: CANCEL_LOAN }
  }
  if (
    /wrong\s*(fee|amount)|fee\s*(shown|on\s*(the\s*)?portal)\s*(is\s*)?(not|≠)|not\s*(my\s*)?(exact|real)\s*school\s*fees?|didn'?t\s*(raise\s*)?(a\s*)?dispute|raise\s*(a\s*)?dispute|fee\s*dispute/i.test(
      t,
    )
  ) {
    return { intent: 'pending-application', text: FEE_WRONG_NO_DISPUTE + '\n\n' + FEE_DISPUTES }
  }
  if (
    /only\s*(applied\s*)?(for\s*)?(school\s*)?fees?|reopen\s*upkeep|add\s*upkeep|upkeep\s*(only|again|after)|applied\s*(for\s*)?school\s*fees?\s*only|how\s*(can\s*i\s*)?(get|open|apply)\s*upkeep/i.test(
      t,
    )
  ) {
    return { intent: 'upkeep', text: UPKEEP_AFTER_FEES_ONLY }
  }
  if (/how\s*(do\s*i\s*|to\s*)?apply|steps?\s*to\s*apply|apply\s*walk|three\s*line|hamburger|☰/i.test(t)) {
    return { intent: 'how-to-apply', text: APPLY_WALKTHROUGH }
  }
  if (/institution has not opened|has not opened a session|session for loan applications yet/i.test(t)) {
    return { intent: 'pending-application', text: INSTITUTION_SESSION }
  }
  if (/active\s*session|2026\/2027\s*session\s*registration|23\s*september|31\s*december/i.test(t)) {
    return { intent: 'current-information', text: OPEN_SESSION_NOTICE }
  }
  if (/fee\s*dispute|raise\s*a\s*dispute|dispute\s*(fee|amount)|fee\s*(looks?|is)\s*wrong|wrong\s*(fee|amount)/i.test(t)) {
    return { intent: 'pending-application', text: FEE_DISPUTES }
  }
  if (/bvn|bank\s*(detail|account)|reset\s*account\s*details|account\s*details/i.test(t)) {
    return { intent: 'bank-information', text: PROFILE_BVN_BANK }
  }
  if (/change\s*password|settings/i.test(t) && /portal|menu|logged\s*in/i.test(t)) {
    return { intent: 'password-reset', text: CHANGE_PASSWORD }
  }
  if (/portal\s*menu|three\s*line|hamburger|what\s*(is\s*on|are)\s*(the\s*)?menu|where\s*is\s*(disputes|settings|profile|loans)/i.test(t)) {
    return { intent: 'contact-support', text: PORTAL_MENU }
  }
  if (/wallet|in\s*wallet|total\s*loan\s*amount|balance\s*date|amount\s*repaid/i.test(t)) {
    return { intent: 'pending-application', text: WALLET }
  }
  if (/pending|after\s*(i\s*)?apply|loan\s*history|school\s*loan\s*history|personal\s*history|view\s*or\s*cancel/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_AFTER }
  }
  if (/institutional\s*loans\s*tab|upkeep\s*loans\s*tab|☰\s*→\s*loans|menu\s*→\s*loans/i.test(t)) {
    return { intent: 'pending-application', text: LOANS_TABS }
  }
  if (/how\s*to\s*apply\s*\?|read\s*faqs|help\s*and\s*support|get\s*in\s*touch/i.test(t)) {
    return { intent: 'contact-support', text: HELP_CARDS }
  }
  if (/total\s*loans|approved\s*loans|declined\s*loans|dashboard/i.test(t) && /empty|zero|0|before\s*apply|nothing|no\s*loan/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_BEFORE }
  }
  return null
}
