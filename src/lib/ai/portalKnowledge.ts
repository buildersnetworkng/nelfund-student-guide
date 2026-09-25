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
  'There is no separate WhatsApp or agent application. After login: on **Home** confirm school session is open → **☰ (three lines) → Loans → Request Loan**. If Request Loan does not appear, reload the page. Enter BVN/bank when asked.'

export const APPLY_WALKTHROUGH =
  '**How to apply**\n\n' +
  `1. Open ${PORTAL} — create account or sign in (${LOGIN_URL}).\n` +
  '2. Complete **Profile** (JAMB, NIN, BVN, bank). Re-enter BVN/bank for 2026/2027 when asked.\n' +
  '3. On **Home**, confirm your school session is open.\n' +
  '4. Tap the **☰ menu** (three lines, top corner) → **Loans**.\n' +
  '5. Tap **Request Loan**. If the button does not appear, **reload / refresh** the page.\n' +
  '6. If asked for **BVN** or **bank** information, enter them.\n' +
  '7. Choose **institutional (school fees)** and/or optional **upkeep**.\n' +
  '8. When the fee amount is shown: if it is **not** your real school charges, use **Raise a dispute** / Fee Disputes **before** Submit.\n' +
  '9. Upload documents (e.g. admission letter) when asked → **Submit**.\n' +
  '10. After submit: **☰ → Loans** to see Institutional / Upkeep status (**Pending** is normal).\n\n' +
  `Stuck: campus NELFUND desk, then ${ESUPPORT}.`

/** Left mid-form / exited before finish — how to get back and request loan again */
export const RESUME_APPLY =
  '**You left before finishing — how to get back and apply again**\n\n' +
  'You do **not** need a new account. Use the same login.\n\n' +
  `1. **Log in** again: ${LOGIN_URL}\n` +
  '2. Tap the **☰ menu** (three lines, top corner).\n' +
  '3. Tap **Loans** to open the loan page.\n' +
  '4. **Wait**, then **reload / refresh** the page.\n' +
  '5. If **Request Loan** appears, tap it and continue (enter BVN/bank if asked; choose institutional and/or upkeep).\n' +
  `6. If **Request Loan** still does **not** appear after refresh: send a support message with a screenshot at ${ESUPPORT}.\n\n` +
  'Do not open a second account with a different email.'

export const CANCEL_LOAN =
  '**How to cancel a loan application**\n\n' +
  `1. Log in: ${LOGIN_URL}\n` +
  '2. Tap the **☰ three-line menu** (top-left).\n' +
  '3. Tap **Loans**.\n' +
  '4. Open **Institutional Loans** (school fees) and/or **Upkeep Loans**.\n' +
  '5. Scroll to the loan row / status (**Pending** or similar).\n' +
  '6. Use **View** / **Cancel** where available.\n' +
  '7. Confirm **Yes, Cancel Loan** only if you are sure.\n\n' +
  '**Portal warning:** Cancelling institutional also cancels upkeep; **cannot be undone**. Only while pending and nothing disbursed.\n' +
  'After successful cancel (no money released) you can re-apply on the same account.\n\n' +
  `If Cancel stuck: send a support message with your screenshot (if available) at ${ESUPPORT} with name, NIN, screenshots.`

export const FEE_WRONG_NO_DISPUTE =
  '**Fee on the portal is not my real school fees**\n\n' +
  '1. Confirm exact charges with bursary / NELFUND desk.\n' +
  '2. If still pending and nothing disbursed: cancel → re-apply → **Raise a dispute** if fee still wrong.\n' +
  `3. Cancel stuck: ${ESUPPORT}.`

export const REAPPLY_AFTER_CANCEL =
  '**Can I apply again after cancelling?** **Yes** if pending and no funds released. Same account; use Raise a dispute if fee is wrong.\n' +
  `Login: ${LOGIN_URL}`

export const UPKEEP_AFTER_FEES_ONLY =
  '**School fees only — add upkeep**\n\n' +
  'Login → **☰ → Loans** → Upkeep tab. Refresh. Complete missing docs/bank if needed. If option gone and still pending, cancel+re-apply with both or ticket support.\n' +
  `Login: ${LOGIN_URL} · Send a support message with your screenshot (if you have one): ${ESUPPORT}`

