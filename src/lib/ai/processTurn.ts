/**
 * Crash-safe NELFUND turn entry.
 * Zero fragile imports beyond conversation + types.
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

const SCAM =
  '**NELFUND is a real government student loan scheme** (Nigeria Education Loan Fund), not a private WhatsApp agent product.\n\n' +
  '**Stay safe**\n' +
  '- Never pay anyone to process or approve your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  `- Apply only on ${PORTAL} and ${SITE}.\n` +
  `- Official tickets: ${ESUPPORT}\n\n` +
  'Anyone on WhatsApp asking for money or codes is a **scam**. Report and block them.'

const OVERVIEW =
  '**How NELFUND works**\n\n' +
  '1. **What it is:** Interest-free student loans for eligible students in **public** tertiary institutions (Nigeria Education Loan Fund).\n' +
  '2. **Institutional charges** (school fees) go to your **school**.\n' +
  '3. **Upkeep** (optional living support) goes to **you** if you tick it in the same application.\n' +
  '4. **Who can apply:** Nigerian citizens with full-time admission into a public uni / poly / college of education.\n' +
  `5. **How to apply:** Sign in or create account at ${PORTAL} — complete profile (JAMB, NIN, BVN).\n` +
  '6. **Never pay** an agent; never share OTP or password.\n' +
  `7. Official: ${SITE} · ${PORTAL}\n\n` +
  'Ask next about eligibility, how to apply, upkeep, portal errors, or repayment.'

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
  '2. Create account or sign in with the same email (if you registered before, do not create a new account).\n' +
  '3. Complete profile: JAMB, NIN, BVN, bank details in your name.\n' +
  '4. Use Request for Student Loan only when the official window is open — confirm dates on the portal, not social media.\n' +
  `5. Stuck: campus NELFUND desk, then ${ESUPPORT}.`

const LOGIN =
  '**How to log in to NELFUND**\n\n' +
  `1. Open ${PORTAL} and use **Sign in** with the email you registered.\n` +
  `2. You can also sign in from ${SITE}.\n` +
  '3. If that email was used before (including last year), do **not** create a new account — sign in or reset password on the same email.\n' +
  `4. First time only: create account at ${PORTAL}.\n` +
  `5. Forgot password: use reset on ${PORTAL} or ${SITE}. Tickets: ${ESUPPORT}.`

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
    clarifyingQuestions: suggest(intent),
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

  if (/scam|fraud|fake\s*(loan|nelfund)|told\s+me.{0,50}scam|nelfund.{0,25}scam|is\s+(this|it|nelfund).{0,20}scam/i.test(t)) {
    return { intent: 'scam-safety', text: SCAM }
  }
  if (/^eligibility\s*[!?.]?$/i.test(t) || /\bwho\s+can\s+apply\b|\bam\s+i\s+eligible\b|can\s+i\s+apply/i.test(t)) {
    return { intent: 'eligibility', text: ELIGIBILITY }
  }
  if (
    /what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|how\s+(does\s+)?(nelfund|this|it).{0,25}work|go\s*through.{0,30}nelfund|whole\s+nelfund|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund|why\s+nelfund/i.test(
      t,
    )
  ) {
    return { intent: 'what-is-nelfund', text: OVERVIEW }
  }
  if (/how\s+(do\s+i|to)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(t)) {
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
      intent: 'upkeep-vs-fees',
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

  // Always try local route first — never depends on heavy playbook chain
  try {
    const hit = route(rawUser)
    if (hit) {
      return reply(rawUser, imagePreview, opts.slots, hit.intent, hit.text)
    }
  } catch {
    /* continue */
  }

  // Fall through to conversation core
  try {
    return await processUserTurnCore(opts)
  } catch {
    // Absolute last resort — still a real NELFUND answer
    const hit = route(rawUser)
    if (hit) return reply(rawUser, imagePreview, opts.slots, hit.intent, hit.text)
    return reply(rawUser || '[message]', imagePreview, opts.slots, 'what-is-nelfund', OVERVIEW)
  }
}

export { createInitialSlots, createWelcomeMessage } from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
