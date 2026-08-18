/**
 * Offline conversational agent — primary intelligence when no LLM API is configured.
 * Multi-turn memory via slots + history. Does not invent official dates.
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

function lastAssistantText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') return history[i].text || ''
  }
  return ''
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
    const prevAsst = lastAssistantText(history)
    const lower = rawUser.trim().toLowerCase()

    if (/^(thanks|thank\s*you|ok\s*thanks|na\s*im|done)/i.test(lower)) {
      const answer = lightAnswer(
        slots.intent || 'unknown',
        'Glad to help. If anything else comes up on the portal, ask anytime — or open https://portal.nelf.gov.ng/ / https://nelfund.esupport.ng/create for official steps.',
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
      const answer = lightAnswer(
        slots.intent || 'unknown',
        slots.institutionName
          ? `With **${slots.institutionName}** in mind, useful next steps:\n1. Confirm records with school ICT / Registry / NELFUND desk\n2. Retry https://portal.nelf.gov.ng/\n3. If still stuck → https://nelfund.esupport.ng/create\n4. Say “draft the email” if you want a message for your school\n\nWhat do you want to do now?`
          : `Next steps that usually help:\n1. Note your exact portal message\n2. Tell me your institution\n3. Confirm records with the school\n4. Use https://portal.nelf.gov.ng/ and https://nelfund.esupport.ng/create\n\nTell me your school name or the exact error on screen.`,
        {
          next: [
            'Share school name',
            'https://portal.nelf.gov.ng/',
            'https://nelfund.esupport.ng/create',
          ],
        },
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

    if (/^(yes|yeah|yep|ok|okay|sure|abeg|ehn)/i.test(lower)) {
      if (slots.pendingClarify === 'institution' || /which institution|school name/i.test(prevAsst)) {
        const answer = lightAnswer(
          'contact-lookup',
          'Please type your institution name (for example LASU, UNILAG, OOU, FUTA). I will use it for contacts and drafts — I will not invent emails.',
        )
        slots.phase = 'clarify'
        slots.pendingClarify = 'institution'
        slots.awaitingInstitution = true
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
      const answer = lightAnswer(
        slots.intent || 'unknown',
        slots.problemSummary
          ? `Understood. We are still on: **${slots.problemSummary}**${slots.institutionName ? ` at **${slots.institutionName}**` : ''}. Tell me the next thing you need — contact, draft email, or another portal message.`
          : 'Understood. Tell me the next detail (school name, exact portal message, or what you want to do).',
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
  }

  if (
    history.length > 0 &&
    /about\s*that|the\s*(same\s*)?(error|problem|issue)|still\s*(the\s*)?same|as\s*I\s*said/i.test(
      combined,
    )
  ) {
    const ctx = [slots.problemSummary, slots.exactError, slots.institutionName]
      .filter(Boolean)
      .join(' · ')
    const answer = lightAnswer(
      slots.intent || 'missing-information',
      ctx
        ? `Still working from: **${ctx}**.\n\nI can draft an email, point to school contacts, or walk through portal checks again. What do you need now?`
        : 'Remind me of the portal message or your school name so I can continue from the right place.',
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

  // BVN + registration deadline
  if (
    /bvn/i.test(combined) ||
    (/registr(ation|y)|expire|deadline|when\s*will.*(close|expire|end)/i.test(combined) &&
      /account|apply|loan|window|session|open/i.test(combined))
  ) {
    const answer = lightAnswer(
      'current-information',
      '**You do not need to panic about BVN alone.**\n\nSeparate three things:\n\n1. **NELFUND account creation** on https://portal.nelf.gov.ng/ — often still possible even when a *loan application* window is closed. You can start the account while you arrange BVN.\n2. **Loan / upkeep application window** — only open during an officially announced session period. A yellow notice with a past end date means *that* cycle’s applications closed — not necessarily that account creation is impossible.\n3. **BVN** — usually needed for bank details and steps that require verified banking. Not having BVN yet should not stop you from reading official guidance and creating an account if the portal allows it.\n\nThis guide will **not invent** the next 2026/2027 opening date. When NELFUND announces it, it will appear on https://nelf.gov.ng/ and the portal — not on random WhatsApp broadcasts.\n\n**Next:** try account creation on the portal if available; sort BVN through official bank channels; watch nelf.gov.ng for the next application window.',
      {
        next: [
          'https://portal.nelf.gov.ng/',
          'https://nelf.gov.ng/',
          'https://nelfund.esupport.ng/create',
        ],
      },
    )
    slots.phase = 'resolve'
    slots.problemSummary = slots.problemSummary || 'bvn_registration_timing'
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

  if (/create\s*(an?\s*)?account|still\s*(create|register|sign\s*up)|can\s*i\s*(still\s*)?(create|register)/i.test(combined)) {
    const answer = lightAnswer(
      'portal-login',
      '**Account creation** and **loan application** are different.\n\n• Try creating / signing in at https://portal.nelf.gov.ng/\n• If the portal lets you open an account, you can proceed even while a previous *application* cycle is closed\n• Loan/upkeep applications only work when that session window is officially open\n• Confirm any deadline on https://nelf.gov.ng/ — not social media\n\nIf the portal blocks account creation with a specific error, paste that message (or upload a screenshot).',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'] },
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
    /when\s*(will|is).{0,40}(open|start|begin)|2026\s*\/?\s*2027|next\s*(cycle|window|session)|application\s*window/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'current-information',
      'NELFUND has **not** authorized this guide to invent the official opening or closing date for the next loan/upkeep window (including 2026/2027).\n\nWhat is reliable:\n• Watch https://nelf.gov.ng/ for announcements\n• Check https://portal.nelf.gov.ng/ for what the system actually allows today\n• Treat WhatsApp/Telegram “dates” as unverified until they match official pages\n\nYou can often still **create a student account** and prepare documents (NIN, JAMB, admission, matric, bank/BVN) while waiting for the next open window.',
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
      capability: 'current-information',
    }
  }

  if (
    capability === 'portal-login' ||
    intent === 'portal-login' ||
    /which\s*(website|link|url|site).{0,60}(login|log\s*in|sign\s*in|application|continue|enter|nelfund)/i.test(
      combined,
    ) ||
    /continue\s*(my\s*)?application/i.test(combined) ||
    /abeg.{0,30}(site|link|website).{0,40}(nelfund|login|enter)/i.test(combined)
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

  if (/contact\s*nelfund|nelfund\s*support|how\s*i\s*go\s*contact\s*nelfund|reach\s*nelfund/i.test(combined)) {
    const answer = lightAnswer(
      'contact-support',
      'To contact **NELFUND**:\n\n• Support tickets: https://nelfund.esupport.ng/create\n• Portal: https://portal.nelf.gov.ng/\n• Site: https://nelf.gov.ng/\n\nNo passwords or OTP in any message.',
      {
        next: [
          'https://nelfund.esupport.ng/create',
          'https://portal.nelf.gov.ng/',
          'https://nelf.gov.ng/',
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
      capability: 'contact-lookup',
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
    (intent === 'missing-information' ||
      /missing\s*information|no\s*school\s*info|record\s*not\s*found/i.test(combined)) &&
    !/explain|mean|simple|pidgin|plain/i.test(combined)
  ) {
    const answer = lightAnswer(
      'missing-information',
      '**Missing information** on the NELFUND portal usually means your details are not matched to a school record yet — name, NIN, JAMB, or matric may not match what your institution submitted.\n\nNext steps:\n1. Tell me your institution so I can point you to the right office.\n2. Ask school ICT / Registry / NELFUND desk to confirm your record was uploaded correctly.\n3. If the school confirms but the portal still fails → https://nelfund.esupport.ng/create (no passwords).',
      { next: ['Share your school name', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = slots.institutionId ? 'resolve' : 'clarify'
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
    }
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
    intent === 'unknown' &&
    !/bvn|account|open|expire|deadline|202\d|apply|create|registration|loan|upkeep|what\s*is|how\s*(do|to)|eligib/i.test(
      combined,
    ) &&
    (combined.trim().length < 40 ||
      /^(help\s*(me)?|nelfund\s*thing|stuck|wahala)\.?$/i.test(combined.trim()))
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
  const textOut = grounded.answer || conversationalFallback(intent)
  if (grounded.responseMode !== 'conversation') {
    grounded.responseMode = 'conversation'
    grounded.whatThisMeans = null
  }
  grounded.answer = textOut

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
