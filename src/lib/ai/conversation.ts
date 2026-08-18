/**
 * Offline conversational agent — primary intelligence when no LLM API is configured.
 * Task-aware: login, contacts, drafts, screenshots, eligibility, upload checks.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
import type {
  AgentCapability,
  ConversationTurn,
  GroundedAnswer,
  IntentId,
} from './types'
import { understandPortalText } from './screenshotUnderstand'

export type ConversationPhase = 'open' | 'clarify' | 'gather' | 'act' | 'resolve'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  jamb: string | null
  nin: string | null
  problemSummary: string | null
  objective: string | null
  phase: ConversationPhase
  awaitingInstitution: boolean
  pendingClarify: string | null
  lastCapability: AgentCapability | null
  errorConfirmed: boolean
  actionsTaken: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  answer?: GroundedAnswer | null
  imagePreview?: string | null
  isFollowUp?: boolean
  timestamp: number
}

export interface AgentTurnResult {
  messages: ChatMessage[]
  slots: ConversationSlots
  diagnosed: boolean
  capability: AgentCapability
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createInitialSlots(uiInstitutionId?: string | null): ConversationSlots {
  let institutionId = uiInstitutionId || null
  let institutionName: string | null = null
  if (institutionId) {
    const inst = getInstitution(institutionId)
    if (inst) institutionName = inst.name
  }
  return {
    institutionId,
    institutionName,
    intent: null,
    exactError: null,
    studentName: null,
    matric: null,
    jamb: null,
    nin: null,
    problemSummary: null,
    objective: null,
    phase: 'open',
    awaitingInstitution: false,
    pendingClarify: null,
    lastCapability: null,
    errorConfirmed: false,
    actionsTaken: [],
  }
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: uid('sys'),
    role: 'assistant',
    text: 'Ask about NELFUND in your own words — portal errors, school contacts, drafts, eligibility, or current status.',
    timestamp: Date.now(),
  }
}

export function extractErrorSignals(text: string): string | null {
  const m =
    text.match(/missing\s*information[^.]{0,80}/i) ||
    text.match(/record\s*not\s*found[^.]{0,40}/i) ||
    text.match(/no\s*school\s*info(?:rmation)?[^.]{0,40}/i)
  return m ? m[0].trim() : null
}

function mergeQuery(user: string, ocr: string | null): string {
  if (user && ocr) return `${user}\n${ocr}`
  return user || ocr || ''
}

function applyInstitutionToSlots(
  slots: ConversationSlots,
  text: string,
  uiInstitutionId: string | null,
): ConversationSlots {
  const next = { ...slots }
  if (uiInstitutionId && !next.institutionId) {
    next.institutionId = uiInstitutionId
    const inst = getInstitution(uiInstitutionId)
    if (inst) next.institutionName = inst.name
  }
  const found = resolveInstitutionFromText(text)
  if (found) {
    next.institutionId = found
    const inst = getInstitution(found)
    if (inst) next.institutionName = inst.name
    next.awaitingInstitution = false
  }
  return next
}

function conversationalFallback(intent: IntentId): string {
  if (intent === 'pending-application')
    return 'If your **application status** is pending, that usually means still processing — not rejected. (Dashboard “Pending Loans” counters are different.)'
  if (intent === 'missing-information')
    return 'Missing information on the portal is usually about school record matching.'
  return 'Understood.'
}

function lightAnswer(
  intent: IntentId,
  text: string,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.7,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const history = opts.history || []
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const combined = mergeQuery(rawUser, ocr)

  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
    imagePreview: opts.imagePreview || null,
    timestamp: Date.now(),
  }

  let slots: ConversationSlots = applyInstitutionToSlots(
    { ...opts.slots, actionsTaken: [...(opts.slots.actionsTaken || [])] },
    combined,
    opts.uiInstitutionId ?? null,
  )

  const err = extractErrorSignals(combined)
  if (err) {
    slots.exactError = err
    slots.errorConfirmed = true
    slots.problemSummary = err
    if (slots.pendingClarify === 'exact-error') slots.pendingClarify = null
  }

  {
    const screen = understandPortalText(combined || ocr || rawUser || '')
    const allowErrorScreen = !!(ocr && ocr.trim().length >= 8)
    if (
      screen &&
      (screen.kind === 'dashboard' ||
        screen.kind === 'login' ||
        (screen.kind === 'error' && allowErrorScreen))
    ) {
      if (screen.exactError) {
        slots.exactError = screen.exactError
        slots.problemSummary = screen.exactError
        slots.errorConfirmed = true
      }
      const answer: GroundedAnswer = {
        hasEvidence: true,
        intent: screen.kind === 'error' ? 'missing-information' : 'current-information',
        confidence: 0.9,
        responseMode: 'conversation',
        problem: screen.exactError || screen.kind,
        answer: screen.explanation,
        whatThisMeans: null,
        nextActions: screen.nextActions.slice(0, 4),
        clarifyingQuestions: [],
        evidence: [],
        sources: [
          {
            id: 'portal',
            label: 'NELFUND portal',
            url: 'https://portal.nelf.gov.ng/',
            official: true,
          },
        ],
        video: null,
        insufficientReason: null,
        officialFallbackUrl: 'https://portal.nelf.gov.ng/',
        escalation: null,
      }
      slots.phase = 'resolve'
      slots.lastCapability = 'conversation'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  const intentMeta = classifyIntent(combined || rawUser, history)
  const intent = intentMeta.intent
  slots.intent = intent

  const capability = resolveCapability(intent, combined || rawUser)
  slots.lastCapability = capability

  if (/password\s*(is|=|:)|my\s*password\s*is|otp\s*(is|=)/i.test(combined)) {
    const answer = lightAnswer(
      'portal-login',
      'Do not share passwords, OTP, or PINs in chat — I cannot and should not use them. Sign in only at https://portal.nelf.gov.ng/ and use official reset options if you are locked out.',
      { next: ['https://portal.nelf.gov.ng/', 'Never send credentials to anyone'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (
    capability === 'portal-login' ||
    intent === 'portal-login' ||
    /which\s*(website|link|url|site).{0,40}(login|log\s*in|sign\s*in|application|continue)/i.test(
      combined,
    ) ||
    /continue\s*(my\s*)?application/i.test(combined)
  ) {
    const answer = lightAnswer(
      'portal-login',
      'Use the official student portal only: https://portal.nelf.gov.ng/ — never third-party login pages.',
      {
        next: ['Open https://portal.nelf.gov.ng/', 'Never share OTP or password in chat'],
      },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*reset|can'?t\s*login|cannot\s*login|unable\s*to\s*login/i.test(combined)) {
    const answer = lightAnswer(
      'portal-login',
      'I cannot reset passwords for you. Use only the official portal:\n\n1. Open https://portal.nelf.gov.ng/\n2. Use the portal’s own **Forgot password / reset** option if shown.\n3. Never share OTP or password here or on social media.\n4. If reset fails, open a ticket at https://nelfund.esupport.ng/create (no passwords in the ticket).',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (/official\s*(website|site|link|twitter|x\b|facebook|channel)|where\s*(is|to\s*find)\s*(the\s*)?(website|portal|site)|show\s*me\s*(the\s*)?official/i.test(combined)) {
    const answer = lightAnswer(
      'portal-login',
      'Official channels only:\n\n• Student portal: https://portal.nelf.gov.ng/\n• Main site: https://nelf.gov.ng/\n• Support tickets: https://nelfund.esupport.ng/create\n\nIgnore third-party “agents” and random social accounts asking for fees or passwords.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (
    /contact\s*nelfund|nelfund\s*support|nelfund\s*help\s*desk|esupport|support\s*ticket/i.test(combined) &&
    !/school|institution|university|poly|college/i.test(combined)
  ) {
    const answer = lightAnswer(
      'contact-support',
      'For **NELFUND** (not your school):\n\n• Support tickets: https://nelfund.esupport.ng/create\n• Portal: https://portal.nelf.gov.ng/\n• Site: https://nelf.gov.ng/\n\nDescribe the issue clearly, attach a screenshot with passwords/OTP hidden. Do not pay anyone claiming to “fast-track” your loan.',
      { next: ['https://nelfund.esupport.ng/create', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'contact-lookup',
    }
  }

  if (
    /approve|approval|dem\s*approve|how\s*(i|to)\s*(take\s*)?know.*(status|approve)|check\s*(my\s*)?(status|application)|application\s*status/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'pending-application',
      'You check status **on the official portal**, not on social media:\n\n1. Log in at https://portal.nelf.gov.ng/\n2. Open your application / loan dashboard.\n3. Read the status shown (e.g. pending, approved, declined) and any reason text.\n\n**Pending** usually means still processing — not the same as dashboard “Pending Loans = 0.”\n**Approved institutional charges** are paid to the school, not always as cash in your account.\nIf status is unclear, screenshot the status area (hide secrets) and ask again, or ticket https://nelfund.esupport.ng/create.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/scam|fraud|fake\s*nelfund|is\s*(it\s*)?(real|legit|genuine)/i.test(combined)) {
    const answer = lightAnswer(
      'current-information',
      '**NELFUND is a real Federal Government student loan programme.** Scams usually appear as people DM-ing you to “process” the loan for a fee, fake websites, or asking for your password/OTP.\n\nStay safe:\n• Only use https://portal.nelf.gov.ng/ and https://nelf.gov.ng/\n• Never pay a middleman\n• Never share OTP, password, or NIN screenshots with strangers\n• Support: https://nelfund.esupport.ng/create',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/what\s*documents|which\s*documents|documents?\s*(do\s*i\s*)?need|requirements?\s*to\s*apply/i.test(combined)) {
    const answer = lightAnswer(
      'eligibility',
      'Exact document lists can change by cycle. Typically you need accurate **personal identity and academic matching data** (e.g. NIN, JAMB where required, admission/matric details) so your school record can match the portal.\n\nDo this:\n1. Read current requirements on https://nelf.gov.ng/\n2. Apply only at https://portal.nelf.gov.ng/\n3. Confirm with your school that your name, NIN, JAMB, and matric are correct on their side.\n\nI will not invent a fixed document checklist if the official site has updated it.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (/jamb.*(not\s*)?verif|verif.*jamb|invalid\s*jamb/i.test(combined)) {
    const answer = lightAnswer(
      'jamb-verification',
      'If JAMB is not verifying on the portal:\n\n1. Confirm the **exact JAMB registration number** matches what JAMB and your school hold.\n2. Check for typos (O vs 0, leading zeros).\n3. Ask your institution’s ICT/Registry whether your JAMB number was submitted correctly for NELFUND.\n4. Retry on https://portal.nelf.gov.ng/ after corrections.\n5. If still stuck, ticket https://nelfund.esupport.ng/create with a screenshot (no passwords).',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/nin.*(not\s*)?verif|verif.*nin|nin\s*(verification\s*)?fail/i.test(combined)) {
    const answer = lightAnswer(
      'nin-verification',
      'If NIN verification fails:\n\n1. Confirm your **11-digit NIN** is correct and matches NIMC records.\n2. Ensure the **name on NIN** matches school and portal names (middle names/order).\n3. Retry later if NIMC/portal is temporarily unavailable.\n4. Do not share full NIN + OTP in chat.\n5. School desk + https://nelfund.esupport.ng/create if it keeps failing after data is confirmed correct.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/post\s*graduate|postgraduate|masters|phd|pg\s*student/i.test(combined)) {
    const answer = lightAnswer(
      'eligibility',
      'Whether postgraduate students can apply depends on **current official NELFUND rules for that cycle**. This guide will not invent a yes/no. Check eligibility on https://nelf.gov.ng/ and the portal https://portal.nelf.gov.ng/ for the active application window.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (
    /\b(is|are)\s+\w+\s+eligib|eligib(le|ility)\s+(for\s+)?(oou|lasu|unilag|ui|unn)\b|\b(oou|lasu|unilag)\b.*eligib/i.test(
      combined,
    ) ||
    /^\s*is\s+\w+\s+eligib/i.test(combined)
  ) {
    resolveInstitutionFromText(combined)
    const answer = lightAnswer(
      'eligibility',
      `Whether **${slots.institutionName || 'a given institution'}** is eligible depends on NELFUND’s current participating-institutions list and the active cycle — not on a guess from this chat.\n\n1. Check official lists / FAQs on https://nelf.gov.ng/\n2. See if the school appears when you use https://portal.nelf.gov.ng/\n3. Ask your school’s NELFUND desk if they are onboarded and submitting student data.\n\nI will not invent a permanent yes/no for any single school.`,
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [userMsg, { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() }],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (capability === 'contact-lookup' || intent === 'contact-lookup' || intent === 'contact-support') {
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
      slots.phase = 'clarify'
      const answer = lightAnswer(
        'contact-lookup',
        'Which institution do you attend? Once I know the school, I can point you to curated contacts or official channels — I will not invent email addresses.',
      )
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'contact-lookup',
      }
    }
    try {
      const esc = buildEscalationPlan('missing-information' as IntentId, slots.institutionId)
      const described = describeContactLookup(slots.institutionName, esc)
      const answer = lightAnswer('contact-lookup', described, {
        next: ['https://nelfund.esupport.ng/create', 'https://portal.nelf.gov.ng/'],
      })
      if (esc) answer.escalation = esc
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'contact-lookup',
      }
    } catch {
      /* fall through */
    }
  }

  if (
    capability === 'email-draft' ||
    intent === 'email-draft' ||
    /draft|write\s*(an?\s*)?(email|message)/i.test(combined)
  ) {
    if (!slots.institutionId && !/nelfund/i.test(combined)) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
      slots.phase = 'clarify'
      const answer = lightAnswer(
        'email-draft',
        'I can draft that. Which school should the message go to, and is it for your institution office or NELFUND support?',
      )
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'email-draft',
      }
    }
    try {
      const draft = draftSupportEmail({
        institutionId: slots.institutionId,
        institutionName: slots.institutionName,
        exactError: slots.exactError || slots.problemSummary,
        recipient: /nelfund/i.test(combined) ? 'nelfund' : 'school',
      })
      const body = `Here is a draft you can adapt:\n\nSubject: ${draft.subject}\n\n${draft.body}`
      const answer = lightAnswer('email-draft', body, {
        next: ['Copy and send only via official channels', 'https://nelfund.esupport.ng/create'],
      })
      answer.draft = draft
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'email-draft',
      }
    } catch {
      /* fall through */
    }
  }

  if (
    capability === 'current-information' ||
    intent === 'current-information' ||
    intent === 'deadline' ||
    intent === 'academic-session'
  ) {
    try {
      const live = await buildCurrentInformationAnswerLive()
      if (live?.answer) {
        const answer = lightAnswer('current-information', live.answer, {
          next: live.nextActions?.slice(0, 4),
          sources: live.sources as GroundedAnswer['sources'],
        })
        slots.phase = 'resolve'
        return {
          messages: [
            userMsg,
            { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
          ],
          slots,
          diagnosed: true,
          capability: 'current-information',
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (
    slots.institutionId &&
    rawUser.length < 80 &&
    /^(my\s+school\s+is|i\s+attend|i\s+am\s+at|school\s*:)/i.test(rawUser.trim())
  ) {
    const answer = lightAnswer(
      intent,
      `Noted — **${slots.institutionName || 'your institution'}**. What do you need next: portal error help, a contact, a draft email, or current application status?`,
    )
    slots.phase = 'gather'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (
    intent === 'eligibility' ||
    /disqualif|lose\s*(the\s*)?(chance|loan)|who\s*can\s*apply|ineligib/i.test(combined)
  ) {
    const groundedElig = answerQuestion(combined || rawUser, slots.institutionId, history)
    if (groundedElig.hasEvidence && groundedElig.answer) {
      groundedElig.responseMode = 'conversation'
      groundedElig.whatThisMeans = null
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          {
            id: uid('asst'),
            role: 'assistant',
            text: groundedElig.answer,
            answer: groundedElig,
            timestamp: Date.now(),
          },
        ],
        slots,
        diagnosed: true,
        capability: 'verified-knowledge',
      }
    }
    const answer = lightAnswer(
      'eligibility',
      'Eligibility depends on official NELFUND rules for the current cycle (identity, admission, institution participation, and any published conditions). This guide will not invent a personal yes/no decision. Check requirements on https://nelf.gov.ng/ and apply only via https://portal.nelf.gov.ng/.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (
    intent === 'unknown' &&
    (combined.trim().length < 60 || /help\s*(me)?|nelfund\s*thing|stuck|wahala/i.test(combined))
  ) {
    const answer = lightAnswer(
      'unknown',
      'I can help — what is going wrong right now?\n\n1. Login / which website to use\n2. Missing information on the portal\n3. Whether my school uploaded my data\n4. Contact school or NELFUND\n5. Draft an email\n6. Is application open\n\nReply with a number or a short description (and your school name if relevant).',
    )
    slots.phase = 'clarify'
    slots.pendingClarify = 'problem'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (
    intent === 'institution-verification' ||
    /upload|school.*(submit|sent|upload)|university.*(submit|sent|upload)|know.*school.*(upload|submit|sent)/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'institution-verification',
      'You cannot see a private NELFUND admin “upload log.” Practical signs:\n\n• Portal still shows missing information / no school data → record may not be matched yet.\n• Ask your school ICT / Registry / NELFUND desk whether they submitted your name, NIN, JAMB, and matric correctly.\n• If the school confirms upload but the portal still fails, open a ticket at https://nelfund.esupport.ng/create with evidence (no passwords).\n\nTell me your institution if you want contact guidance or a draft message.',
      {
        next: [
          'Ask school NELFUND desk',
          'https://nelfund.esupport.ng/create',
          'https://portal.nelf.gov.ng/',
        ],
      },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
  const text = grounded.answer || conversationalFallback(intent)
  if (grounded.responseMode !== 'conversation') {
    grounded.responseMode = 'conversation'
    grounded.whatThisMeans = null
  }
  grounded.answer = text

  slots.phase = grounded.clarifyingQuestions?.length ? 'clarify' : 'resolve'

  return {
    messages: [
      userMsg,
      {
        id: uid('asst'),
        role: 'assistant',
        text: grounded.answer,
        answer: grounded,
        timestamp: Date.now(),
      },
    ],
    slots,
    diagnosed: grounded.hasEvidence,
    capability,
  }
}
