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

const UNKNOWN =
  'I do not have a reliable official answer for that exact detail.\n\n' +
  `Please file a support ticket with NELFUND: ${ESUPPORT}\n\n` +
  `You can also confirm general information on ${SITE} and ${PORTAL}.`

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
    'upkeep-vs-fees': ['How do I apply step by step?', 'Who can apply (eligibility)?'],
    'missing-information': ['Is application open?', 'How do I contact official support?'],
    pending: ['Portal shows missing information', 'How do I contact official support?'],
    jamb: ['Portal shows missing information', 'How do I apply step by step?'],
    repayment: ['Is NELFUND a loan or a scholarship?', 'Who can apply (eligibility)?'],
    'loan-vs-scholarship': ['When does repayment start?', 'What is upkeep vs school fees?'],
    interest: ['Is NELFUND a loan or a scholarship?', 'Who can apply (eligibility)?'],
    'scam-safety': ['How do I apply only on the official portal?', 'How do I contact official support?'],
    'contact-support': ['How do I log in?', 'How do I apply step by step?'],
    'current-information': ['How do I apply step by step?', 'What documents do I need?'],
  }
  if (/document|what do i need|requirements?/i.test(t)) return map.documents
  if (/pending|still processing/i.test(t)) return map.pending
  if (/jamb/i.test(t)) return map.jamb
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
  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || '[message]',
    imagePreview: imagePreview || null,
    timestamp: Date.now(),
  }
  const asstMsg: ChatMessage = {
    id: uid('asst'),
    role: 'assistant',
    text,
    answer: answer as any,
    timestamp: Date.now(),
  }
  return {
    messages: [userMsg, asstMsg],
    slots: { ...slots, intent },
    diagnosed: true,
    capability: 'conversation' as AgentCapability,
  }
}

