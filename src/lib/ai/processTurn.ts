/**
 * Public turn entry. Conversation engine lives in ./conversation.
 * Extra student-path gates (overview, term meaning, portal UI knowledge) run first.
 * Understanding layer normalizes English/Pidgin and routes by meaning before playbook.
 * v4-plus: official-host safety, scoped ticket, ambiguity clarify, multi-intent, deadline refusal.
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
import { understandTurn, normalizeStudentText, splitMultiQuestions, isMultiQuestion, isDomainRelated } from './understand'
import { suggest } from './suggest'
import { openWindowReply } from './processTurnOpen'
import type { IntentId } from './types'
import { tryMigratedPath } from './shadow/processTurnBridge'

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

  // Safety first (both paths): never route OTP/BVN/agent payment asks into generic answers
  const safetyBlob = `${raw} ${ocr}`.toLowerCase()
  if (
    /\botp\b/.test(safetyBlob) ||
    /\bbvn\b/.test(safetyBlob) ||
    /send\s*(me\s*)?(your\s*)?(bvn|nin|otp)/i.test(safetyBlob) ||
    /pay\s*(am\s*)?\d/.test(safetyBlob) ||
    /whatsapp\s*(man|agent)/i.test(safetyBlob) ||
    /i am nelfund staff/i.test(safetyBlob) ||
    /here is my bvn|here is my nin/i.test(safetyBlob)
  ) {
    return wrap(
      raw || rawIn || '[screenshot]',
      { ...opts.slots, intent: 'scam-safety', phase: 'resolve' },
      'scam-safety',
      [
        '**Safety**',
        'Do **not** share OTP, password, BVN, or NIN in chat or with WhatsApp agents.',
        'Do **not** pay anyone to “process” NELFUND.',
        'This guide cannot see or change your personal portal account.',
        'Official portal: https://portal.nelf.gov.ng/',
        'Login: https://portal.nelf.gov.ng/auth/login',
        'Tickets: https://nelfund.esupport.ng/create',
        'Site: https://nelf.gov.ng/',
      ].join('\n'),
    )
  }

  // Official-host safety (v4-plus)
  {
    const hostBlob = `${raw} ${ocr}`.toLowerCase()
    const mentionsOfficial =
      /portal\.nelf\.gov\.ng|nelf\.gov\.ng|nelfund\.esupport\.ng/i.test(hostBlob)
    const suspicious =
      /nelfund[-.\s]?(loans?|apply|portal|student)[-.\s]?(app|site|online)?\.(com|net|org|xyz|info|ng)\b/i.test(
        hostBlob,
      ) ||
      (/\b(https?:\/\/)?([\w-]+\.)+(com|net|org|xyz|info)\b/i.test(hostBlob) &&
        /nelfund/i.test(hostBlob) &&
        !mentionsOfficial)
    const unofficialFile =
      /pdfonlinefree|pdfonline|ilovepdf|smallpdf|pdf2go|iloveimg|jpg2pdf|img2pdf/i.test(hostBlob) &&
      /(upload|send|share|convert).{0,40}(id|document|file|admission|jamb|screenshot)/i.test(hostBlob)
    if ((suspicious || unofficialFile) && !mentionsOfficial) {
      return wrap(
        raw || rawIn || '[screenshot]',
        { ...opts.slots, intent: 'scam-safety', phase: 'resolve' },
        'scam-safety',
        [
          '**Use only official NELFUND channels**',
          'That link or service is **not** a verified NELFUND channel in this guide.',
          'I will not treat it as official, and you should not enter NIN, BVN, OTP, or passwords there.',
          'Verified channels only:',
          '• Portal: https://portal.nelf.gov.ng/',
          '• Site: https://nelf.gov.ng/',
          '• Support tickets: https://nelfund.esupport.ng/create',
          'Unverified is not the same as a proven scam, but do not share personal data off official sites.',
        ].join('\n'),
      )
    }
  }

  if (/tell me if (i|nelfund)\s*(am|is)\s*(approved|declined)|check my account and tell/i.test(`${raw} ${ocr}`)) {
    return wrap(
      raw || rawIn || '[screenshot]',
      { ...opts.slots, intent: 'pending-application', phase: 'resolve' },
      'pending-application',
      [
        'I **cannot** see your personal NELFUND account or approval status from this guide.',
        'Log in and check **☰ → Loans** on https://portal.nelf.gov.ng/auth/login',
        'Portal: https://portal.nelf.gov.ng/',
      ].join('\n'),
    )
  }

  // Ambiguity clarify (v4-plus) — only short vague asks
  {
    const ambigRaw = (raw || rawIn || '').trim()
    if (
      ambigRaw.length > 0 &&
      ambigRaw.length < 60 &&
      (/^(what\s+is\s+my\s+status\??|has\s+it\s+come\??|help\s*me\??|help\??|status\??|my\s+status\??)$/i.test(
        ambigRaw,
      ) ||
        /^(it\s+is\s+not\s+working|not\s+working)\??$/i.test(ambigRaw) ||
        /^(help\s+me\s+with\s+my\s+loan|help\s+with\s+(my\s+)?(loan|application))\??$/i.test(ambigRaw) ||
        /^(the\s+number\s+is\s+wrong|number\s+wrong|wrong\s+number)\??$/i.test(ambigRaw) ||
        /^(my\s+jamb)\??$/i.test(ambigRaw))
    ) {
      let clarifyLines: string[]
      if (/jamb/i.test(ambigRaw)) {
        clarifyLines = [
          'I need a bit more **detail**: what is wrong with **JAMB** on the portal?',
          'For example: invalid format, no result, name mismatch, or something else?',
          'You can paste the exact portal message (no BVN/NIN/OTP).',
          'Portal: https://portal.nelf.gov.ng/',
        ]
      } else if (/number\s+is\s+wrong|wrong\s+number/i.test(ambigRaw)) {
        clarifyLines = [
          'Which number is wrong — **JAMB**, **NIN**, **BVN**, **matric**, or a **fee** amount?',
          'Paste the exact portal message if you can (no BVN/NIN/OTP).',
          'Portal: https://portal.nelf.gov.ng/',
        ]
      } else {
        clarifyLines = [
          'I need a bit more detail to help accurately.',
          'Are you stuck on **login**, **application**, **pending status**, **missing information**, or something else?',
          'You can also paste the exact portal message (no BVN/NIN/OTP).',
          'Portal: https://portal.nelf.gov.ng/',
        ]
      }
      return wrap(
        ambigRaw,
        { ...opts.slots, intent: 'pending-application', phase: 'clarify' },
        'pending-application',
        clarifyLines.join('\n'),
      )
    }
  }

  // Multi-intent: what is NELFUND + who can apply + loan vs scholarship
  if (
    raw &&
    /what\s+is\s+nelfund/i.test(raw) &&
    /who\s+can\s+apply|eligib/i.test(raw) &&
    /scholarship|loan\s+or|is\s+it\s+(a\s+)?(loan|scholarship)/i.test(raw)
  ) {
    return wrap(
      raw,
      { ...opts.slots, intent: 'what-is-nelfund', phase: 'resolve' },
      'what-is-nelfund',
      [
        '**1. What NELFUND is**',
        'NELFUND is the **Nigeria Education Loan Fund** — a government **interest-free student loan** for eligible students in public tertiary institutions. Institutional charges go to the school; optional upkeep goes to you.',
        '',
        '**2. Who can apply**',
        '• Nigerian citizen',
        '• Admission into a **public** university, polytechnic, college of education, or vocational school',
        '• Valid school upload / record on the portal for the open session',
        '',
        '**3. Loan, not a scholarship**',
        'It is an **interest-free loan**, not a gift, grant, or pure scholarship. Repayment follows official rules after study/NYSC — confirm on https://nelf.gov.ng/',
        '',
        'Portal: https://portal.nelf.gov.ng/',
      ].join('\n'),
    )
  }

  // Scoped support-ticket (v4-plus): pure ticket how-to only
  if (
    raw &&
    /(?:support\s*ticket|(?:open|raise|create)\s+(?:an?\s+)?(?:official\s+)?(?:nelfund\s+)?(?:support\s+)?ticket|how\s+(?:do\s+i|to|i\s+go)\s+(?:open|raise|create)\s+.*ticket)/i.test(
      raw,
    ) &&
    !/missing\s+information|what\s+does\s+it\s+mean|portal\s+missing/i.test(raw)
  ) {
    return wrap(
      raw,
      { ...opts.slots, intent: 'contact-support', phase: 'resolve' },
      'contact-support',
      [
        '**Official NELFUND support ticket**',
        '1. Prefer fixing the issue on the portal first: https://portal.nelf.gov.ng/',
        '2. If the portal does not resolve it, open a ticket only on the official form:',
        '   https://nelfund.esupport.ng/create',
        '3. Include your full name, school, and a clear description (screenshot helps).',
        '4. Do **not** share OTP, password, BVN, or NIN in chat or with WhatsApp agents.',
        '5. I cannot invent a reply deadline or guarantee escalation speed — wait for the official ticket response.',
        'Official site: https://nelf.gov.ng/',
      ].join('\n'),
    )
  }

  if (raw && /exact\s*(national\s*)?deadline|deadline\s*this\s*cycle|when\s*is\s*(the\s*)?deadline/i.test(raw)) {
    return wrap(
      raw,
      { ...opts.slots, intent: 'current-information', phase: 'resolve' },
      'current-information',
      [
        '**National deadline / window**',
        'I will **not** invent an exact national deadline date.',
        'Confirm the **live** application window only on the official portal and site:',
        '• Portal: https://portal.nelf.gov.ng/',
        '• Site: https://nelf.gov.ng/',
        'School session can still be closed even when the national window is open.',
      ].join('\n'),
    )
  }

  // G3 controlled rollout: migrated areas only; any failure → legacy path below
  try {
    const bridged = tryMigratedPath({
      userText: raw || rawIn,
      ocrText: ocr || ocrRaw,
      slots: opts.slots,
      userKey: opts.uiInstitutionId || null,
    })
    if (bridged.used === 'migrated' && bridged.text && bridged.intent) {
      const nextSlots: ConversationSlots = {
        ...opts.slots,
        intent: bridged.intent,
        phase: 'resolve',
      }
      if (bridged.dialog?.institutionId) {
        nextSlots.institutionId = bridged.dialog.institutionId
      }
      const result = wrap(raw || rawIn || '[screenshot]', nextSlots, bridged.intent, bridged.text)
      try {
        ;(result as AgentTurnResult & { pathSelection?: unknown }).pathSelection = bridged.selection
        if (result.messages?.[1]?.answer) {
          const a = result.messages[1].answer as { evidence?: unknown[] }
          const eids = bridged.selection.evidence_ids || []
          if (eids.length) {
            ;(a as { evidence?: unknown }).evidence = eids.map((id: string) => ({
              kind: 'fact',
              id,
              title: id,
              body: '',
              verification_status: 'verified',
              scope: 'national',
              institution_id: null,
              source_id: 'pack',
              last_verified: null,
              related_video_ids: [],
            }))
          }
        }
      } catch {
        /* metadata optional */
      }
      return result
    }
  } catch {
    /* deterministic fallback to legacy */
  }

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
            '**What it means:** **No Result found** — the name typed is not matching the portal list.',
            '',
            '1. Try shorter names (e.g. Olabisi Onabanjo, OOU).',
            '2. Confirm public institution for this cycle.',
            '3. If still No Result found → campus NELFUND / ICT desk.',
            '4. Do not open a second account.',
            '',
            'Login: https://portal.nelf.gov.ng/auth/login',
            'Send a support message with your screenshot at https://nelfund.esupport.ng/create',
          ].join('\n'),
        )
      }
      if (/institution has not opened|has not opened a session/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'pending-application',
          [
            '**Screen:** Home — institution has not opened a session.',
            '1. Log in again. 2. Open ☰ → Loans and Home. 3. Refresh/reload.',
            '4. Contact campus NELFUND desk.',
            'If still the same: send a support message with screenshot at https://nelfund.esupport.ng/create',
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
            ? '**Screen:** Portal Home. You have applied (Pending/Total non-zero). Pending = processing, not declined. Open ☰ → Loans. Login: https://portal.nelf.gov.ng/auth/login'
            : '**Screen:** Portal Home. Counters look like 0 — not applied yet on this account. Login: https://portal.nelf.gov.ng/auth/login',
        )
      }
      if (/cancel\s*(loan|application)|yes,?\s*cancel\s*loan|don\'?t\s*cancel/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'pending-application',
          '**Cancel Loan** confirmation. Cancelling institutional also cancels upkeep; cannot be undone. Only while pending and nothing disbursed. Login → ☰ → Loans → Cancel. Re-apply possible if no money was released. Support: https://nelfund.esupport.ng/create',
        )
      }
      if (/admission\s*letter\s*(is\s*)?required/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'documents-needed',
          '**Admission letter is required.** Upload a clear admission letter on that step. Portal: https://portal.nelf.gov.ng/',
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
        'I could read some text from your screenshot. Reply with the main title or red message (e.g. No Result found, Pending Loans 2). Portal: https://portal.nelf.gov.ng/',
      )
    } catch {
      return wrap(
        raw || '[Screenshot uploaded]',
        opts.slots,
        'current-information',
        'I could not fully read that screenshot. Type the exact portal message, or open https://portal.nelf.gov.ng/',
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
