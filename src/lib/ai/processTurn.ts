/**
 * Crash-safe NELFUND turn entry.
 * Official URLs: website nelf.gov.ng | signup portal.nelf.gov.ng | login portal.nelf.gov.ng/auth/login
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
  '**How NELFUND works**\n\n' +
  '1. **Full meaning:** Nigeria Education Loan Fund.\n' +
  '2. **Institutional charges** go to your **school**.\n' +
  '3. **Upkeep** (optional) goes to **you** if ticked.\n' +
  '4. **Who can apply:** Nigerian citizens, full-time, **public** tertiary institutions.\n' +
  `5. **Signup / apply:** ${PORTAL}\n` +
  `6. **Login / sign in:** ${LOGIN_URL}\n` +
  '7. Never pay an agent; never share OTP or password.\n' +
  `8. Official website: ${SITE}`

const SCAM =
  '**NELFUND is a real government student loan scheme**, not a private WhatsApp product.\n\n' +
  '- Never pay anyone to process or approve your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  `- Signup / apply only on ${PORTAL}\n` +
  `- Login only on ${LOGIN_URL}\n` +
  `- Official website: ${SITE}\n` +
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
  '**How to apply**\n\n' +
  `1. Open the signup / application portal: ${PORTAL}\n` +
  '2. Create an account **or** sign in if you already have one.\n' +
  `3. Login page (existing account): ${LOGIN_URL}\n` +
  '4. Complete profile: JAMB, NIN, BVN, bank details in your name.\n' +
  '5. Request the loan only when the official window is open — check the portal, not social media.\n' +
  `6. Stuck: campus NELFUND desk, then file a support ticket at ${ESUPPORT}.`

const APPLY_AND_UPKEEP =
  '**Apply for the loan and upkeep (same application)**\n\n' +
  `1. Open the official portal: ${PORTAL}\n` +
  `2. Sign in at ${LOGIN_URL} if you already have an account.\n` +
  '3. Complete profile: JAMB, NIN, BVN, bank account **in your name**.\n' +
  '4. Request **institutional charges** (school fees — paid to the school).\n' +
  '5. Tick **upkeep** in the **same** application if you want living support paid to you.\n' +
  '6. Submit only when the official window is open on the portal.\n' +
  `7. Stuck: campus NELFUND desk, then ${ESUPPORT}.\n\n` +
  'I will not invent an upkeep amount. Confirm figures only on the official portal.'

const ELIGIBILITY_100L =
  '**100 level / new admission**\n\n' +
  'If you are a Nigerian citizen with valid admission into a **public** tertiary institution (including 100 level / first year), you can usually start the same way as other full-time students.\n\n' +
  'Have ready: JAMB details, matric or admission number, NIN, BVN, bank in your name.\n\n' +
  `Confirm live rules on ${SITE} and ${PORTAL}. I will not invent a special 100-level amount.`

const ELIGIBILITY_PRIVATE =
  '**Private school / part-time**\n\n' +
  'NELFUND eligibility is set on the official portal. The usual path is **Nigerian citizens** in **public** tertiary institutions, **full-time**, with valid admission.\n\n' +
  'Private institutions and some programme types may **not** qualify.\n\n' +
  `Check whether **your** school and programme appear on ${PORTAL}. I will not invent a yes/no for a school I cannot see.`

const DOCUMENTS =
  '**What you typically need ready**\n\n' +
  '• Matriculation number\n• JAMB details\n• NIN\n• BVN\n• Bank account **in your name**\n• Admission into a public tertiary institution\n\n' +
  `Confirm live requirements on ${PORTAL}.`

const LOGIN =
  '**Log in / sign in**\n\n' +
  `Open the official login page:\n${LOGIN_URL}\n\n` +
  'Enter the email and password for your NELFUND account.\n' +
  `New account? Sign up at: ${PORTAL}\n` +
  `Still stuck after trying: open a support ticket at ${ESUPPORT}`

const FORGOT_PASSWORD =
  '**Forgot password**\n\n' +
  `1. Open the official login page: ${LOGIN_URL}\n` +
  '2. Tap **Forgot password** (or Reset password) on that page.\n' +
  '3. Enter the email linked to your NELFUND account.\n' +
  '4. Check inbox and spam for the reset link or code, then set a new password.\n' +
  `5. If no email arrives, open a support ticket here: ${ESUPPORT}`

const EMAIL_USED =
  '**Email already used / already registered**\n\n' +
  'That email is already tied to a NELFUND account.\n\n' +
  `1. Go to the official login page: ${LOGIN_URL}\n` +
  '2. Sign in with that **same email** and your password.\n' +
  '3. If you do not remember the password: on the login page, tap **Forgot password** and reset for that same email.\n' +
  '4. Do not create a new account with a different email unless official support tells you to.\n' +
  `5. Still blocked: open a support ticket at ${ESUPPORT} and attach a screenshot.`

const UPKEEP =
  '**Upkeep** is optional living support under NELFUND.\n\n' +
  '- Tick it in the same session as institutional charges when the window is open.\n' +
  '- Paid to **your** bank account.\n' +
  '- Institutional charges still go to the **school**.\n' +
  `- Confirm amounts only on ${PORTAL}.`

const CHARGES =
  '**Institutional charges** means school fees / official charges your school bills.\n\n' +
  '- That part of the loan is paid **to the school**.\n' +
  '- **Upkeep** (if requested) is separate and paid to you.\n' +
  `- Confirm amounts only on ${PORTAL}.`

const UPKEEP_VS_FEES =
  '**School fees vs upkeep**\n\n' +
  '1. **Institutional charges (school fees)** → paid to your **school**.\n' +
  '2. **Upkeep** (optional) → paid to **you** if you tick it.\n' +
  `3. Confirm any figure only on ${PORTAL}.`

const MISSING =
  '**Missing information / school not on the list**\n\n' +
  'Usually the school has not finished uploading your record.\n\n' +
  '1. Confirm you attend a public institution.\n' +
  '2. Ask the campus NELFUND desk if your data is uploaded.\n' +
  `3. Retry ${PORTAL}. Still failing: open a support ticket at ${ESUPPORT}.`

const PENDING =
  '**Application pending**\n\n' +
  'Pending usually means the request is still being processed or the school/portal has not finished a step.\n\n' +
  '1. Note the exact status text on the portal.\n' +
  '2. Confirm with your campus NELFUND desk if the school must act.\n' +
  `3. Still stuck after waiting: open a support ticket at ${ESUPPORT} with a screenshot.\n\n` +
  'I will not invent how many days it takes.'

const JAMB =
  '**Invalid / problem with JAMB number**\n\n' +
  '1. Re-check the JAMB number matches what JAMB and your school have on file.\n' +
  '2. Confirm your school has uploaded your record for this session.\n' +
  `3. Retry ${PORTAL}. Still failing: campus desk, then open a support ticket at ${ESUPPORT}.`

const REPAYMENT =
  '**Repayment**\n\n' +
  'Repayment starts after the applicable study / NYSC period under **official** NELFUND rules.\n\n' +
  `Confirm on ${SITE} and ${PORTAL}. I will not invent a start date, percentage, or jail term.`

const LOAN_VS_SCHOLARSHIP =
  '**Loan, not a scholarship**\n\n' +
  'NELFUND is a **student loan** (interest-free under official rules). It is not free money and not a scholarship.\n\n' +
  `Official: ${SITE} · ${PORTAL}`

const INTEREST =
  '**Interest**\n\n' +
  'NELFUND is described under official rules as **interest-free** for eligible student loans.\n\n' +
  `Confirm the current policy on ${SITE} and ${PORTAL}. I will not invent rates.`

const OPEN_STATUS =
  '**Is application open?**\n\n' +
  'Open/closed windows change. Do **not** trust random WhatsApp posts for dates.\n\n' +
  `1. Check ${PORTAL} and ${SITE} for the live status.\n` +
  '2. You can still prepare documents (JAMB, NIN, BVN, bank in your name).\n' +
  'I will not invent a deadline.'

const CONTACT =
  '**Official channels**\n\n' +
  `• **Website** (news & policy): ${SITE}\n` +
  `• **Sign up / apply**: ${PORTAL}\n` +
  `• **Log in / sign in**: ${LOGIN_URL}\n` +
  `• **Support ticket** (file a complaint or get help from NELFUND): ${ESUPPORT}\n\n` +
  'I will not invent WhatsApp agents or private numbers.'

const LOGIN_LINK_ONLY =
  `**Official login / sign-in link**\n\n${LOGIN_URL}\n\n` +
  'Use this page only to sign in with your existing NELFUND account.'

const SIGNUP_LINK_ONLY =
  `**Official sign-up / application portal**\n\n${PORTAL}\n\n` +
  'Use this to create an account or start an application when the window is open.'

const SITE_LINK_ONLY =
  `**Official NELFUND website**\n\n${SITE}\n\n` +
  'News, policies, and official information.'

const TICKET_LINK_ONLY =
  `**File a support ticket with NELFUND**\n\n` +
  `Open a ticket here: ${ESUPPORT}\n\n` +
  'Use this when the portal is stuck, email reset never arrives, or school data is wrong after you have tried the steps. Attach a clear screenshot of the error.'

const UNKNOWN =
  'I do not have a reliable official answer for that exact detail.\n\n' +
  `Please file a support ticket with NELFUND so their team can check your case: ${ESUPPORT}\n\n` +
  `You can also confirm general information on ${SITE} and ${PORTAL}.`

function suggest(intent: string, userText?: string): string[] {
  const t = (userText || '').toLowerCase()
  const map: Record<string, string[]> = {
    'what-is-nelfund': ['Who can apply (eligibility)?', 'How do I apply step by step?'],
    eligibility: ['How do I apply step by step?', 'What documents do I need?'],
    'how-to-apply': ['How do I log in?', 'What is upkeep vs school fees?'],
    documents: ['How do I apply step by step?', 'Who can apply (eligibility)?'],
    'documents-needed': ['How do I apply step by step?', 'Who can apply (eligibility)?'],
    'portal-login': ['I forgot my password', 'Email already used on the portal'],
    'password-reset': ['How do I log in?', 'Email already used on the portal'],
    'email-already-used': ['I forgot my password', 'How do I log in?'],
    upkeep: ['What is institutional charges?', 'How do I apply step by step?'],
    'institutional-charges': ['What is upkeep?', 'How do I apply step by step?'],
    'upkeep-vs-fees': ['How do I apply step by step?', 'Who can apply (eligibility)?'],
    'missing-information': ['My school is not on the list', 'How do I contact official support?'],
    'school-not-found': ['Portal shows missing information', 'How do I contact official support?'],
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
  if (/upkeep/i.test(t) && /apply|loan|tick/i.test(t)) return map.upkeep
  if (/private|part[\s-]*time|100\s*level|first\s*year/i.test(t)) return map.eligibility
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
  if (/is\s+(the\s+)?(loan|application|nelfund).{0,30}open|window\s+open|application\s+open/i.test(t)) {
    return { intent: 'current-information', text: OPEN_STATUS }
  }
  if (/document|what\s+(do\s+i|to)\s+need|requirements?/i.test(t)) {
    return { intent: 'documents' as IntentId, text: DOCUMENTS }
  }
  if (/pending|still\s+processing|application\s+is\s+pending/i.test(t)) {
    return { intent: 'pending' as IntentId, text: PENDING }
  }
  if (/invalid\s+jamb|jamb\s+(number|error|invalid|problem)/i.test(t)) {
    return { intent: 'jamb' as IntentId, text: JAMB }
  }
  if (/private\s*(school|uni|university|poly)|part[\s-]*time|sandwich|noun/i.test(t) && /eligib|can\s+i\s+apply|qualify/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY_PRIVATE }
  }
  if (/(100\s*level|first\s*year|fresh(er|man)|just\s+(got|get)\s+admission)/i.test(t) && /eligib|can\s+i\s+apply|qualify|apply/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY_100L }
  }
  if (/^eligibility\s*[!?.]?$/i.test(t) || /\bwho\s+can\s+apply\b|\bam\s+i\s+eligible\b|can\s+i\s+apply/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (/what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|how\s+(does\s+|dis\s+)?(nelfund|this|it|dis).{0,25}(work|dey\s*work)|go\s*through.{0,30}nelfund|whole\s+nelfund|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund|nelfund\s+thing\s+work/i.test(t)) {
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
  if (/how\s+(do\s+i|to|i\s+go)\s*apply|step\s*by\s+step|i\s+wan(t)?\s*(to\s*)?apply|apply\s+only\s+on\s+the\s+official|apply.{0,40}(loan|upkeep)|meant.{0,20}(loan|upkeep)/i.test(t)) {
    if (/upkeep|loan/i.test(t)) return { intent: 'how-to-apply', text: APPLY_AND_UPKEEP }
    return { intent: 'how-to-apply', text: APPLY }
  }
  if (/what\s+do\s+(you|u)\s+mean.{0,40}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+institutional|chargers?/i.test(t) && /mean|what|wetin|explain|institutional/i.test(t)) {
    if (/upkeep/i.test(t)) return { intent: 'upkeep', text: UPKEEP }
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain|about|is\b/i.test(t)) {
    return { intent: 'upkeep', text: UPKEEP }
  }
  if (/difference.{0,20}(fees?|upkeep)|(fees?|upkeep).{0,15}(vs|versus|and).{0,15}(fees?|upkeep)/i.test(t)) {
    return { intent: 'upkeep-vs-fees' as IntentId, text: UPKEEP_VS_FEES }
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
