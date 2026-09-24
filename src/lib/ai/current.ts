/**
 * Current-information answers. Answer the question first, with correct WAT time.
 * Cycle year always comes from getCurrentAcademicCycle() / live status, never a fixed year.
 */

import { getCurrentAcademicCycle } from '../academicCycle'
import { PURPOSE_RE, isPurposeAsk, liveOpenRe } from './intent'
import type { GroundedAnswer } from './types'

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
const FAQ = 'https://nelf.gov.ng/faq'

type LiveStatus = {
  cycle?: string
  status?: string
  status_label?: string
  note?: string
  last_checked?: string
}

function emptyAnswer(partial: Partial<GroundedAnswer> & { answer: string }): GroundedAnswer {
  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: 0.9,
    responseMode: 'conversation',
    problem: null,
    whatThisMeans: null,
    nextActions: [],
    clarifyingQuestions: ['How do I apply step by step?', 'What documents do I need?'],
    evidence: [],
    sources: [
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
      { id: 'portal', label: 'NELFUND signup / portal', url: PORTAL, official: true },
      { id: 'login', label: 'NELFUND login', url: LOGIN_URL, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
    ...partial,
  } as GroundedAnswer
}

export function answerCurrentInformation(
  userText: string,
  live?: LiveStatus | null,
): GroundedAnswer | null {
  const t = (userText || '').trim()
  if (!t) return null

  const cycle = getCurrentAcademicCycle()
  const statusLabel = live?.status_label || live?.status || 'check the official portal'
  const note = live?.note || ''

  const openRe = typeof liveOpenRe === 'function' ? liveOpenRe() : liveOpenRe

  if (openRe.test(t) || /is (the )?(loan|application|nelfund).{0,30}open|window open|application open/i.test(t)) {
    const closed =
      /closed|not open|ended/i.test(String(live?.status || live?.status_label || '')) ||
      /closed/i.test(note)
    const body =
      (closed
        ? '**Loan / upkeep application:** currently **closed** (or previous cycle closed). Wait for official opening dates on nelf.gov.ng.'
        : `**Application status:** ${statusLabel}.`) +
      `\n\nAlways confirm live on ${PORTAL} and ${SITE}. I will not invent a deadline.` +
      (note ? `\n\n${note}` : '')
    return emptyAnswer({ answer: body, intent: 'current-information' })
  }

  if (isPurposeAsk(t) || PURPOSE_RE.test(t)) {
    return null
  }

  if (/sign\s*up|create\s*(an\s*)?account|register/i.test(t) && /login|sign\s*in/i.test(t) === false) {
    return emptyAnswer({
      answer:
        `**Sign up** (new account): ${PORTAL}\n\n` +
        `**Login / sign in** (existing account): ${LOGIN_URL}\n\n` +
        `Official website: ${SITE}`,
      intent: 'how-to-apply',
    })
  }

  if (/how\s+(do\s+i|to)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(t)) {
    return emptyAnswer({
      answer:
        `**Login / sign in:** ${LOGIN_URL}\n\n` +
        `**Signup / apply:** ${PORTAL}\n\n` +
        `Website: ${SITE}`,
      intent: 'portal-login',
    })
  }

  if (/this\s+session|academic\s+cycle|202[5-7]/i.test(t) && /nelfund|loan|apply/i.test(t)) {
    return emptyAnswer({
      answer:
        `${note ? note + '\n\n' : ''}Sign **up** and loan/upkeep application are different steps.\n` +
        `• Sign up: ${PORTAL}\n` +
        `• Login: ${LOGIN_URL}\n` +
        `• Website: ${SITE}\n\n` +
        `Cycle focus: ${live?.cycle || cycle.label}. Confirm open/closed only on the official portal.`,
    })
  }

  if (/difference.{0,15}sign\s*up|sign\s*up.{0,15}(vs|versus|and).{0,15}(login|apply)/i.test(t)) {
    return emptyAnswer({
      answer:
        `• Sign **up** (new account): ${PORTAL}\n` +
        `• Sign **in** / login: ${LOGIN_URL}\n` +
        `• Website: ${SITE}\n\n` +
        'Signup creates the account; login opens an existing one; loan request is a separate step when the window is open.',
    })
  }

  return null
}

export function buildCurrentInformationAnswer(userText: string, live?: LiveStatus | null): GroundedAnswer | null {
  return answerCurrentInformation(userText, live)
}

export function buildCurrentInformationAnswerLive(userText: string, live?: LiveStatus | null): GroundedAnswer | null {
  return answerCurrentInformation(userText, live)
}

export function isPurposeQuestion(text: string): boolean {
  return PURPOSE_RE.test(text || '') || isPurposeAsk(text || '')
}

export function questionNeedsCurrentLive(text: string): boolean {
  const openRe = typeof liveOpenRe === 'function' ? liveOpenRe() : liveOpenRe
  return openRe.test(text || '') || /is (the )?(loan|application|nelfund).{0,30}open|window open|when will nelfund/i.test(text || '')
}