function route(raw: string): { intent: IntentId; text: string } | null {
  const t = (raw || '').trim()
  if (!t) return null

  if (/^(login|log\s*in|sign\s*in)\s*link\??$/i.test(t) || /^(give|send|share|drop|show)\s*(me\s*)?(the\s*)?(login|log\s*in|sign\s*in)\s*link/i.test(t) || /^link\s*to\s*login$/i.test(t)) {
    return { intent: 'portal-login', text: LOGIN_LINK_ONLY }
  }
  if (/^(signup|sign\s*up|apply)\s*link\??$/i.test(t) || /^(give|send|share|show)\s*(me\s*)?(the\s*)?(signup|sign\s*up|portal|apply)\s*link/i.test(t)) {
    return { intent: 'how-to-apply', text: SIGNUP_LINK_ONLY }
  }
  if (/^(website|official\s*site)\s*link\??$/i.test(t) || /^(give|send|share|show)\s*(me\s*)?(the\s*)?(website|official\s*site)\s*link/i.test(t)) {
    return { intent: 'current-information', text: SITE_LINK_ONLY }
  }
  if (/^(ticket|support|esupport)\s*link\??$/i.test(t) || /^(give|send|share|show)\s*(me\s*)?(the\s*)?(ticket|support|esupport)\s*link/i.test(t) || /file\s*(a\s*)?(ticket|complaint)/i.test(t)) {
    return { intent: 'contact-support', text: TICKET_LINK_ONLY }
  }

  if (/full\s+meaning|meaning\s+of\s+nelfund|nelfund\s+stand\s+for|what\s+does\s+nelfund\s+mean|acronym|abbreviation|wetin\s+nelfund\s+mean/i.test(t)) {
    return { intent: 'what-is-nelfund', text: MEANING }
  }
  if (/scam|fraud|fake\s*(loan|nelfund)|is\s+(this|it|nelfund).{0,20}scam/i.test(t)) {
    return { intent: 'scam-safety', text: SCAM }
  }
  if (/loan\s+or\s+scholarship|scholarship|is\s+nelfund\s+a\s+loan/i.test(t)) {
    return { intent: 'loan-vs-scholarship' as IntentId, text: LOAN_VS_SCHOLARSHIP }
  }
  if (/interest[- ]?free|is\s+there\s+interest/i.test(t)) {
    return { intent: 'interest' as IntentId, text: INTEREST }
  }
  if (/is\s+(the\s+)?(loan|application|nelfund).{0,30}open|window\s+open|application\s+open|nelfund\s+open/i.test(t)) {
    return { intent: 'current-information', text: OPEN_STATUS }
  }
  if (/document|what\s+(do\s+i|to)\s+need|requirements?|admission\s+letter/i.test(t)) {
    return { intent: 'documents' as IntentId, text: DOCUMENTS }
  }
  if (/pending|still\s+processing|application\s+is\s+pending/i.test(t)) {
    return { intent: 'pending' as IntentId, text: PENDING }
  }
  if (/invalid\s+jamb|jamb\s+(number|error|invalid|problem)/i.test(t)) {
    return { intent: 'jamb' as IntentId, text: JAMB }
  }
  if (/^eligibility\s*[!?.]?$/i.test(t) || /\bwho\s+can\s+apply\b|\bam\s+i\s+eligible\b|can\s+i\s+apply/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (/what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|how\s+(does\s+)?(nelfund|this|it).{0,25}work|go\s*through.{0,30}nelfund|whole\s+nelfund|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund/i.test(t)) {
    return { intent: 'what-is-nelfund', text: OVERVIEW }
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*reset|can'?t\s*remember\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset' as IntentId, text: FORGOT_PASSWORD }
  }
  if (/email\s+(already\s+)?(used|registered|taken|exist)|already\s+(used|registered|exist).{0,20}email|showing\s+(used|already).{0,15}email|email.{0,20}already/i.test(t)) {
    return { intent: 'email-already-used' as IntentId, text: EMAIL_USED }
  }
  if (/how\s+(do\s+i|to)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(t)) {
    return { intent: 'portal-login', text: LOGIN }
  }
  if (/how\s+(do\s+i|to|i\s+go)\s*apply|step\s*by\s*step|i\s+wan(t)?\s*(to\s*)?apply|apply\s+only\s+on\s+the\s+official|apply.{0,40}(loan|upkeep)|meant.{0,20}(loan|upkeep)/i.test(t)) {
    if (/upkeep|loan/i.test(t)) return { intent: 'how-to-apply', text: APPLY_AND_UPKEEP }
    return { intent: 'how-to-apply', text: APPLY }
  }
  if (/what\s+do\s+(you|u)\s+mean.{0,40}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+institutional|chargers?/i.test(t)) {
    if (/upkeep/i.test(t)) return { intent: 'upkeep', text: UPKEEP }
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain|about|is\b/i.test(t)) {
    return { intent: 'upkeep', text: UPKEEP }
  }
  if (/difference.{0,20}(fees?|upkeep)|(fees?|upkeep).{0,15}(vs|versus|and).{0,15}(fees?|upkeep)/i.test(t)) {
    return { intent: 'upkeep-vs-fees' as IntentId, text: UPKEEP_VS_FEES }
  }
  if (/institution has not opened|has not opened a session|school.{0,30}not opened|session for loan applications yet/i.test(t)) {
    return { intent: 'missing-information', text: INSTITUTION_SESSION }
  }
  if (/missing\s*information|school\s*(not|no).{0,20}list/i.test(t)) {
    return { intent: 'missing-information', text: MISSING }
  }
  if (/repay|pay\s*back|after\s*nysc|when\s+does\s+repayment/i.test(t)) {
    return { intent: 'repayment', text: REPAYMENT }
  }
  if (/contact|support|ticket|hotline|customer\s*care|official\s+support/i.test(t)) {
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
    if (hit) {
      return reply(rawUser, imagePreview, opts.slots, hit.intent, hit.text)
    }
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
