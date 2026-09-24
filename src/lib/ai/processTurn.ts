/**
 * Crash-safe NELFUND turn entry.
 * Official: nelf.gov.ng | portal.nelf.gov.ng | portal.nelf.gov.ng/auth/login
 * Window: 23 Sep 2026 – 31 Dec 2026 (portal notice).
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
  '**NELFUND** = **Nigeria Education Loan Fund**. Government student loan (interest-free under official rules) for eligible students in **public** tertiary institutions.\n\n' +
  '- **Institutional fee** → paid to your **school** (amount set by the school).\n' +
  '- **Upkeep** (optional) → paid to **you** if selected.\n' +
  `- Official: ${SITE} · ${PORTAL} · login ${LOGIN_URL}`

const OVERVIEW =
  '**How NELFUND works (2026/2027)**\n\n' +
  '1. Active session: **2026/2027**. Window **23 Sep 2026 – 31 Dec 2026**.\n' +
  '2. Request student loan after login; re-enter BVN/bank if asked.\n' +
  '3. Institutional fee is school-specific (shown on Loan Overview). Dispute if wrong before submit.\n' +
  '4. Tick upkeep for monthly stipend to your account (portal currently shows **₦20,000**/month — confirm live).\n' +
  '5. Upload admission letter; accept **Terms & Conditions** and **GSI Mandate**; submit.\n' +
  '6. Status can show **Pending** under Institutional Loans and Upkeep Loans tabs.\n' +
  `Login: ${LOGIN_URL}`

const CHARGES =
  '**Institutional charges / institutional fee**\n\n' +
  '- Obligatory school fee **as provided by your institution**.\n' +
  '- Paid **to the school**, not to you.\n' +
  '- Loan Overview shows **your** school amount (varies by institution).\n' +
  '- If the fee looks wrong, use **Raise a dispute** **before** you submit.\n' +
  '- Upkeep (if selected) is separate and paid to your account.\n' +
  `- Confirm the figure only on ${PORTAL}. I will not invent a school fee amount.`

const LOGIN =
  '**Log in / sign in**\n\n' +
  `Open: ${LOGIN_URL}\n\n` +
  'Enter your NELFUND email and password.\n' +
  `New account: ${PORTAL}\nStuck: ${ESUPPORT}`

const APPLY =
  '**How to apply (2026/2027)**\n\n' +
  `1. Sign in: ${LOGIN_URL} (or sign up at ${PORTAL}). Active session: **2026/2027**.\n` +
  '2. **Re-enter BVN and bank details** if the portal asks.\n' +
  '3. Tap **Request for Student Loan**.\n' +
  '4. Loan configuration: institutional fee is set by your school; tick **I need Upkeep Loan** if you want upkeep.\n' +
  '5. Upload **Admission letter** (mandatory, JPEG/PDF). Student ID optional.\n' +
  '6. **Loan Overview:** check the institutional amount. If wrong, **Raise a dispute** before submit.\n' +
  '7. Tick **Terms & Conditions** and **GSI Mandate**, then **Submit Application**.\n' +
  '8. Window: **23 Sep 2026 – 31 Dec 2026** (cannot apply after the end date).\n' +
  `9. Stuck: campus NELFUND desk, then ${ESUPPORT}.`

const APPLY_AND_UPKEEP =
  '**Loan + upkeep (same application, 2026/2027)**\n\n' +
  `1. Log in at ${LOGIN_URL}.\n` +
  '2. Update BVN and bank if prompted.\n' +
  '3. Request student loan → institutional fee (school amount on Loan Overview) goes to the **school**.\n' +
  '4. Tick **I need Upkeep Loan** → portal text: monthly stipend of **₦20,000** to your account (confirm live).\n' +
  '5. Upload admission letter; accept Terms & GSI Mandate; submit before **31 Dec 2026**.\n' +
  '6. Dashboard may show **Pending** under both **Institutional Loans** and **Upkeep Loans** tabs.\n' +
  `7. Portal: ${PORTAL}.`

