/**
 * Public turn entry. Conversation engine lives in ./conversation.
 * Extra student-path gates (overview, term meaning, portal UI knowledge) run first.
 * Understanding layer normalizes English/Pidgin and routes by meaning before playbook.
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
import { understandTurn, normalizeStudentText } from './understand'
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
  const rawIn = (opts.userText || '').trim()
  const raw = normalizeStudentText(rawIn) || rawIn
  const ocrRaw = (typeof opts.ocrText === 'string' ? opts.ocrText : '').trim()
  const ocr = normalizeStudentText(ocrRaw) || ocrRaw
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
        // Prefer school-not-found label when No Result found
        const intentFinal: IntentId =
          /no\s*result\s*found|select\s*institution|verify\s*educational/i.test(ocr)
            ? 'school-not-found'
            : intent
        return wrap(raw || '[Screenshot uploaded]', { ...opts.slots, intent: intentFinal }, intentFinal, screen.explanation)
      }
      if (/no\s*result\s*found|select\s*institution|verify\s*educational/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'school-not-found',
          [
            '**Screen:** **Verify Educational Information** (signup / profile) — Select Institution.',
            '**What it means:** **No Result found** — the name typed is not matching the portal list (or the school is not loaded for this cycle yet).',
            '',
            '**What to do:**',
            '1. Clear the box and try shorter forms (e.g. for Olabisi Onabanjo University: “Olabisi Onabanjo”, “Onabanjo University”, “OOU”).',
            '2. Check spelling carefully; do not add extra words the list may not use.',
            '3. Confirm the school is a **public** institution on this NELFUND cycle.',
            '4. If every reasonable name still shows No Result found → campus **NELFUND / registry / ICT desk** must confirm the institution is on the portal and student data is uploaded. Official guidance: school ICT should contact NELFUND.',
            '5. Do **not** open a second account while waiting.',
            '6. Refresh the page / try another network if the whole dropdown is empty.',
            '',
            'Login / continue: https://portal.nelf.gov.ng/auth/login',
            'Portal: https://portal.nelf.gov.ng/',
            'Ticket with screenshot: https://nelfund.esupport.ng/create',
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
                  ? `Counters: Total **${total || '?'}**, Pending **${pending || '?'}**.`
                  : 'Pending / Total look non-zero.',
                '',
                'Pending means submitted and still processing — not declined.',
                'Open **☰ → Loans** → Institutional / Upkeep for View details.',
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
            '• Cancelling **institutional / school-fees** also cancels **upkeep** if you have one.',
            '• **This action cannot be undone.**',
            '',
            '**Steps to cancel yourself:** Login → **☰** → **Loans** → scroll to status → **Cancel** → **Yes, Cancel Loan**.',
            'If still **pending** and **nothing disbursed**, you can usually **re-apply** after cancel and use **Raise a dispute** when the fee shown is wrong.',
            '',
            'Portal: https://portal.nelf.gov.ng/',
            'Login: https://portal.nelf.gov.ng/auth/login',
            'If Cancel stuck: https://nelfund.esupport.ng/create',
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
            'Upload a clear admission letter on that step, then continue.',
            'Portal: https://portal.nelf.gov.ng/',
            'Ticket if still blocked: https://nelfund.esupport.ng/create',
          ].join('\n'),
        )
      }
      const uOcr = understandTurn(ocr, lastAsst, (opts.slots?.intent as IntentId) || null)
      if (uOcr.suggestedIntent && uOcr.confidence >= 0.85) {
        const hit = gate(uOcr.normalized || ocr, opts.slots, lastAsst, uOcr.suggestedIntent)
        if (hit) return hit
      }
      return wrap(
        raw || '[Screenshot uploaded]',
        opts.slots,
        'current-information',
        [
          'I could read some text from your screenshot, but not a full standard layout.',
          '',
          'Reply with the **main title or red message** (e.g. No Result found, Cancel Loan Application, Pending Loans 2, admission letter is required).',
          'Or re-upload a sharper crop of the banner/status only.',
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

  if (raw) {
    try {
      const u = understandTurn(raw, lastAsst, (opts.slots?.intent as IntentId) || null)
      if (u.speechAct === 'define_term' && u.suggestedIntent && u.confidence >= 0.75) {
        const hit = gate(u.normalized || raw, opts.slots, lastAsst, u.suggestedIntent)
        if (hit) return hit
      }
      if (
        u.speechAct === 'new_question' &&
        u.suggestedIntent &&
        u.confidence >= 0.85 &&
        u.suggestedIntent !== 'current-information'
      ) {
        const hit = gate(u.normalized || raw, opts.slots, lastAsst, u.suggestedIntent)
        if (hit) return hit
      }
    } catch {
      /* understanding must not break chat */
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

  if (raw && /no\s*result\s*found|select\s*institution|verify\s*educational|school\s*(no|not|never)\s*(dey|show|list|found)|my\s*school\s*is\s*not\s*(showing|on\s*the\s*list)|cannot\s*find\s*(my\s*)?school|olabisi\s*onabanjo/i.test(raw)) {
    const portalHit = matchPortalKnowledge(raw)
    if (portalHit) return wrap(raw, opts.slots, portalHit.intent as IntentId, portalHit.text)
    const hit = gate(raw, opts.slots, lastAsst, 'school-not-found')
    if (hit) return hit
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
      [/school\s*(no|not|never)\s*(dey|show|list)|not\s*listed|cannot\s*find\s*(my\s*)?school|no\s*result\s*found/i, 'school-not-found'],
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
    return await innerProcess({ ...opts, userText: raw || opts.userText } as any)
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
