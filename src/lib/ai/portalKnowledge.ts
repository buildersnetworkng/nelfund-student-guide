/**
 * Portal UI knowledge extracted from official portal.nelf.gov.ng screens
 * (student view before / during apply). Ground answers only.
 */
export const SITE = 'https://nelf.gov.ng/'
export const PORTAL = 'https://portal.nelf.gov.ng/'
export const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
export const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Menu items on the student portal (hamburger). */
export const PORTAL_MENU =
  '**Portal menu (after login)**\n\n' +
  '• **Home** — dashboard (loan counts, session message)\n' +
  '• **Loans** — Institutional Loans + Upkeep Loans history\n' +
  '• **Disputes** — Fee Disputes (question school fee amount)\n' +
  '• **Profile** — Personal, Contact, Educational, Account Details (BVN / bank)\n' +
  '• **Settings** — Change Password\n' +
  '• **Log out**\n\n' +
  `Open only at ${LOGIN_URL}`

export const INSTITUTION_SESSION =
  '**“Your institution has not opened a session for loan applications yet”**\n\n' +
  'This appears on **Home** when the national window can already be open, but **your school** has not opened its loan session or finished sharing student data.\n\n' +
  'You will typically see Total / Approved / Pending / Declined Loans all at **0**, and empty Institutional / Upkeep history.\n\n' +
  '1. Contact your **campus NELFUND / registry / student affairs desk** and ask them to open the session and upload active students.\n' +
  '2. Your **Profile Completed 100%** does **not** fix this — the block is school-side.\n' +
  '3. Keep checking Home after the school confirms.\n' +
  `4. Still stuck after school says done: ticket ${ESUPPORT} with a screenshot.\n\n` +
  'Do not pay anyone to “open” a session.'

export const FEE_DISPUTES =
  '**Fee Disputes (portal menu → Disputes)**\n\n' +
  'Official portal text:\n' +
  '“These are the school fees you have questioned. Your school will either agree with the amount you entered, or give the correct one. **Whichever amount they confirm is the amount you get as a loan.**”\n\n' +
  'Table columns you may see: Session · Fee shown · You said · Agreed fee · Status · Raised.\n\n' +
  '1. Use this when Loan Overview fee does not match what your school charges.\n' +
  '2. Raise the dispute **before** you fully rely on a wrong amount.\n' +
  '3. Wait for the school to confirm; the confirmed amount is what the loan uses.\n' +
  `4. Login: ${LOGIN_URL}`

export const PROFILE_BVN_BANK =
  '**Profile → Account Details (BVN & bank)**\n\n' +
  'After login: menu → **Profile**.\n' +
  'Tabs: Personal Details · Contact Details · Educational Details · **Account Details**.\n\n' +
  '• You can see Profile Completed **100%** and still be blocked if the school has not opened a session.\n' +
  '• Under Account Details: enter/update **Bank Verification Number (BVN)** and **Bank Name**.\n' +
  '• For 2026/2027, re-enter BVN and bank when the portal asks — use this screen.\n' +
  `Login: ${LOGIN_URL}`

export const CHANGE_PASSWORD =
  '**Change password**\n\n' +
  'After login: menu → **Settings** → **Click to Change Password**.\n\n' +
  'If you are locked out and cannot sign in, use **Forgot password** on the login page instead.\n' +
  `Login page: ${LOGIN_URL}`

export const DASHBOARD_EMPTY =
  '**Home dashboard (before you can apply)**\n\n' +
  'Typical cards:\n' +
  '• Total Loans · Approved Loans · Pending Loans · Declined Loans\n' +
  '• Tabs: **Institutional Loans** (School Loan History) · **Upkeep Loans** (Personal History)\n\n' +
  'If you see “institution has not opened a session” and all counts are 0, you cannot request the loan until the school opens the session.\n\n' +
  'Another Home view may show Total Loan Amount (Institution Loan / Upkeep), Balance Date, Amount Repaid — those fill after loans exist.\n' +
  `Login: ${LOGIN_URL}`

export const LOANS_TABS =
  '**Loans page**\n\n' +
  'Menu → **Loans**.\n' +
  '• **Institutional Loans** → School Loan History (institutional fee applications)\n' +
  '• **Upkeep Loans** → Personal History (upkeep applications)\n\n' +
  'Each row can show date, status (e.g. Pending), loan type, academic session, and actions like View / Cancel when a request exists.'

export function matchPortalKnowledge(raw: string): { intent: string; text: string } | null {
  const t = (raw || '').trim()
  if (!t) return null

  if (/institution has not opened|has not opened a session|session for loan applications yet|school.{0,40}not opened/i.test(t)) {
    return { intent: 'missing-information', text: INSTITUTION_SESSION }
  }
  if (/fee\s*dispute|raise\s*a\s*dispute|dispute\s*(fee|amount)|fee\s*(looks?|is)\s*wrong|wrong\s*(fee|amount)/i.test(t)) {
    return { intent: 'institutional-charges', text: FEE_DISPUTES }
  }
  if (/change\s*password|settings.{0,20}password|how\s*(do\s*i|to)\s*change\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset', text: CHANGE_PASSWORD }
  }
  if (/account\s*details|update\s*(my\s*)?(bvn|bank)|re-?enter\s*(bvn|bank)|profile\s*(completed|100)|where\s*(do\s*i|to)\s*(put|enter)\s*bvn/i.test(t)) {
    return { intent: 'documents-needed', text: PROFILE_BVN_BANK }
  }
  if (/portal\s*menu|what\s*(is\s*on|are)\s*(the\s*)?menu|where\s*is\s*(disputes|settings|profile|loans)/i.test(t)) {
    return { intent: 'contact-support', text: PORTAL_MENU }
  }
  if (/total\s*loans|approved\s*loans|declined\s*loans|school\s*loan\s*history|personal\s*history|dashboard/i.test(t) && /empty|zero|0|before\s*apply|nothing|no\s*loan/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_EMPTY }
  }
  if (/institutional\s*loans\s*tab|upkeep\s*loans\s*tab|loan\s*history/i.test(t)) {
    return { intent: 'pending-application', text: LOANS_TABS }
  }
  if (/balance\s*date|amount\s*repaid|total\s*loan\s*amount/i.test(t)) {
    return {
      intent: 'repayment',
      text:
        '**Total Loan Amount / Balance Date / Amount Repaid**\n\n' +
        'These Home cards show cumulative loan and repayment figures after loans exist.\n' +
        'Institution Loan and Upkeep can show ₦0 with status Paid when nothing is outstanding yet.\n' +
        'Balance Date may show N/A until repayment scheduling applies.\n' +
        `Confirm live after login: ${LOGIN_URL}`,
    }
  }
  return null
}
