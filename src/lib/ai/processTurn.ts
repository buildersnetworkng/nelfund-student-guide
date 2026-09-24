/**
 * Crash-safe NELFUND turn entry.
 * Zero fragile imports beyond conversation + types.
 * Separate intents: meaning, login, forgot-password, email-already-used (never mixed).
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

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

const MEANING =
  '**NELFUND** stands for **Nigeria Education Loan Fund**.\n\n' +
  'It is a **government** student loan scheme (interest-free under official rules) for eligible students in **public** tertiary institutions.\n\n' +
  '- **Institutional charges** (school fees) go to your **school**.\n' +
  '- **Upkeep** (optional) goes to **you** if you request it in the same application.\n' +
  `- Official sites: ${SITE} · ${PORTAL}\n\n` +
  'Ask next if you want eligibility, how to apply, or portal help.'

const OVERVIEW =
  '**How NELFUND works**\n\n' +
  '1. **Full meaning:** Nigeria Education Loan Fund — interest-free student loans for eligible students in **public** tertiary institutions.\n' +
  '2. **Institutional charges** (school fees) go to your **school**.\n' +
  '3. **Upkeep** (optional living support) goes to **you** if you tick it in the same application.\n' +
  '4. **Who can apply:** Nigerian citizens with full-time admission into a public uni / poly / college of education.\n' +
  `5. **How to apply:** Sign in or create account at ${PORTAL} — complete profile (JAMB, NIN, BVN).\n` +
  '6. **Never pay** an agent; never share OTP or password.\n' +
  `7. Official: ${SITE} · ${PORTAL}\n\n` +
  'Ask next about eligibility, how to apply, upkeep, portal errors, or repayment.'

const SCAM =
  '**NELFUND is a real government student loan scheme** (Nigeria Education Loan Fund), not a private WhatsApp agent product.\n\n' +
  '**Stay safe**\n' +
  '- Never pay anyone to process or approve your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  `- Apply only on ${PORTAL} and ${SITE}.\n` +
  `- Official tickets: ${ESUPPORT}\n\n` +
  'Anyone on WhatsApp asking for money or codes is a **scam**. Report and block them.'

const ELIGIBILITY =
  '**Eligibility**\n\n' +
  '• Nigerian citizen\n' +
  '• Admission into a **public** university, polytechnic, college of education, or vocational school\n' +
  '• **Full-time** student with valid admission (100-level, 200-level, etc. are not blocked by year alone)\n\n' +
  'Have ready: matric number, JAMB details, NIN, BVN, bank account in your name.\n\n' +
  `Confirm on ${PORTAL} and ${SITE}. I will not invent extra rules.`

const APPLY =
  '**How to apply**\n\n' +
  `1. Open ${PORTAL}\n` +
  '2. Create an account **or** sign in if you already have one.\n' +
  '3. Complete profile: JAMB, NIN, BVN, bank details in your name.\n' +
  '4. Use Request for Student Loan only when the official window is open — confirm dates on the portal, not social media.\n' +
  `5. Stuck: campus NELFUND desk, then ${ESUPPORT}.`

/** Login only — no last-year email story mixed in */
const LOGIN =
  '**How to log in**\n\n' +
  `1. Open ${PORTAL} (or ${SITE} and choose Sign in).\n` +
  '2. Enter the email and password for your NELFUND account.\n' +
  '3. If login fails, read the **exact** message on the screen (wrong password, email not found, etc.).\n' +
  `4. Still blocked: ${ESUPPORT} with a screenshot.`

/** Forgot password only — separate from email-already-used */
const FORGOT_PASSWORD =
  '**Forgot password**\n\n' +
  `1. Open ${PORTAL} and use **Forgot password** / **Reset password** (wording may vary on the page).\n` +
  '2. Enter the email linked to your NELFUND account.\n' +
  '3. Check that email (and spam) for the reset link or code.\n' +
  '4. Set a new password and sign in.\n' +
  `5. No reset email arrives: ${ESUPPORT} — do not create a second account with a different email unless support directs you.`

/** Email already used / already registered — separate from forgot password */
const EMAIL_USED =
  '**Email already used / already registered**\n\n' +
  'The portal is saying that email is already tied to an account.\n\n' +
  '1. **Sign in** with that email (do not open a brand-new account with a different email).\n' +
  `2. If you do not remember the password: use **Forgot password** on ${PORTAL} for **that same email**.\n` +
  '3. Do not treat “I used this email before” as a special rule — it only means an account may already exist for that address.\n' +
  `4. Still stuck after reset: ${ESUPPORT} with a screenshot of the exact message.`

const UPKEEP =
  '**Upkeep** is optional living support under NELFUND.\n\n' +
  '- Tick it in the **same** session as institutional charges when the loan window is open.\n' +
  '- Paid to **your** bank account on the profile.\n' +
  '- Institutional charges still go to the **school**.\n' +
  `- I will not invent a monthly amount — confirm on ${PORTAL}.`

const CHARGES =
  '**Institutional charges** means the school fees / official charges your school bills.\n\n' +
  '- That part of the NELFUND loan is paid **to the school**, not into your personal account.\n' +
  '- **Upkeep** (if you request it) is separate and paid to you.\n' +
  `- Confirm amounts only on ${PORTAL}.`

