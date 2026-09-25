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
import { answerCurrentInformation } from './current'
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
  try {
    const pb = playbookAnswer(intent, { userText: raw, lastAssistant: lastAsst })
    if (pb) return wrap(raw, slots, intent, pb)
  } catch {
    /* fall through */
  }
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
                '**Have you applied?** **Yes** — at least one request is on this account.',
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
      if (/cancel\s*(loan|application)|are\s*you\s*sure\s*you\s*want\s*to\s*cancel|yes,\s*cancel\s*loan|don'?t\s*cancel/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'pending-application',
          [
            '**Screen:** Cancel Loan Application confirmation.',
            '',
            'The portal is asking if you are **sure** you want to cancel this loan application.',
            '',
            '**Important (from the portal text):**',
            '• Cancelling the **institutional / school-fees loan** will also cancel your **upkeep** loan if you have one.',
            '• **This action cannot be undone.**',
            '',
            '**What to do:**',
            "• If you still want the loan/upkeep → tap **Don't Cancel** (leave the application as it is).",
            '• If you truly want to withdraw → only then tap **Yes, Cancel Loan**.',
            '',
            'Pending applications are normal while NELFUND processes them — you usually do **not** need to cancel unless you applied by mistake or need to correct something with support first.',
            '',
            'Portal: https://portal.nelf.gov.ng/',
            'Login: https://portal.nelf.gov.ng/auth/login',
            'If stuck after a mistake: https://nelfund.esupport.ng/create',
          ].join('\n'),
        )
      }
      if (/admission\s*letter\s*(is\s*)?required|upload\s*(an?\s*)?admission/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'documents-needed',
          [
            '**Screen:** Application blocker — **An admission letter is required**.',
            '',
            'Upload a clear admission letter (or school admission evidence the portal accepts) on that step, then continue.',
            'If you already uploaded and still see the red banner, try a sharper PDF/JPG and confirm the file is not password-protected.',
            '',
            'Portal: https://portal.nelf.gov.ng/',
            'Ticket if still blocked: https://nelfund.esupport.ng/create',
          ].join('\n'),
        )
      }
      return wrap(
        raw || '[Screenshot uploaded]',
        opts.slots,
        'current-information',
        [
          'I could read some text from your screenshot, but not a full standard layout.',
          '',
          'From what is visible, reply with the **main title or red message** (for example: Cancel Loan Application, Pending Loans 2, No Result found, admission letter is required).',
          '',
          'Or re-upload a sharper crop focused on the banner/status only.',
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

  if (raw && /is\s+(the\s+)?(loan|application|nelfund|window).{0,40}open|application\s+open|nelfund\s+open|window\s+open|still\s*(dey\s*)?open|dem\s*don\s*close|when\s*(will|dem|they).{0,20}(open|close)|is\s*it\s*open/i.test(raw)) {
    try {
      const cur = answerCurrentInformation(raw, {
        cycle: '2026/2027',
        status: 'open',
        status_label: '2026/2027 open · 23 Sep 2026 – 31 Dec 2026',
        note: 'Re-enter BVN and bank when the portal asks. Institution session may still be closed at your school.',
      })
      if (cur?.answer) {
        return wrap(raw, opts.slots, 'current-information', cur.answer)
      }
    } catch { /* fall through */ }
    return wrap(
      raw,
      opts.slots,
      'current-information',
      [
        '**Yes — 2026/2027 is open on the official portal.**',
        '',
        '• Window: **23 September 2026 – 31 December 2026**.',
        '• Students re-enter **BVN and bank details** for this cycle when the portal asks.',
        '• You can request **institutional fee** and/or **upkeep**.',
        '• If Home says your institution has not opened a session, contact your campus NELFUND desk.',
        '',
        'Portal: https://portal.nelf.gov.ng/',
        'Login: https://portal.nelf.gov.ng/auth/login',
        'Official site: https://nelf.gov.ng/',
      ].join('\n'),
    )
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
      [/email\s*(already|has\s*already|is\s*already)\s*(in\s*use|used|taken)|mail\s*don\s*dey/i, 'email-already-used'],
      [/loan\s+and\s+upkeep|i\s*meant.{0,30}(loan|upkeep)|apply.{0,20}(loan|upkeep)/i, 'how-to-apply'],
      [/how\s*(do\s*i|to|i\s*go)\s*(log\s*in|login)|abeg.{0,12}(log\s*in|login)/i, 'portal-login'],
      [/name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch/i, 'bank-information'],
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