const UPKEEP =
  '**Upkeep loan**\n\n' +
  '- Optional living support. Tick **I need Upkeep Loan** on loan configuration.\n' +
  '- Paid to **your** provided bank account (not the school).\n' +
  '- Portal wording (confirm live): if upkeep is selected, a **monthly stipend of ₦20,000** is paid to your account.\n' +
  '- Institutional fee still goes to the **school**.\n' +
  '- After submit, check the **Upkeep Loans** tab (can show Pending separately from Institutional).\n' +
  `- Always re-check the amount on ${PORTAL}; official figures can change.`

const DISBURSEMENT =
  '**When money is paid**\n\n' +
  'Official FAQ: disbursement is within **30 days of approval** of successful applications.\n\n' +
  '- Institutional charges go to the **school**.\n' +
  '- Upkeep (if ticked and approved) goes to **you**.\n' +
  `- Check status after login: ${LOGIN_URL}\n` +
  'Pending is not the same as approved. I will not invent a personal payment date.'

const RETURNING =
  '**Returning students (2026/2027)**\n\n' +
  `1. Same email at ${LOGIN_URL}.\n` +
  '2. Re-enter **BVN and bank details** when asked.\n' +
  '3. Request the loan again; tick upkeep if needed.\n' +
  '4. Accept Terms & GSI Mandate; submit before **31 Dec 2026**.\n' +
  `Portal: ${PORTAL}`

const BANK =
  '**Bank account**\n\n' +
  'Use an account **in your own name** matching NIN/BVN.\n' +
  'Re-enter bank details for the 2026/2027 cycle if the portal asks.\n' +
  `Login: ${LOGIN_URL}`

const FORGOT_PASSWORD =
  '**Forgot password**\n\n' +
  `1. Open ${LOGIN_URL}\n` +
  '2. Tap **Forgot password**.\n' +
  '3. Use the email on the account; check inbox and spam.\n' +
  `4. No email: ${ESUPPORT}`

const EMAIL_USED =
  '**Email already used**\n\n' +
  `Log in at ${LOGIN_URL} with that same email. Use Forgot password if needed. Do not open a second account unless support says so.\n` +
  `Support: ${ESUPPORT}`

const SCAM =
  '**NELFUND is a real government student loan scheme.**\n\n' +
  '- Never pay anyone to process the loan.\n' +
  '- Never share OTP, password, NIN or BVN with strangers.\n' +
  `- Apply only on ${PORTAL} · Login ${LOGIN_URL} · Ticket ${ESUPPORT}`

const ELIGIBILITY =
  '**Eligibility:** Nigerian citizen; full-time student in a **public** tertiary institution with valid admission.\n\nHave ready: matric, JAMB, NIN, BVN, bank in your name.\n' +
  `Confirm on ${SITE} and ${PORTAL}.`

const DOCUMENTS =
  '**Documents:** Admission letter (mandatory, JPEG/PDF). Student ID optional. Profile: JAMB, NIN, BVN, bank in your name.\n' +
  `Upload on ${PORTAL}.`

const CONTACT =
  `**Official:** ${SITE} · ${PORTAL} · login ${LOGIN_URL} · ticket ${ESUPPORT}\n\nI will not invent WhatsApp agents.`

const REPAYMENT =
  '**Repayment** starts after the official study / NYSC period.\n' +
  `Confirm on ${SITE}. I will not invent a date or percentage.`

const PENDING =
  '**Application pending**\n\n' +
  'Pending means your request is submitted and still being processed — it is **not** a decline.\n\n' +
  'On the portal you may see:\n' +
  '• **Pending Loans** count on the dashboard\n' +
  '• **Institutional Loans** tab → School Loan History (e.g. Institutional Fee, session 2026-2027, status Pending)\n' +
  '• **Upkeep Loans** tab → Personal History (status Pending if you selected upkeep)\n' +
  '• Actions: **View** or **Cancel** on a pending row\n\n' +
  '1. Note the exact status and loan type.\n' +
  '2. Wait for processing; school/NELFUND steps can still run after submit.\n' +
  `3. Still stuck a long time: campus desk, then ticket ${ESUPPORT} with a screenshot.\n` +
  'I will not invent how many days pending lasts.'

