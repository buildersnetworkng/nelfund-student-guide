/**
 * NELFUND AI turn entry: portal screenshot understanding first, then conversation.
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
  const combined = [rawUser, ocr].filter(Boolean).join('\n')

  // Force live status for open/closed questions (never fall into Pick-one menu)
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
    const answerText = playbookAnswer('what-is-nelfund', { userText: rawUser })
    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: 'what-is-nelfund',
      confidence: 0.95,
      responseMode: 'conversation',
      problem: 'What NELFUND is / why it was created',
      answer: answerText,
      whatThisMeans: null,
      nextActions: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'],
      clarifyingQuestions: [],
      evidence: [],
      sources: [
        { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
        { id: 'faq', label: 'NELFUND FAQ', url: 'https://nelf.gov.ng/faq', official: true },
      ],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://nelf.gov.ng/',
      escalation: null,
    }
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser, imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots: { ...opts.slots, intent: 'what-is-nelfund', phase: 'resolve' },
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (
    /invalid\s*jamb|jamb\s*(number|reg).*(invalid|wrong|format|not\s*correct)/i.test(rawUser) ||
    /invalid\s*jamb|jamb\s*(number|reg).*(invalid|wrong|format)/i.test(ocr || '')
  ) {
    const forced = understandPortalText(ocr || rawUser)
    const answerText = playbookAnswer('jamb-verification', {
      userText: rawUser || ocr || '',
      exactError: forced.exactError || 'Invalid JAMB number format',
      problemSummary: forced.problemSummary,
    })
    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: 'jamb-verification',
      confidence: 0.9,
      responseMode: 'troubleshooting',
      problem: forced.problemSummary || 'JAMB verification',
      answer: answerText,
      whatThisMeans: null,
      nextActions: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
      clarifyingQuestions: [],
      evidence: [],
      sources: [{ id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true }],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://portal.nelf.gov.ng/',
      escalation: null,
    }
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser || '[screenshot]', imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots: { ...opts.slots, intent: 'jamb-verification', phase: 'resolve' },
      diagnosed: true,
      capability: 'troubleshooting',
    }
  }

  if (ocr && ocr.trim().length > 20) {
    const screen = understandPortalText(ocr)
    if (screen.kind !== 'unknown' || screen.exactError) {
      const intent =
        /jamb/i.test(screen.exactError || combined)
          ? 'jamb-verification'
          : screen.kind === 'error'
            ? 'missing-information'
            : 'current-information'
      const answerText = playbookAnswer(intent as any, {
        userText: rawUser || ocr,
        exactError: screen.exactError,
        problemSummary: screen.problemSummary,
      })
      const answer: GroundedAnswer = {
        hasEvidence: true,
        intent: intent as any,
        confidence: 0.85,
        responseMode: 'troubleshooting',
        problem: screen.problemSummary || screen.kind,
        answer: answerText,
        whatThisMeans: null,
        nextActions: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
        clarifyingQuestions: [],
        evidence: [],
        sources: [{ id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true }],
        video: null,
        insufficientReason: null,
        officialFallbackUrl: 'https://portal.nelf.gov.ng/',
        escalation: null,
      }
      return {
        messages: [
          {
            id: uid('user'),
            role: 'user',
            text: rawUser || '[Screenshot uploaded]',
            imagePreview: opts.imagePreview || null,
            timestamp: Date.now(),
          },
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots: {
          ...opts.slots,
          intent: intent as any,
          problemSummary: screen.problemSummary,
          exactError: screen.exactError,
          phase: 'resolve',
        },
        diagnosed: true,
        capability: 'troubleshooting',
      }
    }
  }

  const hist = opts.history || []
  const prevAsst = [...hist].reverse().find((h) => h.role === 'assistant')?.text || ''
  if (
    /what\s*does\s*(this|it|that)\s*mean|wetin\s*(this|e|am)\s*mean|explain\s*(this|it|the\s*screen|the\s*dashboard)|mean\s*say/i.test(
      rawUser,
    ) &&
    (/dashboard|student loan portal|total\s*loans|pending\s*loans|approved\s*loans|session registration|welcome to student loan|successfully signed in/i.test(
      prevAsst,
    ) ||
      opts.slots.problemSummary === 'portal_dashboard')
  ) {
    const slots: ConversationSlots = {
      ...opts.slots,
      problemSummary: opts.slots.problemSummary || 'portal_dashboard',
      phase: 'resolve',
      actionsTaken: [...(opts.slots.actionsTaken || [])],
    }
    const text = dashboardFollowUpExplanation()
    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: 'current-information',
      confidence: 0.9,
      responseMode: 'conversation',
      problem: 'portal_dashboard',
      answer: text,
      whatThisMeans: null,
      nextActions: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
      clarifyingQuestions: [],
      evidence: [],
      sources: [{ id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true }],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://portal.nelf.gov.ng/',
      escalation: null,
    }
    return {
      messages: [
        { id: uid('user'), role: 'user', text: rawUser, imagePreview: opts.imagePreview || null, timestamp: Date.now() },
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  return processUserTurnCore(opts)
}

export {
  createInitialSlots,
  createWelcomeMessage,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'