export const SCHOOL_NOT_FOUND =
  '**School not on the list / “No Result found” (Verify Educational Information)**\n\n' +
  'This screen is part of **signup / profile** — you must select your institution before you can finish educational details and apply.\n\n' +
  '**What it means:** The name you typed is **not matching** any institution currently on the portal list (or the school has not been loaded for this cycle yet).\n\n' +
  '**What to try:**\n' +
  '1. Clear the field and type a **shorter official name** or common short form (examples: “Olabisi Onabanjo”, “OOU”, “Onabanjo University” — try each carefully).\n' +
  '2. Check spelling (spaces, order of words). Avoid extra titles unless the list uses them.\n' +
  '3. Confirm your school is a **public** tertiary institution covered for this NELFUND cycle.\n' +
  '4. If **nothing** appears for every reasonable name: contact your **campus NELFUND / registry / ICT desk** and ask them to confirm the institution is listed and student data is uploaded.\n' +
  '5. Do **not** create a second account while you wait.\n\n' +
  `Login / continue profile: ${LOGIN_URL}\n` +
  `Portal: ${PORTAL}\n` +
  `Still stuck after the school confirms: send a support message with your screenshot (if available) at ${ESUPPORT} with a screenshot of “No Result found”.`

export const INSTITUTION_SESSION =
  '**“Your institution has not opened a session for loan applications yet”**\n\n' +
  'This can appear on **Home** even when the national NELFUND window is open — **your school** must open its session first.\n\n' +
  '**What to try first:**\n' +
  `1. Log in again at ${LOGIN_URL}.\n` +
  '2. Open **☰ (three lines) → Loans** and also check **Home**.\n' +
  '3. **Refresh / reload** the page. Other students in your school may already be applying — a refresh sometimes updates the status.\n' +
  '4. Contact your **campus NELFUND / registry / student affairs desk** to confirm the school has opened the session.\n' +
  '5. Profile 100% does **not** remove this message by itself.\n\n' +
  'If it is **still the same** after login + Loans + refresh: send a support message with your screenshot (if you have one) here:\n' +
  `→ ${ESUPPORT}\n` +
  '(That link is the official NELFUND help form — open it, describe the problem, attach the screenshot.)\n\n' +
  'Do not pay anyone to “open” a session.'

export const OPEN_SESSION_NOTICE =
  '**Active session / application window**\n\n' +
  'Loan and upkeep application is **not confirmed open** from this guide. Always confirm live dates on the official portal.\n' +
  'National window is not the same as your school session.\n' +
  `Login: ${LOGIN_URL}`

export const FEE_DISPUTES =
  '**Fee Disputes (☰ → Disputes)**\n\n' +
  'Raise when fee shown ≠ bursary figure, ideally **before Submit**. School confirms the final institutional loan amount.\n' +
  `Login: ${LOGIN_URL}`

export const PROFILE_BVN_BANK =
  '**Profile → Account Details (BVN & bank)**\n\n' +
  '☰ → Profile → Account Details. Re-enter BVN/bank for 2026/2027 when asked. Limited reset attempts — use carefully.\n' +
  `Login: ${LOGIN_URL}`

export const CHANGE_PASSWORD =
  '**Change password:** ☰ → Settings while logged in. If locked out: Forgot password on login page.\n' +
  `Login: ${LOGIN_URL}`

export const DASHBOARD_BEFORE =
  '**Home before apply:** counts often 0; possible “institution has not opened a session”; empty loan history.\n' +
  `Login: ${LOGIN_URL}`

export const DASHBOARD_AFTER =
  '**Home / Loans after apply:** Total/Pending can show 1–2. Pending = processing, not declined. ☰ → Loans for View/Cancel.\n' +
  `Login: ${LOGIN_URL}`

export const LOANS_TABS =
  '**☰ → Loans:** Institutional (fees to school) and Upkeep (to you). View details; Cancel when still pending and no disbursement.\n' +
  `Login: ${LOGIN_URL}`

export const HELP_CARDS =
  `Help cards on Home are guides only. Real issues: ${PORTAL} · ${LOGIN_URL} · ${ESUPPORT}`

export const WALLET =
  'For application status prefer Home counters and ☰ → Loans, not wallet alone.\n' +
  `Login: ${LOGIN_URL}`

