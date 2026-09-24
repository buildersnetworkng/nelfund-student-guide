/**
 * Portal UI knowledge from official portal.nelf.gov.ng
 * (student views before and after apply). Ground answers only.
 */
export const SITE = 'https://nelf.gov.ng/'
export const PORTAL = 'https://portal.nelf.gov.ng/'
export const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
export const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Menu items on the student portal (hamburger). */
export const PORTAL_MENU =
  '**Portal menu (after login)**\n\n' +
  '• **Home** — dashboard, session notice, loan counts, help cards\n' +
  '• **Loans** — Institutional Loans + Upkeep Loans history\n' +
  '• **Disputes** — Fee Disputes\n' +
  '• **Profile** — Personal, Contact, Educational, Account Details (BVN / bank)\n' +
  '• **Settings** — Change Password\n' +
  '• **Log out**\n\n' +
  `Open only at ${LOGIN_URL}`

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
  '**Fee Disputes (menu → Disputes)**\n\n' +
  'Official portal text:\n' +
  '“These are the school fees you have questioned. Your school will either agree with the amount you entered, or give the correct one. **Whichever amount they confirm is the amount you get as a loan.**”\n\n' +
  'If you have not raised one: “You have not raised any fee dispute. You can raise one when applying for a loan, if the fee shown does not look right.”\n\n' +
  'Columns: Session · Fee shown · You said · Agreed fee · Status · Raised.\n\n' +
  `Login: ${LOGIN_URL}`

export const PROFILE_BVN_BANK =
  '**Profile → Account Details (BVN & bank)**\n\n' +
  'Menu → **Profile** → tabs: Personal · Contact · Educational · **Account Details**.\n\n' +
  '• Profile can show **Completed 100%** even while loans are still pending.\n' +
  '• Fields: **BVN**, **Bank Name**, **Bank Account Number** (often partially masked).\n' +
  '• Button: **Reset Account Details** — portal may show limited attempts, e.g. “You have only **1 account reset attempt** left for 2026 Academic session.”\n' +
  '• Use carefully; do not waste the last reset attempt.\n' +
  '• For 2026/2027, re-enter BVN and bank when the portal asks.\n' +
  `Login: ${LOGIN_URL}`

export const CHANGE_PASSWORD =
  '**Change password**\n\n' +
  'Menu → **Settings** → **Click to Change Password** (while logged in).\n\n' +
  'If you cannot sign in, use **Forgot password** on the login page.\n' +
  `Login: ${LOGIN_URL}`

export const DASHBOARD_BEFORE =
  '**Home before you can apply**\n\n' +
  '• Total / Approved / Pending / Declined often **0**\n' +
  '• Message that the institution has not opened a session\n' +
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

export const WALLET =
  '**Wallet Balance / loan amounts on Home**\n\n' +
  'You may see a **Wallet Balance** card:\n' +
  '• Institution Loan amount (school-specific; example on one account was ₦270,000 — **not** a universal figure)\n' +
  '• Upkeep amount (can be ₦0 if not selected or not yet funded)\n' +
  '• Status chip such as **In Wallet**\n\n' +
  'Another card may show **Total Loan Amount**, Balance Date, Amount Repaid (can be ₦0 / N/A / Paid when nothing is outstanding yet).\n\n' +
  'I will not invent your personal amounts — read them only on the portal after login.\n' +
  `Login: ${LOGIN_URL}`

export const LOANS_TABS =
  '**Loans page**\n\n' +
  'Menu → **Loans**.\n' +
  '• **Institutional Loans** → School Loan History (institutional fee)\n' +
  '• **Upkeep Loans** → Personal History (upkeep)\n\n' +
  'After apply, pending rows show date, status, loan type, academic session, View (and Cancel on institutional when available).'

export const HELP_CARDS =
  '**Help cards on Home**\n\n' +
  '• **How to Apply?** — learn more on how to apply\n' +
  '• **Read FAQs** — frequently asked questions about the NG Student loan\n' +
  '• **Help and Support** — Get In Touch for portal navigation help\n\n' +
  `Official ticket: ${ESUPPORT}`

export function matchPortalKnowledge(raw: string): { intent: string; text: string } | null {
  const t = (raw || '').trim()
  if (!t) return null

  if (/institution has not opened|has not opened a session|session for loan applications yet|school.{0,40}not opened/i.test(t)) {
    return { intent: 'missing-information', text: INSTITUTION_SESSION }
  }
  if (/active\s*session|registration\s*starts|window|23\s*sep|31\s*dec|deadline/i.test(t) && /open|session|apply|window|notice/i.test(t)) {
    return { intent: 'current-information', text: OPEN_SESSION_NOTICE }
  }
  if (/fee\s*dispute|raise\s*a\s*dispute|dispute\s*(fee|amount)|fee\s*(looks?|is)\s*wrong|wrong\s*(fee|amount)/i.test(t)) {
    return { intent: 'institutional-charges', text: FEE_DISPUTES }
  }
  if (/change\s*password|settings.{0,20}password|how\s*(do\s*i|to)\s*change\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset', text: CHANGE_PASSWORD }
  }
  if (/reset\s*account\s*details|account\s*reset\s*attempt|only\s*1\s*account\s*reset/i.test(t)) {
    return { intent: 'documents-needed', text: PROFILE_BVN_BANK }
  }
  if (/account\s*details|update\s*(my\s*)?(bvn|bank)|re-?enter\s*(bvn|bank)|profile\s*(completed|100)|where\s*(do\s*i|to)\s*(put|enter)\s*bvn|bank\s*account\s*number/i.test(t)) {
    return { intent: 'documents-needed', text: PROFILE_BVN_BANK }
  }
  if (/portal\s*menu|what\s*(is\s*on|are)\s*(the\s*)?menu|where\s*is\s*(disputes|settings|profile|loans)/i.test(t)) {
    return { intent: 'contact-support', text: PORTAL_MENU }
  }
  if (/wallet|in\s*wallet|total\s*loan\s*amount|balance\s*date|amount\s*repaid/i.test(t)) {
    return { intent: 'pending-application', text: WALLET }
  }
  if (/pending|after\s*(i\s*)?apply|loan\s*history|school\s*loan\s*history|personal\s*history|view\s*or\s*cancel|cancel\s*(my\s*)?(loan|application)/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_AFTER }
  }
  if (/institutional\s*loans\s*tab|upkeep\s*loans\s*tab/i.test(t)) {
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
