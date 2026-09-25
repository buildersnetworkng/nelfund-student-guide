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
import { understandTurn, normalizeStudentText, splitMultiQuestions, isMultiQuestion, isDomainRelated } from './understand'
import { suggest } from './suggest'
import { openWindowReply } from './processTurnOpen'
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
            '**Screen:** **Verify Educational Information** (signup / profile) \u2014 Select Institution.',
            '**What it means:** **No Result found** \u2014 the name typed is not matching the portal list.',
            '',
            '1. Try shorter names (e.g. Olabisi Onabanjo, OOU).',
            '2. Confirm public institution for this cycle.',
            '3. If still No Result found \u2192 campus NELFUND / ICT desk.',
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
            '**Screen:** Home \u2014 institution has not opened a session.',
            '1. Log in again. 2. Open \u2630 \u2192 Loans and Home. 3. Refresh/reload.',
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
            ? '**Screen:** Portal Home. You have applied (Pending/Total non-zero). Pending = processing, not declined. Open \u2630 \u2192 Loans. Login: https://portal.nelf.gov.ng/auth/login'
            : '**Screen:** Portal Home. Counters look like 0 \u2014 not applied yet on this account. Login: https://portal.nelf.gov.ng/auth/login',
        )
      }
      if (/cancel\s*(loan|application)|yes,?\s*cancel\s*loan|don'?t\s*cancel/i.test(ocr)) {
        return wrap(
          raw || '[Screenshot uploaded]',
          opts.slots,
          'pending-application',
          '**Cancel Loan** confirmation. Cancelling institutional also cancels upkeep; cannot be undone. Only while pending and nothing disbursed. Login \u2192 \u2630 \u2192 Loans \u2192 Cancel. Re-apply possible if no money was released. Support: https://nelfund.esupport.ng/create',
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
      if (u.speechAct === 'expand' && u.suggestedIntent) {
        const hit = gate(u.normalized || raw, opts.slots, lastAsst, u.suggestedIntent)
        if (hit) return hit
      }
    } catch {
      /* understanding must not break chat */
    }
  }

  if (raw && /is\s+(the\s+)?(loan|application|nelfund|window).{0,40}open|application\s+open|nelfund\s+open|still\s*(dey\s*)?open|dem\s*don\s*close|is\s*it\s*open/i.test(raw)) {
    return wrap(
      raw,
      opts.slots,
      'current-information',
      openWindowReply(),
    )
  }

  if (raw && /no\s*result\s*found|select\s*institution|school\s*(no|not|never)\s*(dey|show|list|found)|my\s*school\s*is\s*not\s*(showing|on\s*the\s*list)/i.test(raw)) {
    const portalHit = matchPortalKnowledge(raw)
    if (portalHit) return wrap(raw, opts.slots, portalHit.intent as IntentId, portalHit.text)
    const hit = gate(raw, opts.slots, lastAsst, 'school-not-found')
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

  if (raw && isMultiQuestion(raw)) {
    const parts = splitMultiQuestions(raw)
    const chunks: string[] = []
    let primaryIntent: IntentId = (opts.slots?.intent as IntentId) || 'how-to-apply'
    for (let i = 0; i < Math.min(parts.length, 3); i++) {
      const part = parts[i]
      const u = understandTurn(part, lastAsst, (opts.slots?.intent as IntentId) || null)
      const intent = (u.suggestedIntent || classifyIntent(part).intent) as IntentId
      if (i === 0) primaryIntent = intent
      try {
        const termHit = explainTerm(part, lastAsst)
        if (termHit) {
          chunks.push('**' + (i + 1) + '.** ' + termHit.text)
          continue
        }
      } catch { /* */ }
      const ph = matchPortalKnowledge(part)
      if (ph) {
        chunks.push('**' + (i + 1) + '.** ' + ph.text)
        continue
      }
      try {
        const pb = playbookAnswer(intent, { userText: part, lastAssistant: lastAsst })
        if (pb) chunks.push('**' + (i + 1) + '.** ' + pb)
        else chunks.push('**' + (i + 1) + '.** Open https://portal.nelf.gov.ng/ for: "' + part.slice(0, 80) + '"')
      } catch {
        chunks.push('**' + (i + 1) + '.** Check https://portal.nelf.gov.ng/ regarding: "' + part.slice(0, 80) + '"')
      }
    }
    if (parts.length > 3) {
      chunks.push('_(You asked ' + parts.length + ' things \u2014 I answered the first 3. Ask the rest one by one for more detail.)_')
    }
    if (chunks.length) {
      return wrap(raw, opts.slots, primaryIntent, chunks.join('\n\n'))
    }
  }

  if (
    raw &&
    /what\s*(should\s*i\s*do|next|first)|wetin\s*(next|i\s*go\s*do)|first\s*step|so\s*what(\s*now)?/i.test(raw)
  ) {
    const prior = (opts.slots?.intent as IntentId) || null
    const intent = prior && prior !== 'unknown' ? prior : 'how-to-apply'
    const hit = gate(raw, opts.slots, lastAsst, intent)
    if (hit) return hit
    return wrap(
      raw,
      opts.slots,
      intent,
      [
        '**What to do next (typical order):**',
        '',
        '1. Log in: https://portal.nelf.gov.ng/auth/login',
        '2. Finish **Profile** (NIN, JAMB, BVN, bank) if incomplete.',
        '3. On **Home**, confirm your school session is open.',
        '4. Apply: institutional fees and/or upkeep. Use **Raise a dispute** if the fee shown is wrong **before** Submit.',
        '5. After submit: **\u2630 \u2192 Loans** \u2014 Pending is normal while processing.',
        '',
        'If blocked: campus NELFUND desk, then send a support message with a screenshot at https://nelfund.esupport.ng/create',
      ].join('\n'),
    )
  }

  if (raw) {
    const journey: Array<[RegExp, IntentId]> = [
      [/otp|whatsapp\s*(man|agent)|pay\s*(am\s*)?\d|scam/i, 'scam-safety'],
      [/jamb|invalid\s*number/i, 'jamb-verification'],
      [/school\s*(no|not|never)\s*(dey|show|list)|no\s*result\s*found/i, 'school-not-found'],
      [/pending|money\s*never|disburse|disurment|how\s*far\s*(my\s*)?(loan|money)/i, 'pending-application'],
      [/dem\s*don\s*close|still\s*(dey\s*)?open|application\s*(open|close)/i, 'current-information'],
      [/upkeep|school\s*fees?|institutional|who\s*(go|will)\s*pay/i, 'upkeep-vs-fees'],
      [/how\s*(do\s*i|to|i\s*go)\s*(log\s*in|login)|forgot\s*(password|email)|email\s*already/i, 'portal-login'],
      [/how\s*(do\s*i|to|i\s*go)\s*apply|where\s*(do\s*i\s*)?apply/i, 'how-to-apply'],
      [/repay|after\s*nysc/i, 'repayment'],
      [/eligib|who\s*can\s*apply/i, 'eligibility'],
      [/cancel\s*(loan|application)|reapply/i, 'pending-application'],
      [/document|admission\s*letter|wetin\s*(i|dem)\s*(go\s*)?(carry|upload)/i, 'documents-needed'],
      [/contact|esupport|helpline|who\s*(i\s*)?go\s*call/i, 'contact-support'],
      [/name\s*(no|not)\s*match|mismatch/i, 'missing-information'],
    ]
    for (const [re, intent] of journey) {
      if (re.test(raw)) {
        const hit = gate(raw, opts.slots, lastAsst, intent)
        if (hit) return hit
      }
    }
  }

  if (raw && isDomainRelated(raw, lastAsst)) {
    try {
      const classified = classifyIntent(raw)
      const hit = gate(raw, opts.slots, lastAsst, classified.intent)
      if (hit) return hit
      const pb = playbookAnswer(classified.intent, { userText: raw, lastAssistant: lastAsst })
      if (pb) return wrap(raw, opts.slots, classified.intent, pb)
    } catch { /* fall through */ }
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
