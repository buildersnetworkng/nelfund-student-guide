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

  if (raw) {
    const journey: Array<[RegExp, IntentId]> = [
      [/otp|one[- ]time|whatsapp\s*(man|agent|guy)|pay\s*(am\s*)?\d|never\s*share|scam/i, 'scam-safety'],
      [/jamb|utme|invalid\s*number/i, 'jamb-verification'],
      [/school\s*(no|not|never)\s*(dey|show|list)|not\s*listed|cannot\s*find\s*(my\s*)?school/i, 'school-not-found'],
      [/wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|which\s*document|what\s*documents/i, 'documents-needed'],
      [/pending|money\s*never|never\s*enter|wetin\s*dey\s*hold|how\s*far\s*(my\s*)?(loan|money)/i, 'pending-application'],
      [/dem\s*don\s*close|still\s*(dey\s*)?open|application\s*(open|close)|when\s*(will|dem|they).*(open|close)/i, 'current-information'],
      [/loan\s*(or|vs)\s*scholarship|na\s*(scholarship|grant)|free\s*money/i, 'loan-or-scholarship'],
      [/interest[- ]?free|zero\s*interest|does\s*(am|it|e)\s*get\s*interest/i, 'loan-or-scholarship'],
      [/how\s*i\s*go\s*(yarn|reach|contact)|official\s*(email|phone|number)|esupport|help\s*desk/i, 'contact-support'],
      [/for\s+(my\s+)?(child|son|daughter|ward)|parent\s+|guardian\s+/i, 'how-to-apply'],
      [/last\s*year\s*(email|account)|old\s*email|returning\s*student/i, 'reapplication'],
      [/already\s*(finish|finished|done)\s*nysc|serving\s*nysc/i, 'repayment'],
      [/school\s+uploaded|uploaded\s+my\s+data/i, 'institution-verification'],
      [/polytechnic|\bpoly\b|monotechnic/i, 'eligibility'],
      [/fresher|newly\s+admitted/i, 'eligibility'],
      [/matric(ulation)?\s+number|no\s+matric/i, 'documents-needed'],
    ]
    for (const [re, intent] of journey) {
      if (re.test(raw)) {
        const hit = gate(raw, opts.slots, lastAsst, intent)
        if (hit) return hit
      }
    }
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
