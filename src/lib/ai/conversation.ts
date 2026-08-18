/**
 * Offline / fallback conversational agent (when LLM API is unavailable).
 * Task-aware handlers — not FAQ matching as the brain.
 * Production path prefers /api/chat LLM agent.
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

  // Dashboard / portal UI OCR — never treat as FAQ "pending application"
  {
    const screen = understandPortalText(combined || ocr || rawUser || '')
    if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
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

  if (capability === 'portal-login' || intent === 'portal-login') {
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
      const escIntent = 'missing-information' as IntentId
      const esc = buildEscalationPlan(escIntent, slots.institutionId)
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
