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
import { isPurposeAsk } from './intent'
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

  // Student text about invalid JAMB — answer format error even if OCR missed the red banner
  if (
    /invalid\s*jamb|jamb\s*(number|reg).*(invalid|wrong|format|not\s*correct)/i.test(rawUser) ||
    /invalid\s*jamb|jamb\s*(number|reg).*(invalid|wrong|format)/i.test(ocr || '')
  ) {
    const forced = understandPortalText(
      [rawUser, ocr, 'Invalid jamb number format, e.g 0000 00AA', 'Jamb Profile Verification']
        .filter(Boolean)
        .join('\n'),
    )
    if (forced && forced.kind === 'error') {
      const slots: ConversationSlots = {
        ...opts.slots,
        exactError: forced.exactError,
        problemSummary: forced.exactError || 'invalid_jamb_format',
        errorConfirmed: true,
        phase: 'resolve',
        awaitingInstitution: opts.slots.institutionId ? opts.slots.awaitingInstitution : true,
        actionsTaken: [...(opts.slots.actionsTaken || [])],
      }
      const answer: GroundedAnswer = {
        hasEvidence: true,
        intent: 'jamb-verification',
        confidence: 0.92,
        responseMode: 'conversation',
        problem: forced.exactError,
        answer: forced.explanation,
        whatThisMeans: null,
        nextActions: forced.nextActions.slice(0, 4),
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
      return {
        messages: [
          {
            id: uid('user'),
            role: 'user',
            text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
            imagePreview: opts.imagePreview || null,
            timestamp: Date.now(),
          },
          {
            id: uid('asst'),
            role: 'assistant',
            text: answer.answer,
            answer,
            timestamp: Date.now(),
          },
        ],
        slots,
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  // Prefer OCR / real portal dumps. Do not treat short questions as a screenshot.
  const ocrish =
    Boolean(ocr && ocr.trim().length >= 8) ||
    (combined.length > 120 && /\n/.test(combined)) ||
    /total\s*loans|student\s*loan\s*portal|kindly\s*provide.*login|signed\s*in\s*as/i.test(
      combined,
    )
  const screen = ocrish ? understandPortalText(combined) : null
  const screenOk =
    screen &&
    (ocrish ||
      screen.kind === 'error' ||
      screen.kind === 'dashboard' ||
      screen.kind === 'login' ||
      screen.exactError != null)
  if (screenOk && screen) {
    const slots: ConversationSlots = {
      ...opts.slots,
      actionsTaken: [...(opts.slots.actionsTaken || [])],
    }
    if (screen.exactError) {
      slots.exactError = screen.exactError
      slots.problemSummary = screen.exactError
      slots.errorConfirmed = true
      if (!slots.institutionId) slots.awaitingInstitution = true
    } else if (screen.kind === 'dashboard') {
      slots.problemSummary = slots.problemSummary || 'portal_dashboard'
    }
    slots.phase = 'resolve'

    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: /jamb/i.test(screen.exactError || combined) ? 'jamb-verification' : screen.kind === 'error' ? 'missing-information' : 'current-information',
      confidence: 0.88,
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

    return {
      messages: [
        {
          id: uid('user'),
          role: 'user',
          text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
          imagePreview: opts.imagePreview || null,
          timestamp: Date.now(),
        },
        {
          id: uid('asst'),
          role: 'assistant',
          text: answer.answer,
          answer,
          timestamp: Date.now(),
        },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (
    /\blogin\b|log\s*in|loggin'?g\s*in|sign\s*in|sign\s*up|create\s*(an?\s*)?account|register\s*(for\s*)?nelfund|link\s*(for\s*)?(to\s*)?(log|sign)/i.test(
      rawUser,
    ) &&
    !/missing|pending|upkeep|eligibility|scam|otp|pay\s*agent/i.test(rawUser)
  ) {
    const slots: ConversationSlots = {
      ...opts.slots,
      phase: 'resolve',
      actionsTaken: [...(opts.slots.actionsTaken || [])],
    }
    const text =
      '**Log in / sign in**\n\nUse: https://nelf.gov.ng/\n\n**Sign up** (create account / apply on the portal):\nhttps://portal.nelf.gov.ng/\n\nReport portal problems to NELFUND support: https://nelfund.esupport.ng/create\n\nAvoid random social-media links. Never share OTP or password.'
    const answer: GroundedAnswer = {
      hasEvidence: true,
      intent: 'portal-login',
      confidence: 0.92,
      responseMode: 'conversation',
      problem: 'Official link to login',
      answer: text,
      whatThisMeans: null,
      nextActions: [
        'https://nelf.gov.ng/',
        'https://portal.nelf.gov.ng/',
        'https://nelfund.esupport.ng/create',
      ],
      clarifyingQuestions: [],
      evidence: [],
      sources: [
        {
          id: 'site',
          label: 'NELFUND website (log in / sign in)',
          url: 'https://nelf.gov.ng/',
          official: true,
        },
        {
          id: 'portal',
          label: 'NELFUND portal (sign up / apply)',
          url: 'https://portal.nelf.gov.ng/',
          official: true,
        },
      ],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: 'https://nelf.gov.ng/',
      escalation: null,
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
          text: answer.answer,
          answer,
          timestamp: Date.now(),
        },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
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
      nextActions: [
        'https://portal.nelf.gov.ng/',
        'https://nelf.gov.ng/',
        'https://nelfund.esupport.ng/create',
      ],
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
          text: answer.answer,
          answer,
          timestamp: Date.now(),
        },
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
  extractErrorSignals,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'