function suggest(intent: string): string[] {
  if (intent === 'scam-safety') {
    return ['How do I apply only on the official portal?', 'How do I log in?', 'Who can apply (eligibility)?']
  }
  if (intent === 'eligibility') {
    return ['How do I apply step by step?', 'What documents do I need?', 'What is upkeep?']
  }
  if (intent === 'what-is-nelfund') {
    return ['Who can apply (eligibility)?', 'How do I apply step by step?', 'Is NELFUND a scam?']
  }
  if (intent === 'how-to-apply') {
    return ['How do I log in?', 'What is upkeep vs school fees?', 'Portal shows missing information']
  }
  if (intent === 'portal-login') {
    return ['I forgot my password', 'Portal shows missing information', 'How do I contact support?']
  }
  if (intent === 'password-reset') {
    return ['How do I log in?', 'Email already used on the portal', 'How do I contact support?']
  }
  if (intent === 'email-already-used') {
    return ['I forgot my password', 'How do I log in?', 'How do I contact support?']
  }
  return ['Who can apply (eligibility)?', 'How do I apply step by step?', 'Is NELFUND a scam?']
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
    nextActions: [PORTAL, SITE],
    clarifyingQuestions: suggest(String(intent)),
    evidence: [] as [],
    sources: [
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
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

  // Full meaning / acronym first (before general overview)
  if (
    /full\s+meaning|meaning\s+of\s+nelfund|nelfund\s+stand\s+for|what\s+does\s+nelfund\s+mean|nelfund\s+means|acronym|abbreviation|wetin\s+nelfund\s+mean/i.test(
      t,
    )
  ) {
    return { intent: 'what-is-nelfund', text: MEANING }
  }

  if (/scam|fraud|fake\s*(loan|nelfund)|told\s+me.{0,50}scam|nelfund.{0,25}scam|is\s+(this|it|nelfund).{0,20}scam/i.test(t)) {
    return { intent: 'scam-safety', text: SCAM }
  }
  if (/^eligibility\s*[!?.]?$/i.test(t) || /\bwho\s+can\s+apply\b|\bam\s+i\s+eligible\b|can\s+i\s+apply/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (
    /what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|how\s+(does\s+|e\s+)?(nelfund|this|dis|it).{0,40}(dey\s+)?work|how\s+dis\s+nelfund|nelfund.{0,25}dey\s+work|go\s*through.{0,30}nelfund|whole\s+nelfund|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund|why\s+nelfund/i.test(
      t,
    )
  ) {
    return { intent: 'what-is-nelfund', text: OVERVIEW }
  }

  // Forgot password — never mix with email-already-used story
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*reset|can'?t\s*remember\s*(my\s*)?password/i.test(t)) {
    return { intent: 'password-reset' as IntentId, text: FORGOT_PASSWORD }
  }

  // Email already used / already registered — separate path
  if (
    /email\s+(already\s+)?(used|registered|taken|exist)|already\s+(used|registered|exist).{0,20}email|showing\s+(used|already).{0,15}email|email.{0,20}already/i.test(
      t,
    )
  ) {
    return { intent: 'email-already-used' as IntentId, text: EMAIL_USED }
  }

  // Generic login — no last-year email paragraph
  if (/how\s+(do\s+i|to|i\s+go)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(t)) {
    return { intent: 'portal-login', text: LOGIN }
  }

  if (/how\s+(do\s+i|to|i\s+go)\s*apply|step\s*by\s*step|i\s+wan(t)?\s*(to\s*)?apply/i.test(t)) {
    return { intent: 'how-to-apply', text: APPLY }
  }
  if (/what\s+do\s+(you|u)\s+mean.{0,40}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+institutional/i.test(t)) {
    if (/upkeep/i.test(t)) return { intent: 'upkeep', text: UPKEEP }
    return { intent: 'institutional-charges', text: CHARGES }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain|about|is\b/i.test(t)) {
    return { intent: 'upkeep', text: UPKEEP }
  }
  if (/difference.{0,20}(fees?|upkeep)|(fees?|upkeep).{0,15}(vs|versus|and).{0,15}(fees?|upkeep)/i.test(t)) {
    return {
      intent: 'upkeep-vs-fees' as IntentId,
      text:
        '**School fees vs upkeep**\n\n' +
        '1. **Institutional charges (school fees)** go from NELFUND **to your school**.\n' +
        '2. **Upkeep** is optional living support paid **to you** if you tick it in the same session.\n' +
        `3. Confirm any amount only on ${PORTAL}. I will not invent figures.`,
    }
  }
  if (/missing\s*information|school\s*(not|no).{0,20}list/i.test(t)) {
    return {
      intent: 'missing-information',
      text:
        '**Missing information / school not on the list**\n\n' +
        'Usually the school has not finished uploading your record.\n\n' +
        '1. Confirm you attend a public institution.\n' +
        '2. Ask the campus NELFUND desk if your data is uploaded.\n' +
        `3. Retry ${PORTAL}. Still failing: ${ESUPPORT}`,
    }
  }
  if (/repay|pay\s*back|after\s*nysc/i.test(t)) {
    return {
      intent: 'repayment',
      text:
        '**Repayment** starts after the applicable NYSC or study period under official NELFUND rules.\n\n' +
        `Confirm on ${SITE} and ${PORTAL}. I will not invent a start date, percentage, or jail term.`,
    }
  }
  if (/contact|support|ticket|hotline|customer\s*care/i.test(t)) {
    return {
      intent: 'contact-support',
      text: `**Official support only**\n\n- Tickets: ${ESUPPORT}\n- Website: ${SITE}\n- Portal: ${PORTAL}\n\nI will not invent a WhatsApp group or agent number.`,
    }
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
    return reply(rawUser || '[message]', imagePreview, opts.slots, 'what-is-nelfund', OVERVIEW)
  }
}

export { createInitialSlots, createWelcomeMessage } from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