const OPEN_STATUS =
  '**Yes — 2026/2027 is open** (Active Session on portal).\n\n' +
  '• Registration: **23 September 2026 – 31 December 2026**.\n' +
  '• You cannot apply for this session after the end date.\n' +
  '• Re-enter BVN and bank details for this cycle if asked.\n' +
  '• After apply, status can show **Pending** under Institutional and/or Upkeep tabs.\n' +
  '• If “institution has not opened a session,” contact the campus NELFUND desk.\n' +
  `Login: ${LOGIN_URL} · Portal: ${PORTAL}`

const UNKNOWN =
  `I do not have a reliable official answer for that exact detail.\n\nTicket: ${ESUPPORT}\n${SITE} · ${PORTAL}`

function suggest(intent: string, userText?: string): string[] {
  const t = (userText || '').toLowerCase()
  const map: Record<string, string[]> = {
    'what-is-nelfund': ['Who can apply (eligibility)?', 'How do I apply step by step?'],
    eligibility: ['How do I apply step by step?', 'What documents do I need?'],
    'how-to-apply': ['How do I log in?', 'What is upkeep vs school fees?'],
    documents: ['How do I apply step by step?', 'Is application open?'],
    'portal-login': ['I forgot my password', 'Email already used on the portal'],
    'password-reset': ['How do I log in?', 'Email already used on the portal'],
    'email-already-used': ['I forgot my password', 'How do I log in?'],
    upkeep: ['What is institutional charges?', 'How do I apply step by step?'],
    'institutional-charges': ['What is upkeep?', 'How do I apply step by step?'],
    pending: ['When is disbursement after approval?', 'How do I contact official support?'],
    repayment: ['Is NELFUND a loan or a scholarship?', 'Who can apply (eligibility)?'],
    'scam-safety': ['How do I apply only on the official portal?', 'How do I contact official support?'],
    'contact-support': ['How do I log in?', 'How do I apply step by step?'],
    'current-information': ['How do I apply step by step?', 'What documents do I need?'],
    disbursement: ['How do I check application status?', 'What is upkeep vs school fees?'],
    returning: ['How do I log in?', 'How do I apply step by step?'],
    bank: ['What documents do I need?', 'How do I contact official support?'],
  }
  if (/disburse|when.{0,20}(money|pay|paid)/i.test(t)) return map.disbursement
  if (/return(ing)?\s+student|apply\s+again/i.test(t)) return map.returning
  if (/bank\s+account/i.test(t)) return map.bank
  if (/pending/i.test(t)) return map.pending
  return (map[intent] || ['Who can apply (eligibility)?', 'How do I apply step by step?']).slice(0, 2)
}