export function matchPortalKnowledge(text: string): { intent: string; text: string } | null {
  const t = (text || '').trim()
  if (!t) return null

  // Left mid-form / exited before finish / how to get back and apply again
  if (
    /unable\\s*to\\s*finish|couldn'?t\\s*finish|could\\s*not\\s*finish|didn'?t\\s*finish|before\\s*(i\\s*)?(exit|exiting|leave|left|close)|get\\s*back\\s*(to\\s*)?(apply|application)|continue\\s*(my\\s*)?(appl|form|details)|resume\\s*(my\\s*)?(appl|form)|apply\\s*(for\\s*)?again|start\\s*(over|again)\\s*(to\\s*)?apply|left\\s*(before|mid|half)|filling\\s*(my\\s*)?details.{0,40}(exit|left|close)|how\\s*(do\\s*i|to)\\s*(get\\s*back|continue|resume)/i.test(
      t,
    )
  ) {
    return { intent: 'how-to-apply', text: RESUME_APPLY }
  }

  if (
    /no\\s*result\\s*found|select\\s*institution|verify\\s*educational|school\\s*(no|not|never)\\s*(dey|show|list|found)|not\\s*on\\s*(the\\s*)?list|cannot\\s*find\\s*(my\\s*)?school|olabisi\\s*onabanjo|\\boou\\b/i.test(
      t,
    )
  ) {
    return { intent: 'school-not-found', text: SCHOOL_NOT_FOUND }
  }
  if (/where\\s*(do\\s*i\\s*|to\\s*)?apply|which\\s*(site|website|link|portal)|where\\s*(is\\s*)?(the\\s*)?(loan\\s*)?application/i.test(t)) {
    return { intent: 'how-to-apply', text: WHERE_TO_APPLY }
  }
  if (/how\\s*(do\\s*i\\s*|to\\s*)?cancel|cancel\\s*(my\\s*)?(loan|application)|should\\s*i\\s*cancel|can\\s*i\\s*cancel|re-?apply\\s*after\\s*cancel/i.test(t)) {
    if (/re-?apply|apply\\s*again|after\\s*cancel/i.test(t)) {
      return { intent: 'pending-application', text: CANCEL_LOAN + '\\n\\n' + REAPPLY_AFTER_CANCEL }
    }
    if (/wrong\\s*(fee|amount)|didn'?t\\s*raise\\s*dispute/i.test(t)) {
      return { intent: 'pending-application', text: FEE_WRONG_NO_DISPUTE + '\\n\\n' + CANCEL_LOAN }
    }
    return { intent: 'pending-application', text: CANCEL_LOAN }
  }
  if (/wrong\\s*(fee|amount)|raise\\s*(a\\s*)?dispute|fee\\s*dispute|not\\s*(my\\s*)?(exact|real)\\s*school\\s*fees?/i.test(t)) {
    return { intent: 'pending-application', text: FEE_WRONG_NO_DISPUTE + '\\n\\n' + FEE_DISPUTES }
  }
  if (/only\\s*(applied\\s*)?(for\\s*)?(school\\s*)?fees?|reopen\\s*upkeep|add\\s*upkeep|upkeep\\s*(only|again|after)/i.test(t)) {
    return { intent: 'upkeep', text: UPKEEP_AFTER_FEES_ONLY }
  }
  if (/how\\s*(do\\s*i\\s*|to\\s*)?apply|steps?\\s*to\\s*apply|three\\s*line|hamburger|☰/i.test(t)) {
    return { intent: 'how-to-apply', text: APPLY_WALKTHROUGH }
  }
  if (/institution has not opened|has not opened a session|session for loan applications yet/i.test(t)) {
    return { intent: 'pending-application', text: INSTITUTION_SESSION }
  }
  if (/active\\s*session|2026\\/2027\\s*session\\s*registration|23\\s*september|31\\s*december/i.test(t)) {
    return { intent: 'current-information', text: OPEN_SESSION_NOTICE }
  }
  if (/fee\\s*dispute|raise\\s*a\\s*dispute/i.test(t)) {
    return { intent: 'pending-application', text: FEE_DISPUTES }
  }
  if (/bvn|bank\\s*(detail|account)|reset\\s*account\\s*details|account\\s*details/i.test(t)) {
    return { intent: 'bank-information', text: PROFILE_BVN_BANK }
  }
  if (/change\\s*password|settings/i.test(t) && /portal|menu|logged\\s*in/i.test(t)) {
    return { intent: 'password-reset', text: CHANGE_PASSWORD }
  }
  if (/portal\\s*menu|three\\s*line|hamburger|where\\s*is\\s*(disputes|settings|profile|loans)/i.test(t)) {
    return { intent: 'contact-support', text: PORTAL_MENU }
  }
  if (/wallet|in\\s*wallet/i.test(t)) {
    return { intent: 'pending-application', text: WALLET }
  }
  if (/pending|after\\s*(i\\s*)?apply|loan\\s*history|view\\s*or\\s*cancel/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_AFTER }
  }
  if (/institutional\\s*loans\\s*tab|upkeep\\s*loans\\s*tab/i.test(t)) {
    return { intent: 'pending-application', text: LOANS_TABS }
  }
  if (/total\\s*loans|dashboard/i.test(t) && /empty|zero|0|before\\s*apply|no\\s*loan/i.test(t)) {
    return { intent: 'pending-application', text: DASHBOARD_BEFORE }
  }
  return null
}
