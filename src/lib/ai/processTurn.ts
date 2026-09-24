/**
 * Public turn entry. Conversation engine lives in ./conversation.
 * Extra student-path gates (overview, term meaning, portal UI knowledge) run first.
 */
export {
  processUserTurn as processUserTurnInner,
  createInitialSlots,
  createWelcomeMessage,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'

import {
  processUserTurn as innerProcess,
  createInitialSlots,
  type AgentTurnResult,
  type ConversationSlots,
  type ChatMessage,
} from './conversation'
import { isOverviewAsk, fullNelfundOverview } from './overviewAsk'
import { explainTerm } from './termDefine'
import { playbookAnswer } from './playbook'
import { classifyIntent } from './intentClassify'
import { matchPortalKnowledge } from './portalKnowledge'
import { understandPortalText } from './screenshotUnderstand'
import { suggest } from './suggest'
import type { IntentId } from './types'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function wrap(
  userText: string,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
): AgentTurnResult {
  let chips: string[] = ['How do I apply for NELFUND?', 'Is the application open?']
  try {
    chips = [...suggest(intent, userText)].slice(0, 2)
  } catch {
    /* keep defaults */
  }
  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: userText || '[screenshot]',
    timestamp: Date.now(),
  }
  return {
    messages: [
      userMsg,
      {
        id: uid('asst'),
        role: 'assistant',
        text,
        timestamp: Date.now(),
        answer: {
          hasEvidence: true,
          intent,
          confidence: 0.9,
          problem: null,
          answer: text,
          nextActions: [],
          clarifyingQuestions: chips as [string, string] | string[],
          evidence: [],
          sources: [
            { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
          ],
          video: null,
          insufficientReason: null,
          officialFallbackUrl: 'https://portal.nelf.gov.ng/',
          escalation: null,
          responseMode: 'conversation',
        },
      },
    ],
    slots: { ...slots, intent, phase: 'resolve' },
    diagnosed: true,
    capability: 'conversation',
  }
}

function gate(
  raw: string,
  slots: ConversationSlots,
  lastAsst: string | null,
  intent: IntentId,
): AgentTurnResult | null {
  const pb = playbookAnswer(intent, { userText: raw, lastAssistant: lastAsst })
  if (pb) return wrap(raw, slots, intent, pb)
  return null
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: { role: string; text: string }[]
}): Promise<AgentTurnResult> {
  const raw = (opts.userText || '').trim()
  const ocr = (typeof opts.ocrText === 'string' ? opts.ocrText : '').trim()
  const lastAsst =
    [...(opts.history || [])].reverse().find((h) => h.role === 'assistant')?.text || null

  // Screenshot upload: always answer from OCR — never fall through (prevents device crash)
  if (ocr.length >= 8) {
    try {
      const screen = understandPortalText(ocr)
      if (screen) {
        const intent: IntentId =
          screen.kind === 'error'
            ? 'missing-information'
            : screen.hasApplied === true
              ? 'pending-application'
              : screen.hasApplied === false
                ? 'how-to-apply'
                : 'current-information'
        return wrap(raw || '[Screenshot uploaded]', { ...opts.slots, intent }, intent, screen.explanation)
      }
      // OCR text present but unclassified — still answer from the visible words
      if (/no\s*result\s*found|select\s*institution/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'school-not-found',
          [
            '**Screen:** Verify Educational Information — institution search.',
            '**What it means:** **No Result found** for the name you typed.',
            '',
            '1. Try the **exact official school name** (and common short form) on the portal list.',
            '2. Confirm your school is a public institution on this NELFUND cycle.',
            '3. If the school is missing, ask the campus NELFUND desk to upload student records.',
            '4. Do not open a second account.',
            '',
            'Login: https://portal.nelf.gov.ng/auth/login',
            'Ticket if still stuck: https://nelfund.esupport.ng/create',
          ].join('\n'),
        )
      }
      if (/total\s*loans|pending\s*loans|approved\s*loans/i.test(ocr)) {
        const pending = (ocr.match(/pending\s*loans?\s*[:\s]*(\d+)/i) || [])[1]
        const total = (ocr.match(/total\s*loans?\s*[:\s]*(\d+)/i) || [])[1]
        const applied = (pending && Number(pending) > 0) || (total && Number(total) > 0)
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          applied ? 'pending-application' : 'how-to-apply',
          applied
            ? [
                '**Screen:** Student loan portal Home / dashboard.',
                '**Have you applied?** **Yes.**',
                total || pending
                  ? `Counters read from the screenshot: Total **${total || '?'}**, Pending **${pending || '?'}**.`
                  : 'Pending / Total look non-zero on this screenshot.',
                '',
                'Pending means submitted and still processing — not declined.',
                'Open **Loans** → Institutional / Upkeep for View details.',
                'Login: https://portal.nelf.gov.ng/auth/login',
              ].join('\n')
            : [
                '**Screen:** Student loan portal Home / dashboard.',
                '**Have you applied?** **No** (or not yet) — counters look like 0.',
                'Being logged in is not the same as submitting institutional fee or upkeep.',
                'Login: https://portal.nelf.gov.ng/auth/login',
              ].join('\n'),
        )
      }
      // Generic OCR fallback — never crash
      return wrap(
        raw || '[Screenshot uploaded]',
        opts.slots,
        'current-information',
        [
          'I read text from your screenshot, but I could not match a full portal page layout.',
          '',
          'Visible text (short):',
          ocr.slice(0, 280).replace(/\s+/g, ' ').trim(),
          '',
          'Reply with the **exact red banner or status words** (e.g. Pending Loans 2, No Result found, admission letter is required), or re-upload a sharper crop of the main message.',
          'Portal: https://portal.nelf.gov.ng/',
        ].join('\n'),
      )
    } catch {
      return wrap(
        raw || '[Screenshot uploaded]',
        opts.slots,
        'current-information',
        'I could not fully read that screenshot. Type the exact portal message you see (red banner or status), or open https://portal.nelf.gov.ng/ and try again.',
      )
    }
  }

  if (raw && /admission\s*letter\s*(is\s*)?required|please\s*upload\s*(an?\s*)?admission|upload\s*(an?\s*)?admission\s*letter/i.test(raw)) {
    const portalHitAdm = matchPortalKnowledge(raw)
    if (portalHitAdm) return wrap(raw, opts.slots, portalHitAdm.intent as IntentId, portalHitAdm.text)
    const hit = gate(raw, opts.slots, lastAsst, 'documents-needed')
    if (hit) return hit
  }

  if (raw && isOverviewAsk(raw)) {
    return wrap(raw, opts.slots, 'what-is-nelfund', fullNelfundOverview())
  }

  const term = raw ? explainTerm(raw, lastAsst) : null
  if (term) {
    return wrap(raw, opts.slots, term.intent, term.text)
  }

  const portalHit = raw ? matchPortalKnowledge(raw) : null
  if (portalHit) {
    return wrap(raw, opts.slots, portalHit.intent as IntentId, portalHit.text)
  }

  try {
    return await innerProcess(opts as any)
  } catch {
    try {
      const classified = classifyIntent(raw || ocr || 'help')
      const pb = playbookAnswer(classified.intent, { userText: raw || ocr, lastAssistant: lastAsst })
      return wrap(
        raw || '[screenshot]',
        opts.slots || createInitialSlots(),
        classified.intent,
        pb ||
          'Open https://portal.nelf.gov.ng/ and ask again with the exact portal wording. Official site: https://nelf.gov.ng/',
      )
    } catch {
      return wrap(
        raw || '[screenshot]',
        opts.slots || createInitialSlots(),
        'current-information',
        'Open https://portal.nelf.gov.ng/ and ask again with the exact portal wording. Official site: https://nelf.gov.ng/',
      )
    }
  }
}
