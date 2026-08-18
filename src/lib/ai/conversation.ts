/**
 * Offline conversational agent — PRIMARY NELFUND intelligence (no external LLM required).
 * Multi-turn memory via slots + history. Does not invent official dates.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
import { isNearDuplicate, nextStepAdvance, playbookAnswer } from './playbook'
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

function lightAnswer(
  intent: IntentId,
  text: string,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.88,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
      { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function lastAssistantText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') return history[i].text || ''
  }
  return ''
}

function userTurnCount(history: ConversationTurn[]): number {
  return history.filter((h) => h.role === 'user').length
}

function isShortFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (t.length > 40) return false
  if (/\?|bvn|account|open|expire|deadline|apply|nelfund|missing|portal|school|loan/i.test(t))
    return false
  return /^(yes|yeah|yep|ok|okay|sure|please|do\s*it|go\s*ahead|draft\s*(it|the\s*email|one)|send\s*it|what\s*next|and\s*then|continue|more|tell\s*me\s*more|thanks|thank\s*you|na\s*im|abeg|ehn|ehe)\.?$/i.test(
    t,
  )
}

function finalize(
  userMsg: ChatMessage,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
  capability: AgentCapability,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): AgentTurnResult {
  const answer = lightAnswer(intent, text, opts)
  slots.intent = intent
  slots.phase = 'resolve'
  slots.lastCapability = capability
  return {
    messages: [
      userMsg,
      { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
    ],
    slots,
    diagnosed: true,
    capability,
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
  const prevAsst = lastAssistantText(history)
  const turnIndex = userTurnCount(history)
  const priorIntent = opts.slots.intent

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
    if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
      if (screen.exactError) {
        slots.exactError = screen.exactError
        slots.problemSummary = screen.exactError
        slots.errorConfirmed = true
      }
      let explanation = screen.explanation
      if (isNearDuplicate(prevAsst, explanation)) {
        explanation = nextStepAdvance(
          {
            institutionName: slots.institutionName,
            problemSummary: slots.problemSummary,
            exactError: slots.exactError,
            turnIndex,
            lastAssistant: prevAsst,
            userText: combined,
          },
          screen.kind === 'error' ? 'missing-information' : 'current-information',
        )
      }
      return finalize(
        userMsg,
        slots,
        screen.kind === 'error' ? 'missing-information' : 'current-information',
        explanation,
        'conversation',
        { next: screen.nextActions.slice(0, 4) },
      )
    }
  }

  const intentMeta = classifyIntent(combined || rawUser, history)
  // Sticky: do not drop a known prior intent when the new turn is weak "unknown"
  let intent: IntentId = intentMeta.intent
  if (
    intent === 'unknown' &&
    priorIntent &&
    priorIntent !== 'unknown' &&
    (rawUser.length < 60 || isShortFollowUp(rawUser))
  ) {
    intent = priorIntent
  }
  slots.intent = intent
  if (intentMeta.problem) slots.problemSummary = slots.problemSummary || intentMeta.problem

  const capability = resolveCapability(intent, combined || rawUser)
  slots.lastCapability = capability

  if (slots.pendingClarify === 'problem' && /^\s*[1-6]\s*$/.test(rawUser)) {
    const n = rawUser.trim()
    const map: Record<string, string> = {
      '1': 'which website do I use to login to NELFUND',
      '2': 'portal shows missing information',
      '3': 'how do I know if my school uploaded my data',
      '4': 'who should I contact about missing information',
      '5': 'draft an email to my school about missing information',
      '6': 'is NELFUND open right now',
    }
    slots.pendingClarify = null
    return processUserTurn({
      ...opts,
      userText: map[n] || rawUser,
      slots,
      history: [...history, { role: 'user', text: rawUser }, { role: 'assistant', text: '...' }],
    })
  }

  if (isShortFollowUp(rawUser) && history.length > 0) {
    const lower = rawUser.trim().toLowerCase()

    if (/^(thanks|thank\s*you|ok\s*thanks|na\s*im|done)/i.test(lower)) {
      return finalize(
        userMsg,
        slots,
        slots.intent || 'unknown',
        'Glad to help. If anything else comes up, ask anytime.\n\nPortal: https://portal.nelf.gov.ng/ · Support: https://nelfund.esupport.ng/create',
        'conversation',
      )
    }

    if (
      /draft|email|message|do\s*it|go\s*ahead|send/i.test(lower) &&
      (slots.institutionId || slots.exactError || /draft|email|message/i.test(prevAsst))
    ) {
      try {
        const draft = draftSupportEmail({
          institutionId: slots.institutionId,
          institutionName: slots.institutionName,
          exactError:
            slots.exactError || slots.problemSummary || 'Missing information / student record issue',
          recipient: /nelfund/i.test(prevAsst + combined) ? 'nelfund' : 'school',
        })
        const body = `Here is a draft you can adapt:\n\nSubject: ${draft.subject}\n\n${draft.body}`
        const answer = lightAnswer('email-draft', body, {
          next: ['Copy and send only via official channels', 'https://nelfund.esupport.ng/create'],
        })
        answer.draft = draft
        slots.phase = 'resolve'
        slots.actionsTaken = [...(slots.actionsTaken || []), 'drafted_email']
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

    if (/what\s*next|and\s*then|continue|more|tell\s*me\s*more/i.test(lower)) {
      return finalize(
        userMsg,
        slots,
        slots.intent || 'unknown',
        nextStepAdvance(
          {
            institutionName: slots.institutionName,
            problemSummary: slots.problemSummary,
            exactError: slots.exactError,
            turnIndex,
            lastAssistant: prevAsst,
            userText: combined,
          },
          slots.intent || 'unknown',
        ),
        'conversation',
      )
    }

    if (/^(yes|yeah|yep|ok|okay|sure|abeg|ehn)/i.test(lower)) {
      if (slots.pendingClarify === 'institution' || /which institution|school name/i.test(prevAsst)) {
        slots.phase = 'clarify'
        slots.pendingClarify = 'institution'
        slots.awaitingInstitution = true
        return finalize(
          userMsg,
          slots,
          'contact-lookup',
          'Please type your institution name (for example LASU, UNILAG, OOU, FUTA). I will use it for contacts and drafts — I will not invent emails.',
          'conversation',
        )
      }
      return finalize(
        userMsg,
        slots,
        slots.intent || 'unknown',
        slots.problemSummary
          ? `Understood. We are still on: **${slots.problemSummary}**${slots.institutionName ? ` at **${slots.institutionName}**` : ''}. Tell me the next thing you need — contact, draft email, or another portal message.`
          : 'Understood. Tell me the next detail (school name, exact portal message, or what you want to do).',
        'conversation',
      )
    }
  }

  if (capability === 'contact-lookup' || intent === 'contact-lookup') {
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
      return finalize(
        userMsg,
        slots,
        'contact-lookup',
        'Which institution do you attend? Once I know the school, I can point you to curated contacts or official channels — I will not invent email addresses.',
        'contact-lookup',
      )
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
      return finalize(
        userMsg,
        slots,
        'email-draft',
        'I can draft that. Which school should the message go to, and is it for your institution office or NELFUND support?',
        'email-draft',
      )
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
    const pb = playbookAnswer(intent, {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined,
    })
    if (pb && !isNearDuplicate(prevAsst, pb)) {
      return finalize(userMsg, slots, intent, pb, 'current-information', {
        next: [
          'https://nelf.gov.ng/',
          'https://portal.nelf.gov.ng/',
          'https://nelfund.esupport.ng/create',
        ],
      })
    }
    try {
      const live = await buildCurrentInformationAnswerLive()
      if (live?.answer && !isNearDuplicate(prevAsst, live.answer)) {
        return finalize(userMsg, slots, 'current-information', live.answer, 'current-information', {
          next: live.nextActions?.slice(0, 4),
          sources: live.sources as GroundedAnswer['sources'],
        })
      }
    } catch {
      /* fall through */
    }
    if (pb) {
      return finalize(
        userMsg,
        slots,
        intent,
        isNearDuplicate(prevAsst, pb)
          ? nextStepAdvance(
              {
                institutionName: slots.institutionName,
                problemSummary: slots.problemSummary,
                exactError: slots.exactError,
                turnIndex,
                lastAssistant: prevAsst,
                userText: combined,
              },
              intent,
            )
          : pb,
        'current-information',
      )
    }
  }

  {
    const pb = playbookAnswer(intent, {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined,
    })
    if (pb) {
      const text = isNearDuplicate(prevAsst, pb)
        ? nextStepAdvance(
            {
              institutionName: slots.institutionName,
              problemSummary: slots.problemSummary,
              exactError: slots.exactError,
              turnIndex,
              lastAssistant: prevAsst,
              userText: combined,
            },
            intent,
          )
        : pb
      if (intent === 'missing-information' && !slots.institutionId) {
        slots.awaitingInstitution = true
        slots.pendingClarify = 'institution'
      }
      return finalize(userMsg, slots, intent, text, capability, {
        next: [
          'https://portal.nelf.gov.ng/',
          'https://nelf.gov.ng/',
          'https://nelfund.esupport.ng/create',
        ],
      })
    }
  }

  if (
    intent === 'unknown' &&
    (combined.trim().length < 40 ||
      /^(help\s*(me)?|nelfund\s*thing|stuck|wahala)\.?$/i.test(combined.trim()))
  ) {
    slots.pendingClarify = 'problem'
    return finalize(
      userMsg,
      slots,
      'unknown',
      'I can help — what is going wrong right now?\n\n1. Login / which website to use\n2. Missing information on the portal\n3. Whether my school uploaded my data\n4. Contact school or NELFUND\n5. Draft an email\n6. Is application open\n\nReply with a number or a short description (and your school name if relevant).',
      'conversation',
    )
  }

  const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
  let textOut =
    grounded.answer ||
    playbookAnswer('what-is-nelfund', {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined,
    }) ||
    'Tell me more about what the portal shows, or ask about how to apply, missing information, upkeep, or current status.'

  if (isNearDuplicate(prevAsst, textOut)) {
    textOut = nextStepAdvance(
      {
        institutionName: slots.institutionName,
        problemSummary: slots.problemSummary,
        exactError: slots.exactError,
        turnIndex,
        lastAssistant: prevAsst,
        userText: combined,
      },
      grounded.intent || intent,
    )
  }

  grounded.responseMode = 'conversation'
  grounded.whatThisMeans = null
  grounded.answer = textOut
  slots.intent = grounded.intent || intent
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
