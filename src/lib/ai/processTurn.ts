/**
 * Crash-safe NELFUND turn entry.
 * Official URLs: website nelf.gov.ng | signup portal.nelf.gov.ng | login portal.nelf.gov.ng/auth/login
 * Live window (portal notice 2026-09): 2026/2027 open 23 Sep 2026 – 31 Dec 2026.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
  type ChatMessage,
} from './conversation'
import type { ConversationTurn, IntentId, AgentCapability } from './types'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

const MEANING =
  '**NELFUND** stands for **Nigeria Education Loan Fund**.\n\n' +
  'It is a **government** student loan scheme (interest-free under official rules) for eligible students in **public** tertiary institutions.\n\n' +
  '- **Institutional charges** (school fees) go to your **school**.\n' +
  '- **Upkeep** (optional) goes to **you** if you request it in the same application.\n' +
  `- Official: ${SITE} · signup ${PORTAL} · login ${LOGIN_URL}`

const OVERVIEW =
  '**How NELFUND works (2026/2027)**\n\n' +
  '1. **Full meaning:** Nigeria Education Loan Fund.\n' +
  '2. **Institutional charges** go to your **school**.\n' +
  '3. **Upkeep** (optional) goes to **you** if ticked on the loan configuration step.\n' +
  '4. **Who can apply:** Nigerian citizens, full-time, **public** tertiary institutions.\n' +
  '5. **Window:** 23 September 2026 – 31 December 2026 (portal notice).\n' +
  '6. Returning students: **re-enter BVN and bank details** for this cycle.\n' +
  `7. **Login:** ${LOGIN_URL} · **Signup/portal:** ${PORTAL}\n` +
  '8. Never pay an agent; never share OTP or password.\n' +
  '9. If the portal says your **institution has not opened a session**, contact the campus NELFUND desk even while the national window is open.'

const SCAM =
  '**NELFUND is a real government student loan scheme**, not a private WhatsApp product.\n\n' +
  '- Never pay anyone to process or approve your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  `- Signup / apply only on ${PORTAL}\n` +
  `- Login only on ${LOGIN_URL}\n` +
  `- File a support ticket: ${ESUPPORT}\n\n` +
  'Anyone on WhatsApp asking for money or codes is a **scam**.'

const ELIGIBILITY =
  '**Eligibility**\n\n' +
  '• Nigerian citizen\n' +
  '• Admission into a **public** university, polytechnic, college of education, or vocational school\n' +
  '• **Full-time** student with valid admission\n\n' +
  'Have ready: matric number, JAMB details, NIN, BVN, bank account in your name.\n\n' +
  `Confirm on ${SITE} and ${PORTAL}.`

const APPLY =
  '**How to apply (2026/2027)**\n\n' +
  `1. Sign in: ${LOGIN_URL} (or sign up at ${PORTAL}).\n` +
  '2. **Re-enter BVN and bank details** for this cycle if the portal asks (returning applicants).\n' +
  '3. Tap **Request for Student Loan**.\n' +
  '4. **Loan configuration:** institutional charges cover school fees as provided by your school; tick **I need Upkeep Loan** if you want upkeep paid to your account.\n' +
  '5. **Upload documents:** Admission letter is **mandatory** (JPEG or PDF). Student ID is optional.\n' +
  '6. Tick the Student Loan Policy and Declaration, then continue.\n' +
  '7. National window: **23 Sep 2026 – 31 Dec 2026**. After the end date you cannot apply for this session.\n' +
  '8. If the portal says your **institution has not opened a session**, contact the campus NELFUND desk first.\n' +
  `9. Stuck after school confirms: open a support ticket at ${ESUPPORT}.`

const APPLY_AND_UPKEEP =
  '**Loan + upkeep in the same application (2026/2027)**\n\n' +
  `1. Log in at ${LOGIN_URL}.\n` +
  '2. Update **BVN and bank details** for this cycle if prompted.\n' +
  '3. Request the student loan → institutional charges go to the **school**.\n' +
  '4. Tick **I need Upkeep Loan** if you want upkeep paid to **your** account.\n' +
  '5. Upload **Admission letter** (mandatory). Submit before **31 December 2026**.\n' +
  '6. If you see “institution has not opened a session,” fix that with your school first.\n' +
  `7. Portal: ${PORTAL}. I will not invent an upkeep amount — confirm on the portal.`

const DOCUMENTS =
  '**Documents for 2026/2027 application**\n\n' +
  '• **Admission letter** — mandatory (JPEG or PDF)\n' +
  '• **Student ID card** — optional (JPEG or PDF)\n' +
  '• Profile: JAMB, NIN, **BVN**, bank account **in your name** (re-enter BVN/bank for this cycle if asked)\n\n' +
  `Upload inside the application flow on ${PORTAL}.`

const LOGIN =
  '**Log in / sign in**\n\n' +
  `Open the official login page:\n${LOGIN_URL}\n\n` +
  'Enter the email and password for your NELFUND account.\n' +
  `New account? Sign up at: ${PORTAL}\n` +
  `Still stuck: open a support ticket at ${ESUPPORT}`

const FORGOT_PASSWORD =
  '**Forgot password**\n\n' +
  `1. Open ${LOGIN_URL}\n` +
  '2. Tap **Forgot password** on that page.\n' +
  '3. Enter the email linked to your account.\n' +
  '4. Check inbox and spam, then set a new password.\n' +
  `5. No email: open a support ticket at ${ESUPPORT}`

const EMAIL_USED =
  '**Email already used**\n\n' +
  `1. Log in at ${LOGIN_URL} with that **same email**.\n` +
  '2. If you forgot the password, use **Forgot password** on the login page.\n' +
  '3. Do not create a new account with another email unless support tells you to.\n' +
  `4. Still blocked: ${ESUPPORT} with a screenshot.`

const UPKEEP =
  '**Upkeep** is optional living support.\n\n' +
  '- Tick **I need Upkeep Loan** on the loan configuration step (same application as institutional charges).\n' +
  '- Paid to **your** bank account.\n' +
  '- Institutional charges still go to the **school**.\n' +
  `- Confirm any monthly amount only on ${PORTAL}.`

const CHARGES =
  '**Institutional charges** means school fees / obligatory institutional fees.\n\n' +
  '- Paid **to the school** as provided by your institution.\n' +
  '- **Upkeep** (if ticked) is separate and paid to you.\n' +
  `- Confirm amounts only on ${PORTAL}.`

const UPKEEP_VS_FEES =
  '**School fees vs upkeep**\n\n' +
  '1. **Institutional charges** → paid to your **school**.\n' +
  '2. **Upkeep** (optional) → paid to **you** if you tick it.\n' +
  `3. Confirm figures only on ${PORTAL}.`

const INSTITUTION_SESSION =
  '**“Your institution has not opened a session for loan applications yet”**\n\n' +
  'This is a **school-level** block. The national 2026/2027 window can already be open (**23 Sep – 31 Dec 2026**) while **your school** has not opened its session or shared student biodata with NELFUND.\n\n' +
  '1. Contact your **campus NELFUND / registry / student affairs desk** and ask them to open the session and upload active students’ data.\n' +
  '2. Keep checking the portal after the school confirms.\n' +
  `3. Login: ${LOGIN_URL} · Portal: ${PORTAL}\n` +
  `4. If the school says they finished and the message remains, open a support ticket at ${ESUPPORT} with a screenshot.\n\n` +
  'Do not pay anyone to “open” a session for you.'

const MISSING =
  '**Missing information / school not on the list**\n\n' +
  'Usually the school has not finished uploading your record.\n\n' +
  '1. Confirm you attend a public institution.\n' +
  '2. Ask the campus NELFUND desk if your data is uploaded.\n' +
  `3. Retry ${PORTAL}. Still failing: open a support ticket at ${ESUPPORT}.`

const PENDING =
  '**Application pending**\n\n' +
  'Pending usually means processing is still ongoing or the school/portal has not finished a step.\n\n' +
  '1. Note the exact status on the portal.\n' +
  '2. Confirm with the campus NELFUND desk if the school must act.\n' +
  `3. Still stuck: open a support ticket at ${ESUPPORT} with a screenshot.\n\n` +
  'I will not invent how many days it takes.'

const JAMB =
  '**Invalid / problem with JAMB number**\n\n' +
  '1. Re-check the JAMB number against JAMB and school records.\n' +
  '2. Confirm your school has uploaded your record for this session.\n' +
  `3. Retry ${PORTAL}. Still failing: campus desk, then ${ESUPPORT}.`

const REPAYMENT =
  '**Repayment**\n\n' +
  'Repayment starts after the applicable study / NYSC period under **official** NELFUND rules.\n\n' +
  `Confirm on ${SITE} and ${PORTAL}. I will not invent a start date or percentage.`

const LOAN_VS_SCHOLARSHIP =
  '**Loan, not a scholarship**\n\n' +
  'NELFUND is a **student loan** (interest-free under official rules), not free money.\n\n' +
  `Official: ${SITE} · ${PORTAL}`

const INTEREST =
  '**Interest**\n\n' +
  'NELFUND is described under official rules as **interest-free**.\n\n' +
  `Confirm current policy on ${SITE} and ${PORTAL}.`

const OPEN_STATUS =
  '**Is NELFUND application open?**\n\n' +
  '**Yes — 2026/2027 is open on the official portal** (portal.nelf.gov.ng notice).\n\n' +
  '• **Window:** starts **23 September 2026**, ends **31 December 2026**.\n' +
  '• After the end date you will not be able to apply for a loan for this session.\n' +
  '• Returning students: **re-enter BVN and bank details** for this cycle.\n' +
  '• Tap **Request for Student Loan**, cover institutional charges, tick **I need Upkeep Loan** if needed.\n' +
  '• Upload **Admission letter** (mandatory, JPEG/PDF).\n\n' +
  '**Important:** The national window can be open while **your school has not opened a session** yet. If you see “Your institution has not opened a session for loan applications yet,” contact your **campus NELFUND desk** so they share student biodata — then retry.\n\n' +
  `Login: ${LOGIN_URL}\nSignup / portal: ${PORTAL}\nWebsite: ${SITE}`

const CONTACT =
  '**Official channels**\n\n' +
  `• **Website:** ${SITE}\n` +
  `• **Sign up / apply:** ${PORTAL}\n` +
  `• **Log in / sign in:** ${LOGIN_URL}\n` +
  `• **Support ticket** (file a complaint or get help): ${ESUPPORT}\n\n` +
  'I will not invent WhatsApp agents or private numbers.'

const LOGIN_LINK_ONLY =
  `**Official login / sign-in link**\n\n${LOGIN_URL}\n\n` +
  'Use this page only to sign in with your existing NELFUND account.'

const SIGNUP_LINK_ONLY =
  `**Official sign-up / application portal**\n\n${PORTAL}\n\n` +
  'Use this to create an account or start an application (2026/2027 window open through 31 Dec 2026).'

const SITE_LINK_ONLY =
  `**Official NELFUND website**\n\n${SITE}\n\n` +
  'News, policies, and official information.'

const TICKET_LINK_ONLY =
  `**File a support ticket with NELFUND**\n\n` +
  `Open a ticket here: ${ESUPPORT}\n\n` +
  'Use this when the portal is stuck, reset email never arrives, or school data is wrong after you tried the steps. Attach a clear screenshot.'

const GSI =
  '**GSI (Global Standing Instruction)**\n\n' +
  'On the application you are asked to read and accept the GSI mandate. That is NELFUND’s official repayment instruction on your bank account after the official grace / study period.\n\n' +
  '- Accept it only on the official portal.\n' +
  '- Nobody on WhatsApp should collect a “GSI fee”.\n' +
  `- Confirm the exact wording on ${PORTAL}. I will not invent recovery percentages.`

const NIN_BVN =
  '**NIN / BVN / name mismatch**\n\n' +
  'The portal checks that your **NIN, BVN, JAMB and school record** use the same identity.\n\n' +
  '1. Confirm the name and date of birth match across NIN, BVN, JAMB and the school list.\n' +
  '2. Fix the wrong record first (NIMC, bank, JAMB or campus ICT), then retry.\n' +
  '3. Use a bank account **in your own name**.\n' +
  `4. Still failing after the records match: ${ESUPPORT} with a screenshot.\n\n` +
  'Never send NIN or BVN codes to an agent.'

const GUARANTOR =
  '**Guarantor**\n\n' +
  'Official NELFUND student-loan applications are completed on the portal with your own records (admission, JAMB/matric, NIN, BVN).\n\n' +
  'I will not invent a private guarantor form. If the live portal asks for an extra field, complete it there only.\n\n' +
  `Portal: ${PORTAL} · Support: ${ESUPPORT}`

const STATUS_CHECK =
  '**How to check application status**\n\n' +
  `1. Log in at ${LOGIN_URL}\n` +
  '2. Read the dashboard status exactly as shown (pending, approved, declined, or a school-session message).\n' +
  '3. If it stays pending, ask the campus NELFUND desk whether they have uploaded / confirmed your record.\n' +
  `4. Still stuck: ${ESUPPORT} with a screenshot.\n\n` +
  'I will not invent how many days approval takes.'

const PRIVATE_PART_TIME =
  '**Private school / part-time**\n\n' +
  'Published eligibility is for **Nigerian citizens** in **full-time** programmes at **public** tertiary institutions that appear on the official portal list.\n\n' +
  'If your school does not appear in the dropdown, the institution (not a WhatsApp agent) must onboard with NELFUND.\n\n' +
  `Confirm on ${SITE} and ${PORTAL}.`

const DISBURSEMENT =
  '**When money is paid**\n\n' +
  'Official FAQ: NELFUND will disburse within **30 days of approval** of successful applications.\n\n' +
  '- **Institutional charges** go to the **school**, not your pocket.\n' +
  '- **Upkeep** (if you ticked it and it is approved) goes to **your** account.\n' +
  '- Pending is not the same as approved — check the exact dashboard word after login.\n\n' +
  `Confirm live status on ${LOGIN_URL}. I will not invent a personal payment date.`

const RETURNING =
  '**Returning students (new cycle)**\n\n' +
  'If you already used NELFUND before, you still apply **again** for 2026/2027.\n\n' +
  `1. Log in at ${LOGIN_URL} with the **same email**.\n` +
  '2. **Re-enter BVN and bank details** for this cycle when the portal asks.\n' +
  '3. Request the student loan, tick upkeep if you still need it, upload admission letter if asked.\n' +
  '4. National window: **23 Sep 2026 – 31 Dec 2026**.\n' +
  '5. If the school session is not open, the campus desk must upload this session’s biodata first.\n\n' +
  `Portal: ${PORTAL}`

const BANK =
  '**Bank account for NELFUND**\n\n' +
  '- Use an account **in your own name** (same identity as NIN / BVN).\n' +
  '- Returning applicants: **re-enter BVN and bank details** for the 2026/2027 cycle.\n' +
  '- Upkeep (if approved) is paid into that account. School fees still go to the school.\n' +
  '- Wrong name or closed account: fix it at the bank, then update the portal.\n\n' +
  `Login: ${LOGIN_URL} · Support: ${ESUPPORT}`

const UNKNOWN =
  'I do not have a reliable official answer for that exact detail.\n\n' +
  `Please file a support ticket with NELFUND: ${ESUPPORT}\n\n` +
  `You can also confirm general information on ${SITE} and ${PORTAL}.`
