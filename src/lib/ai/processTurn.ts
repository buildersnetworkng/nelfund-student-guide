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

const CHARGES =
  '**Institutional charges** means school fees / obligatory institutional fees.\n\n' +
  '- Paid **to the school** as provided by your institution.\n' +
  '- **Upkeep** (if ticked) is separate and paid to you.\n' +
  `- Confirm amounts only on ${PORTAL}.`

const LOGIN =
  '**Log in / sign in**\n\n' +
  `Open the official login page:\n${LOGIN_URL}\n\n` +
  'Enter the email and password for your NELFUND account.\n' +
  `New account? Sign up at: ${PORTAL}\n` +
  `Still stuck: open a support ticket at ${ESUPPORT}`

const APPLY =
  '**How to apply (2026/2027)**\n\n' +
  `1. Sign in: ${LOGIN_URL} (or sign up at ${PORTAL}).\n` +
  '2. **Re-enter BVN and bank details** for this cycle if the portal asks.\n' +
  '3. Tap **Request for Student Loan**.\n' +
  '4. Tick **I need Upkeep Loan** if you want upkeep paid to your account.\n' +
  '5. Upload **Admission letter** (mandatory, JPEG or PDF).\n' +
  '6. Window: **23 Sep 2026 – 31 Dec 2026**.\n' +
  `7. Stuck: campus desk, then ${ESUPPORT}.`

const APPLY_AND_UPKEEP =
  '**Loan + upkeep in the same application (2026/2027)**\n\n' +
  `1. Log in at ${LOGIN_URL}.\n` +
  '2. Update **BVN and bank details** if prompted.\n' +
  '3. Institutional charges go to the **school**.\n' +
  '4. Tick **I need Upkeep Loan** if you want upkeep paid to **you**.\n' +
  '5. Upload **Admission letter**. Submit before **31 December 2026**.\n' +
  `6. Portal: ${PORTAL}. I will not invent an upkeep amount.`

const UPKEEP =
  '**Upkeep** is optional living support.\n\n' +
  '- Tick **I need Upkeep Loan** on the loan configuration step.\n' +
  '- Paid to **your** bank account.\n' +
  '- Institutional charges still go to the **school**.\n' +
  `- Confirm any monthly amount only on ${PORTAL}.`

const DISBURSEMENT =
  '**When money is paid**\n\n' +
  'Official FAQ: disbursement is within **30 days of approval** of successful applications.\n\n' +
  '- Institutional charges go to the **school**.\n' +
  '- Upkeep (if ticked and approved) goes to **you**.\n' +
  `- Check status after login: ${LOGIN_URL}\n` +
  'I will not invent a personal payment date.'

const RETURNING =
  '**Returning students (2026/2027)**\n\n' +
  `1. Same email at ${LOGIN_URL}.\n` +
  '2. Re-enter **BVN and bank details** when asked.\n' +
  '3. Request the loan again; tick upkeep if needed.\n' +
  '4. Window: **23 Sep 2026 – 31 Dec 2026**.\n' +
  `Portal: ${PORTAL}`

const BANK =
  '**Bank account**\n\n' +
  'Use an account **in your own name** matching NIN/BVN.\n' +
  'Returning applicants re-enter BVN and bank details this cycle.\n' +
  `Login: ${LOGIN_URL} · Support: ${ESUPPORT}`

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

const OPEN_STATUS =
  '**Yes — 2026/2027 is open** 23 Sep 2026 – 31 Dec 2026 (portal notice).\n' +
  'If your school has not opened a session, contact the campus NELFUND desk.\n' +
  `Login: ${LOGIN_URL}`

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
    pending: ['How do I contact official support?', 'What is upkeep vs school fees?'],
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
  if (/scam|fraud|fake\s*(loan|nelfund)|\botp\b|whatsapp.{0,30}(pay|otp)|agent.{0,24}(pay|otp)/i.test(t)) {
    return { intent: 'scam-safety', text: SCAM }
  }
  if (/what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|how\s+(does\s+)?(nelfund|this|it).{0,25}work|go\s*through.{0,30}nelfund|whole\s+nelfund|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund|how\s+nelfund\s+dey\s+work|nelfund\s+na\s+wetin/i.test(t)) {
    return { intent: 'what-is-nelfund', text: OVERVIEW }
  }
  if (/what\s+do\s+(you|u)\s+mean.{0,40}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+institutional|chargers?/i.test(t)) {
    if (/upkeep/i.test(t)) return { intent: 'upkeep', text: UPKEEP }
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain|wetin/i.test(t)) return { intent: 'upkeep', text: UPKEEP }
  if (/how\s+(do\s+i|to)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$|how\s+i\s+(go|fit)\s+login|abeg\s+login/i.test(t)) {
    return { intent: 'portal-login', text: LOGIN }
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset' as IntentId, text: FORGOT_PASSWORD }
  }
  if (/email\s+(already\s+)?(used|registered|taken)/i.test(t)) {
    return { intent: 'email-already-used' as IntentId, text: EMAIL_USED }
  }
  if (/how\s+(do\s+i|to|i\s+go|i\s+fit)\s*apply|step\s*by\s*step|i\s+wan(t)?\s*(to\s*)?apply|abeg\s+how\s+i\s+go\s+apply|apply.{0,40}(loan|upkeep)|meant.{0,20}(loan|upkeep)/i.test(t)) {
    if (/upkeep|loan/i.test(t)) return { intent: 'how-to-apply', text: APPLY_AND_UPKEEP }
    return { intent: 'how-to-apply', text: APPLY }
  }
  if (/when.{0,24}(money|pay|paid|disburse)|disbursement|dem\s+don\s+pay|when\s+i\s+go\s+see\s+money/i.test(t)) {
    return { intent: 'pending' as IntentId, text: DISBURSEMENT }
  }
  if (/return(ing)?\s+student|apply\s+again|i\s+apply\s+last\s+year|re-?enter\s+bvn/i.test(t)) {
    return { intent: 'how-to-apply', text: RETURNING }
  }
  if (/bank\s+account|account\s+(number|name|wrong)|which\s+account/i.test(t)) {
    return { intent: 'documents' as IntentId, text: BANK }
  }
  if (/who\s+can\s+apply|am\s+i\s+eligible|can\s+i\s+apply|^eligibility/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (/document|what\s+(do\s+i|to)\s+need|admission\s+letter/i.test(t)) {
    return { intent: 'documents' as IntentId, text: DOCUMENTS }
  }
  if (/is\s+(the\s+)?(loan|application|nelfund).{0,30}open|still\s+(dey\s+)?open|can\s+i\s+still\s+apply/i.test(t)) {
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
