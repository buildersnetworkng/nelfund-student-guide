/**
 * NELFUND AI turn entry — crash-safe.
 * Early handlers for scam, eligibility chip, terms, overview. Never throw to the UI.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
} from './conversation'
import type { ConversationTurn, IntentId } from './types'
import { understandPortalText } from './screenshotUnderstand'
import { isPurposeAsk } from './intentClassify'
import { buildCurrentInformationAnswerLive, questionNeedsCurrentLive } from './current'
import { liveOpenRe } from './intent'
import { playbookAnswer } from './playbook'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function suggest(intent: string): string[] {
  const map: Record<string, string[]> = {
    'what-is-nelfund': [
      'Who can apply (eligibility)?',
      'How do I apply step by step?',
      'What is institutional charges?',
      'What is upkeep?',
    ],
    eligibility: [
      'How do I apply step by step?',
      'What documents do I need?',
      'Can 100 level students apply?',
      'My school is a polytechnic — can I apply?',
    ],
    'scam-safety': [
      'How do I apply only on the official portal?',
      'How do I contact official support?',
      'Is NELFUND real / government?',
      'What should I never share (OTP/password)?',
    ],
    'how-to-apply': [
      'How do I log in?',
      'What documents do I need?',
      'School not on the list / missing information',
      'What is upkeep vs school fees?',
    ],
    'portal-login': [
      'I forgot my password',
      'Old email from last year — what do I do?',
      'Portal shows missing information',
      'How do I contact official support?',
    ],
    upkeep: [
      'What is institutional charges?',
      'When does money enter my account?',
      'How do I apply for upkeep?',
      'Is upkeep optional?',
    ],
    'institutional-charges': [
      'What is upkeep?',
      'Who receives institutional charges?',
      'How do I apply?',
      'Repayment — when does it start?',
    ],
  }
  return (
    map[intent] || [
      'Who can apply (eligibility)?',
      'How do I apply step by step?',
      'What is the difference between school fees and upkeep?',
      'Is NELFUND a scam?',
    ]
  )
}

function asst(
  intent: IntentId | string,
  text: string,
  next: string[] = ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
): NonNullable<AgentTurnResult['messages'][0]['answer']> {
  return {
    hasEvidence: true,
    intent: intent as IntentId,
    confidence: 0.95,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    nextActions: next,
    clarifyingQuestions: suggest(String(intent)),
    evidence: [],
    sources: [],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function pack(
  rawUser: string,
  imagePreview: string | null | undefined,
  slots: ConversationSlots,
  intent: IntentId | string,
  text: string,
  next?: string[],
): AgentTurnResult {
  return {
    messages: [
      {
        id: uid('user'),
        role: 'user',
        text: rawUser,
        imagePreview: imagePreview || null,
        timestamp: Date.now(),
      },
      {
        id: uid('asst'),
        role: 'assistant',
        text,
        answer: asst(intent, text, next),
        timestamp: Date.now(),
      },
    ],
    slots: { ...slots, intent: intent as IntentId },
    diagnosed: true,
    capability: 'conversation',
  }
}

const SCAM_ANSWER =
  '**NELFUND is a real government student loan scheme** (Nigeria Education Loan Fund), not a private WhatsApp "agent" product.\n\n' +
  '**Stay safe**\n' +
  '- Never pay anyone to "process" or "approve" your loan.\n' +
  '- Never share OTP, password, or NIN/BVN codes with strangers.\n' +
  '- Apply and check status only on https://portal.nelf.gov.ng/ and https://nelf.gov.ng/.\n' +
  '- Official tickets only: https://nelfund.esupport.ng/create\n\n' +
  'Anyone on WhatsApp asking for money or codes is a **scam**. Report and block them.'

const OVERVIEW =
  '**How NELFUND works (short)**\n\n' +
  '1. **What it is:** Nigeria Education Loan Fund — interest-free student loans for eligible students in **public** tertiary institutions.\n' +
  '2. **Institutional charges** go to your **school** (fees).\n' +
  '3. **Upkeep** (optional) goes to **you** if you tick it in the same application.\n' +
  '4. **Who can apply:** Nigerian citizens with admission into a public uni/poly/COE (full-time). Confirm live rules on the portal.\n' +
  '5. **How to apply:** Create/sign in at https://portal.nelf.gov.ng/ — complete profile (JAMB, NIN, BVN).\n' +
  '6. **Never pay** an agent; never share OTP/password.\n' +
  '7. **Official only:** https://nelf.gov.ng/ and https://portal.nelf.gov.ng/\n\n' +
  'Ask next about eligibility, how to apply, upkeep, portal errors, or repayment if you want one topic in detail.'

const ELIGIBILITY =
  '**Eligibility (official FAQ language)**\n\n' +
  '• Nigerian citizen\n' +
  '• Admission into a **public** university, polytechnic, college of education, or vocational school\n' +
  '• **Full-time** students with valid admission (any level: 100, 200, 300, etc.)\n\n' +
  'Your year of study does not by itself block you.\n\n' +
  '**Have ready:** Matriculation number, JAMB details, NIN, BVN, and a bank account in your name.\n\n' +
  'Confirm on https://portal.nelf.gov.ng/ and https://nelf.gov.ng/ — I will not invent extra rules.'

function isScamAsk(t: string): boolean {
  return /scam|fraud|fake\s*(loan|nelfund)|agent.{0,30}(pay|money)|told\s+me.{0,50}scam|is\s+(nelfund|this|it).{0,20}scam|nelfund.{0,20}scam/i.test(
    t,
  )
}

function isOverviewAsk(t: string): boolean {
  return /how\s+(does\s+)?(nelfund|this|it|dis).{0,20}work|go\s*through.{0,30}nelfund|whole\s+nelfund|everything.{0,20}nelfund|what\s+is\s+(this\s+)?nelfund|nelfund\s+all\s+about|tell\s+me\s+about\s+nelfund|wetin\s+be\s+nelfund|explain\s+nelfund/i.test(
    t,
  )
}

function isEligibilityChip(t: string): boolean {
  return /^eligibility\s*[!?.]?$/i.test(t.trim())
}

function isMeaningCharges(t: string): boolean {
  return /what\s+do\s+(you|u)\s+mean.{0,30}(charg|upkeep)|institutional\s*charg|wetin\s+(be|mean)\s+(institutional|upkeep)/i.test(
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
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const imagePreview = opts.imagePreview

  try {
    // Scam first — never off-topic or crash
    if (!ocr && rawUser && isScamAsk(rawUser)) {
      return pack(rawUser, imagePreview, opts.slots, 'scam-safety', SCAM_ANSWER, [
        'https://portal.nelf.gov.ng/',
        'https://nelfund.esupport.ng/create',
      ])
    }

    // Eligibility chip
    if (!ocr && rawUser && isEligibilityChip(rawUser)) {
      const text =
        playbookAnswer('eligibility', { userText: rawUser }) || ELIGIBILITY
      return pack(rawUser, imagePreview, opts.slots, 'eligibility', text)
    }

    // Term: institutional charges / upkeep meaning
    if (!ocr && rawUser && isMeaningCharges(rawUser)) {
      if (/upkeep/i.test(rawUser)) {
        const text =
          playbookAnswer('upkeep', { userText: rawUser }) ||
          '**Upkeep** is optional living support under NELFUND, paid to **you** if you tick it. Institutional charges go to the **school**. Confirm amounts only on https://portal.nelf.gov.ng/'
        return pack(rawUser, imagePreview, opts.slots, 'upkeep', text)
      }
      const text =
        playbookAnswer('institutional-charges', { userText: rawUser }) ||
        '**Institutional charges** means school fees paid **to the school** under NELFUND. Upkeep is separate and goes to you if requested. Confirm on https://portal.nelf.gov.ng/'
      return pack(rawUser, imagePreview, opts.slots, 'institutional-charges', text)
    }

    // Overview / what is NELFUND
    if (!ocr && rawUser && (isOverviewAsk(rawUser) || isPurposeAsk(rawUser))) {
      const text =
        playbookAnswer('what-is-nelfund', { userText: rawUser }) || OVERVIEW
      return pack(rawUser, imagePreview, opts.slots, 'what-is-nelfund', text)
    }

    // Live open/closed (best-effort)
    const isOpenAsk =
      !ocr &&
      !!rawUser &&
      (liveOpenRe().test(rawUser) ||
        questionNeedsCurrentLive(rawUser) ||
        /is\s+nelfund\s+loan\s+application\s+open/i.test(rawUser))
    if (isOpenAsk) {
      try {
        const live = await buildCurrentInformationAnswerLive(rawUser)
        if (live?.answer) {
          return {
            messages: [
              {
                id: uid('user'),
                role: 'user',
                text: rawUser,
                imagePreview: imagePreview || null,
                timestamp: Date.now(),
              },
              {
                id: uid('asst'),
                role: 'assistant',
                text: live.answer,
                answer: {
                  ...live,
                  clarifyingQuestions: live.clarifyingQuestions?.length
                    ? live.clarifyingQuestions
                    : suggest('current-information'),
                },
                timestamp: Date.now(),
              },
            ],
            slots: { ...opts.slots, intent: 'current-information' },
            diagnosed: true,
            capability: 'current-information',
          }
        }
      } catch {
        /* fall through */
      }
    }

    // Portal OCR
    if (ocr && ocr.trim().length >= 8) {
      try {
        const screen = understandPortalText([rawUser, ocr].filter(Boolean).join('\n'))
        if (screen) {
          const intent =
            screen.kind === 'error' || /missing/i.test(screen.exactError || '')
              ? 'missing-information'
              : screen.kind === 'login'
                ? 'portal-login'
                : 'current-information'
          return pack(
            rawUser || '[Screenshot uploaded]',
            imagePreview,
            opts.slots,
            intent,
            screen.explanation,
            (screen.nextActions || []).slice(0, 4),
          )
        }
      } catch {
        /* fall through */
      }
    }

    return await processUserTurnCore(opts)
  } catch {
    // Last resort — never surface a blank crash to the student
    if (isScamAsk(rawUser)) {
      return pack(rawUser || '[message]', imagePreview, opts.slots, 'scam-safety', SCAM_ANSWER)
    }
    if (isEligibilityChip(rawUser)) {
      return pack(rawUser || '[message]', imagePreview, opts.slots, 'eligibility', ELIGIBILITY)
    }
    return pack(rawUser || '[message]', imagePreview, opts.slots, 'what-is-nelfund', OVERVIEW)
  }
}

export { createInitialSlots, createWelcomeMessage } from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult, ConversationPhase } from './conversation'
