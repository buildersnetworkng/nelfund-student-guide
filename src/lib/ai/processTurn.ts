/**
 * NELFUND AI turn entry: clarification first, then portal screenshot, then conversation.
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

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
  const ocr = opts.ocrText || null

  // Clarification: "I meant for the loan and upkeep" — never welcome-reset
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
              clarifyingQuestions: [],
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
  if (isOpenAsk && !isPurposeAsk(rawUser)) {
    try {
      const live = await buildCurrentInformationAnswerLive(rawUser)
      if (live?.answer) {
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

  if (isPurposeAsk(rawUser) && !ocr) {
    const answerText =
      playbookAnswer('what-is-nelfund', { userText: rawUser }) ||
      'NELFUND is the Nigeria Education Loan Fund. Official: https://nelf.gov.ng/ and https://portal.nelf.gov.ng/'
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
            clarifyingQuestions: [],
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
