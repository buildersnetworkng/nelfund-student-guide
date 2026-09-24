/**
 * NELFUND AI turn entry: term meaning + overview first, then clarification, portal, conversation.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
} from './conversation'
import type { ConversationTurn } from './types'
import { understandPortalText, dashboardFollowUpExplanation } from './screenshotUnderstand'
import type { GroundedAnswer } from './types'
import { isPurposeAsk } from './intentClassify'
import { buildCurrentInformationAnswerLive, questionNeedsCurrentLive } from './current'
import { liveOpenRe } from './intent'
import { playbookAnswer } from './playbook'
import { refineClarificationAnswer } from './conversationClarify'
import { explainTerm } from './termDefine'
import { isOverviewAsk, fullNelfundOverview } from './overviewAsk'
import { suggestedNextQuestions } from './suggestedNext'
import { eligibilityAnswer } from './eligibilityAnswer'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const SCAM_ANSWER =
  '**NELFUND is a real government student loan scheme** (Nigeria Education Loan Fund), not a private WhatsApp "agent" product.\n\n' +
  '**Stay safe**\n' +
  '- Never pay anyone to "process" or "approve" your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  '- Apply and check status only on https://portal.nelf.gov.ng/ and https://nelf.gov.ng/.\n' +
  '- Official tickets only: https://nelfund.esupport.ng/create\n\n' +
  'Anyone on WhatsApp asking for money or codes is a **scam**. Report and block them.'

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const history = opts.history || []
  const prevAsst =
    [...history].reverse().find((h) => h.role === 'assistant')?.text || null

  // Topic chip: Eligibility alone → real eligibility criteria
  if (!ocr && rawUser && /^eligibility\s*[!?.]?$/i.test(rawUser)) {
    const answerText = eligibilityAnswer({ userText: rawUser })
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser, imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        {
          id: uid('asst'),
          role: 'assistant',
          text: answerText,
          answer: {
            hasEvidence: true,
            intent: 'eligibility',
            confidence: 0.97,
            responseMode: 'conversation',
            problem: null,
            answer: answerText,
            nextActions: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
            clarifyingQuestions: suggestedNextQuestions('eligibility'),
            evidence: [],
            sources: [],
            video: null,
            insufficientReason: null,
            officialFallbackUrl: 'https://portal.nelf.gov.ng/',
            escalation: null,
          },
          timestamp: Date.now(),
        },
      ],
      slots: { ...opts.slots, intent: 'eligibility', phase: 'resolve' },
      diagnosed: true,
      capability: 'conversation',
    }
  }

  // "Someone told me NELFUND is a scam" — never off-topic menu
  if (
    !ocr &&
    rawUser &&
    /\bis\s+(nelfund|this|it)\s+(a\s+)?scam\b|nelfund\s+is\s+(a\s+)?scam|told\s+me.{0,40}scam|scam.{0,20}nelfund|is\s+this\s+(thing\s+)?(a\s+)?scam/i.test(
      rawUser,
    )
  ) {
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser, imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        {
          id: uid('asst'),
          role: 'assistant',
          text: SCAM_ANSWER,
          answer: {
            hasEvidence: true,
            intent: 'scam-safety',
            confidence: 0.96,
            responseMode: 'conversation',
            problem: 'scam',
            answer: SCAM_ANSWER,
            nextActions: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
            clarifyingQuestions: suggestedNextQuestions('scam-safety'),
            evidence: [],
            sources: [],
            video: null,
            insufficientReason: null,
            officialFallbackUrl: 'https://portal.nelf.gov.ng/',
            escalation: null,
          },
          timestamp: Date.now(),
        },
      ],
      slots: { ...opts.slots, intent: 'scam-safety', phase: 'resolve' },
      diagnosed: true,
      capability: 'conversation',
    }
  }

  // "What do you mean by institutional charges/chargers?" — explain the term
  if (!ocr && rawUser) {
    const term = explainTerm(rawUser, prevAsst)
    if (term && term.text.length > 40) {
      return {
        messages: [
          {
            id: uid('user'),
            role: 'user',
            text: rawUser,
            imagePreview: opts.imagePreview || null,
            timestamp: Date.now(),
          },
          {
            id: uid('asst'),
            role: 'assistant',
            text: term.text,
            answer: {
              hasEvidence: true,
              intent: term.intent,
              confidence: 0.95,
              responseMode: 'conversation',
              problem: term.intent,
              answer: term.text,
              nextActions: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
              clarifyingQuestions: suggestedNextQuestions(term.intent),
              evidence: [],
              sources: [],
              video: null,
              insufficientReason: null,
              officialFallbackUrl: 'https://portal.nelf.gov.ng/',
              escalation: null,
            },
            timestamp: Date.now(),
          },
        ],
        slots: { ...opts.slots, intent: term.intent, phase: 'resolve' },
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  // Full go-through / "how does this nelfund thing work"
  if (!ocr && rawUser && isOverviewAsk(rawUser)) {
    const answerText = fullNelfundOverview()
    return {
      messages: [
        {
          id: uid('user'),
          role: 'user',
          text: rawUser,
          imagePreview: opts.imagePreview || null,
          timestamp: Date.now(),
        },
        {
          id: uid('asst'),
          role: 'assistant',
          text: answerText,
          answer: {
            hasEvidence: true,
            intent: 'what-is-nelfund',
            confidence: 0.96,
            responseMode: 'conversation',
            problem: null,
            answer: answerText,
            nextActions: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
            clarifyingQuestions: suggestedNextQuestions('what-is-nelfund'),
            evidence: [],
            sources: [],
            video: null,
            insufficientReason: null,
            officialFallbackUrl: 'https://portal.nelf.gov.ng/',
            escalation: null,
          },
          timestamp: Date.now(),
        },
      ],
      slots: { ...opts.slots, intent: 'what-is-nelfund', phase: 'resolve' },
      diagnosed: true,
      capability: 'conversation',
    }
  }

  // Clarification: "I meant for the loan and upkeep"
  if (
    !ocr &&
    rawUser &&
    opts.slots?.intent &&
    opts.slots.intent !== 'unknown' &&
    opts.slots.intent !== 'official-sources'
  ) {
    const refined = refineClarificationAnswer(opts.slots.intent, rawUser)
    if (refined && refined.length > 40) {
      const intentOut = opts.slots.intent === 'how-to-apply' ? 'how-to-apply' : opts.slots.intent
      return {
        messages: [
          {
            id: uid('user'),
            role: 'user',
            text: rawUser,
            imagePreview: opts.imagePreview || null,
            timestamp: Date.now(),
          },
          {
            id: uid('asst'),
            role: 'assistant',
            text: refined,
            answer: {
              hasEvidence: true,
              intent: intentOut,
              confidence: 0.92,
              responseMode: 'conversation',
              problem: null,
              answer: refined,
              nextActions: ['https://portal.nelf.gov.ng/'],
              clarifyingQuestions: suggestedNextQuestions(intentOut),
              evidence: [],
              sources: [],
              video: null,
              insufficientReason: null,
              officialFallbackUrl: 'https://portal.nelf.gov.ng/',
              escalation: null,
            },
            timestamp: Date.now(),
          },
        ],
        slots: { ...opts.slots, intent: intentOut, phase: 'resolve' },
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  // Live open/closed
  const isOpenAsk =
    !ocr &&
    !!rawUser &&
    (liveOpenRe().test(rawUser) ||
      questionNeedsCurrentLive(rawUser) ||
      /is\s+nelfund\s+loan\s+application\s+open/i.test(rawUser) ||
      /loan\s+application\s+(still\s+|currently\s+)?(open|closed)/i.test(rawUser))
  if (isOpenAsk && !isPurposeAsk(rawUser) && !isOverviewAsk(rawUser)) {
    try {
      const live = await buildCurrentInformationAnswerLive(rawUser)
      if (live?.answer) {
        if (!live.clarifyingQuestions?.length) {
          live.clarifyingQuestions = suggestedNextQuestions('current-information')
        }
        return {
          messages: [
            {
              id: uid('user'),
              role: 'user',
              text: rawUser,
              imagePreview: opts.imagePreview || null,
              timestamp: Date.now(),
            },
            {
              id: uid('asst'),
              role: 'assistant',
              text: live.answer,
              answer: live,
              timestamp: Date.now(),
            },
          ],
          slots: { ...opts.slots, intent: 'current-information', phase: 'resolve' },
          diagnosed: true,
          capability: 'current-information',
        }
      }
    } catch {
      /* fall through */
    }
  }

  if ((isPurposeAsk(rawUser) || isOverviewAsk(rawUser)) && !ocr) {
    const answerText =
      (isOverviewAsk(rawUser) ? fullNelfundOverview() : null) ||
      playbookAnswer('what-is-nelfund', { userText: rawUser }) ||
      fullNelfundOverview()
    return {
      messages: [
        {
          id: uid('user'),
          role: 'user',
          text: rawUser,
          imagePreview: opts.imagePreview || null,
          timestamp: Date.now(),
        },
        {
          id: uid('asst'),
          role: 'assistant',
          text: answerText,
          answer: {
            hasEvidence: true,
            intent: 'what-is-nelfund',
            confidence: 0.9,
            responseMode: 'conversation',
            problem: null,
            answer: answerText,
            nextActions: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
            clarifyingQuestions: suggestedNextQuestions('what-is-nelfund'),
            evidence: [],
            sources: [],
            video: null,
            insufficientReason: null,
            officialFallbackUrl: 'https://portal.nelf.gov.ng/',
            escalation: null,
          },
          timestamp: Date.now(),
        },
      ],
      slots: { ...opts.slots, intent: 'what-is-nelfund', phase: 'resolve' },
      diagnosed: true,
      capability: 'conversation',
    }
  }

  // Portal screenshot / OCR path
  if (ocr && ocr.trim().length >= 8) {
    const screen = understandPortalText([rawUser, ocr].filter(Boolean).join('\n'))
    if (screen) {
      const intent =
        screen.kind === 'error' || /missing/i.test(screen.exactError || '')
          ? 'missing-information'
          : screen.kind === 'login'
            ? 'portal-login'
            : 'current-information'
      return {
        messages: [
          {
            id: uid('user'),
            role: 'user',
            text: rawUser || '[Screenshot uploaded]',
            imagePreview: opts.imagePreview || null,
            timestamp: Date.now(),
          },
          {
            id: uid('asst'),
            role: 'assistant',
            text: screen.explanation,
            answer: {
              hasEvidence: true,
              intent,
              confidence: 0.88,
              responseMode: 'conversation',
              problem: screen.exactError || screen.kind,
              answer: screen.explanation,
              nextActions: (screen.nextActions || []).slice(0, 4),
              clarifyingQuestions: suggestedNextQuestions(intent),
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
            },
            timestamp: Date.now(),
          },
        ],
        slots: {
          ...opts.slots,
          intent: intent as any,
          exactError: screen.exactError || opts.slots.exactError,
          problemSummary: screen.exactError || opts.slots.problemSummary,
          phase: 'resolve',
        },
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  return processUserTurnCore(opts)
}

export { createInitialSlots, createWelcomeMessage } from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