function reply(
  rawUser: string,
  imagePreview: string | null | undefined,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
): AgentTurnResult {
  const answer = {
    hasEvidence: true,
    intent,
    confidence: 0.95,
    responseMode: 'conversation',
    problem: null as string | null,
    answer: text,
    whatThisMeans: null as string | null,
    nextActions: [] as string[],
    clarifyingQuestions: suggest(String(intent), rawUser),
    evidence: [] as [],
    sources: [
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
      { id: 'portal', label: 'NELFUND signup / portal', url: PORTAL, official: true },
      { id: 'login', label: 'NELFUND login', url: LOGIN_URL, official: true },
    ],
    video: null,
    insufficientReason: null as string | null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
  return {
    messages: [
      { id: uid('user'), role: 'user', text: rawUser || '[message]', imagePreview: imagePreview || null, timestamp: Date.now() },
      { id: uid('asst'), role: 'assistant', text, answer: answer as any, timestamp: Date.now() },
    ],
    slots: { ...slots, intent },
    diagnosed: true,
    capability: 'conversation' as AgentCapability,
  }
}

function route(raw: string): { intent: IntentId; text: string } | null {
  const t = (raw || '').trim()
  if (!t) return null

  if (/^(login|log\s*in|sign\s*in)\s*link/i.test(t) || /link\s*to\s*login/i.test(t)) {
    return { intent: 'portal-login', text: `**Official login:** ${LOGIN_URL}` }
  }
  if (/full\s+meaning|meaning\s+of\s+nelfund|nelfund\s+stand\s+for|what\s+does\s+nelfund\s+mean|wetin\s+nelfund\s+mean/i.test(t)) {
    return { intent: 'what-is-nelfund', text: MEANING }
  }
  if (/what\s+is\s+(this\s+)?nelfund|how\s+(does\s+)?(nelfund|this|it).{0,25}work|go\s*through|whole\s+nelfund|explain\s+nelfund/i.test(t)) {
    return { intent: 'what-is-nelfund', text: OVERVIEW }
  }
  if (/scam|fraud|fake\s*(loan|nelfund)/i.test(t)) return { intent: 'scam-safety', text: SCAM }
  if (/institutional\s*charg|what\s+do\s+(you|u)\s+mean.{0,40}charg|chargers?/i.test(t)) {
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain|wetin|stipend|20,?000/i.test(t)) {
    return { intent: 'upkeep', text: UPKEEP }
  }
  if (/dispute|fee\s+looks?\s+wrong|wrong\s+(fee|amount)/i.test(t)) {
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/how\s+(do\s+i|to)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(t)) {
    return { intent: 'portal-login', text: LOGIN }
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset' as IntentId, text: FORGOT_PASSWORD }
  }
  if (/email\s+(already\s+)?(used|registered|taken)/i.test(t)) {
    return { intent: 'email-already-used' as IntentId, text: EMAIL_USED }
  }
  if (/how\s+(do\s+i|to|i\s+go)\s*apply|step\s*by\s*step|i\s+wan(t)?\s*(to\s*)?apply|apply.{0,40}(loan|upkeep)/i.test(t)) {
    if (/upkeep|loan/i.test(t)) return { intent: 'how-to-apply', text: APPLY_AND_UPKEEP }
    return { intent: 'how-to-apply', text: APPLY }
  }
  if (/pending|still\s+processing|application\s+is\s+pending|loan\s+history|pending\s+loans/i.test(t)) {
    return { intent: 'pending' as IntentId, text: PENDING }
  }
  if (/when.{0,24}(money|pay|paid|disburse)|disbursement|when\s+i\s+go\s+see\s+money/i.test(t)) {
    return { intent: 'current-information' as IntentId, text: DISBURSEMENT }
  }
  if (/return(ing)?\s+student|apply\s+again|i\s+apply\s+last\s+year|re-?enter\s+bvn/i.test(t)) {
    return { intent: 'how-to-apply', text: RETURNING }
  }
  if (/bank\s+account|account\s+(number|name|wrong)/i.test(t)) {
    return { intent: 'documents' as IntentId, text: BANK }
  }
  if (/who\s+can\s+apply|am\s+i\s+eligible|can\s+i\s+apply|^eligibility/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (/document|what\s+(do\s+i|to)\s+need|admission\s+letter/i.test(t)) {
    return { intent: 'documents' as IntentId, text: DOCUMENTS }
  }
  if (/is\s+(the\s+)?(loan|application|nelfund).{0,30}open|still\s+open|can\s+i\s+still\s+apply/i.test(t)) {
    return { intent: 'current-information', text: OPEN_STATUS }
  }
  if (/repay|pay\s*back|after\s*nysc/i.test(t)) {
    return { intent: 'repayment', text: REPAYMENT }
  }
  if (/contact|support|ticket|esupport/i.test(t)) {
    return { intent: 'contact-support', text: CONTACT }
  }
  return null
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const rawUser = (opts.userText || '').trim()
  const imagePreview = opts.imagePreview
  try {
    const hit = route(rawUser)
    if (hit) return reply(rawUser, imagePreview, opts.slots, hit.intent, hit.text)
  } catch {
    /* continue */
  }
  try {
    return await processUserTurnCore(opts)
  } catch {
    const hit = route(rawUser)
    if (hit) return reply(rawUser, imagePreview, opts.slots, hit.intent, hit.text)
    return reply(rawUser || '[message]', imagePreview, opts.slots, 'contact-support' as IntentId, UNKNOWN)
  }
}

export { createInitialSlots, createWelcomeMessage } from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
