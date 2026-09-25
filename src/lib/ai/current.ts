/**
 * Current-information answers — time-aware application status.
 * Source of truth is always the official portal, not hardcoded rumour dates.
 */
import { getCurrentAcademicCycle } from '../academicCycle'
import { PURPOSE_RE, isPurposeAsk, liveOpenRe } from './intent'
import type { GroundedAnswer } from './types'
import { applicationStatus } from '../data'

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'

type LiveStatus = {
  cycle?: string
  status?: string
  status_label?: string
  note?: string
  last_checked?: string
  window_start?: string
  window_end?: string
  window_note?: string
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
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
      { id: 'login', label: 'NELFUND login', url: LOGIN_URL, official: true },
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
    ...partial,
  } as GroundedAnswer
}

function parseYmd(s?: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(s + 'T12:00:00')
  return Number.isNaN(d.getTime()) ? null : d
}

function todayLocal(): Date {
  return new Date()
}

/** Resolve effective status using JSON + calendar (after deadline → closed). */
export function resolveApplicationWindow(live?: LiveStatus | null, now: Date = todayLocal()): {
  phase: 'before_window' | 'in_window' | 'after_window' | 'unknown'
  cycle: string
  windowStart: string | null
  windowEnd: string | null
  statusCode: string
  statusLabel: string
} {
  const cfg = { ...(applicationStatus as LiveStatus), ...(live || {}) }
  const cycle = cfg.cycle || getCurrentAcademicCycle()
  const start = parseYmd(cfg.window_start)
  const end = parseYmd(cfg.window_end)
  const statusCode = (cfg.status || 'confirm_on_portal').toLowerCase()
  const statusLabel = cfg.status_label || 'Confirm on official portal only'

  if (!start || !end) {
    return {
      phase: 'unknown',
      cycle,
      windowStart: cfg.window_start || null,
      windowEnd: cfg.window_end || null,
      statusCode,
      statusLabel,
    }
  }

  const t = now.getTime()
  if (t < start.getTime()) {
    return {
      phase: 'before_window',
      cycle,
      windowStart: cfg.window_start!,
      windowEnd: cfg.window_end!,
      statusCode: statusCode === 'open' ? 'not_yet' : statusCode,
      statusLabel: 'Not yet open for this cycle (by stored dates) — still confirm on portal',
    }
  }
  if (t > end.getTime()) {
    return {
      phase: 'after_window',
      cycle,
      windowStart: cfg.window_start!,
      windowEnd: cfg.window_end!,
      statusCode: 'closed',
      statusLabel: 'Stored window end has passed — treat as closed until portal shows a new window',
    }
  }
  return {
    phase: 'in_window',
    cycle,
    windowStart: cfg.window_start!,
    windowEnd: cfg.window_end!,
    statusCode,
    statusLabel,
  }
}

/** Well-structured status write-up used by AI for "is it open?" questions. */
export function formatApplicationStatusAnswer(live?: LiveStatus | null, now: Date = todayLocal()): string {
  const cfg = { ...(applicationStatus as LiveStatus), ...(live || {}) }
  const r = resolveApplicationWindow(cfg, now)
  const lines: string[] = []

  lines.push('**Application status (changes with time)**')
  lines.push('')
  lines.push('**Source of truth (only these):**')
  lines.push(`• Portal / apply: ${PORTAL}`)
  lines.push(`• Login: ${LOGIN_URL}`)
  lines.push(`• Website: ${SITE}`)
  lines.push('')
  lines.push('This guide does **not** invent live open/closed from WhatsApp or blogs.')
  lines.push('')

  lines.push(`**Cycle focus:** ${r.cycle}`)
  lines.push(`**Guide status code:** ${r.statusCode}`)
  lines.push(`**Summary:** ${r.statusLabel}`)
  lines.push('')

  if (r.windowStart && r.windowEnd) {
    lines.push('**Stored window dates (must still match the portal):**')
    lines.push(`• Reported start: **${r.windowStart}**`)
    lines.push(`• Reported end: **${r.windowEnd}**`)
    if (cfg.window_note) lines.push(`• Note: ${cfg.window_note}`)
    lines.push('')
  }

  if (r.phase === 'before_window') {
    lines.push('**What that means today:** By the stored dates, the national window has **not started** yet.')
    lines.push('You can still create/login to an account, complete profile, and watch the portal for **Request Loan**.')
  } else if (r.phase === 'after_window') {
    lines.push('**What that means today:** By the stored dates, this cycle’s national window has **ended**.')
    lines.push('Do not rely on old “still open” messages. Open the portal — if Request Loan is gone, wait for the next official cycle.')
  } else if (r.phase === 'in_window') {
    if (r.statusCode === 'open') {
      lines.push('**What that means today:** Stored data marks this period as a **possible open window**.')
      lines.push('You must still open the portal on **your** account: national open ≠ every school session open.')
    } else {
      lines.push('**What that means today:** Dates may fall in a reported window, but this guide is set to **confirm on portal only** — do not assume open until the portal lets you request a loan.')
    }
  } else {
    lines.push('**What that means today:** No reliable stored window. Check the portal only.')
  }

  lines.push('')
  lines.push('**What you should do:**')
  lines.push(`1. Open ${LOGIN_URL} (or sign up at ${PORTAL}).`)
  lines.push('2. Check **Home** for session notices and whether **Request Loan** is available.')
  lines.push('3. If it says your **institution has not opened a session**, contact campus NELFUND desk, then refresh **☰ → Loans**.')
  lines.push('4. Ignore third-party “deadline” posts that disagree with the portal.')
  if (cfg.last_checked) {
    lines.push('')
    lines.push(`_Guide last reviewed: ${cfg.last_checked}_`)
  }
  if (cfg.note) {
    lines.push('')
    lines.push(cfg.note)
  }

  return lines.join('\n')
}

export function answerCurrentInformation(
  userText: string,
  live?: LiveStatus | null,
): GroundedAnswer | null {
  const t = (userText || '').trim()
  if (!t) return null

  const openRe =
    typeof liveOpenRe === 'function' ? (liveOpenRe as any)() : liveOpenRe

  if (
    (openRe && typeof openRe.test === 'function' && openRe.test(t)) ||
    /is (the )?(loan|application|nelfund|window).{0,40}open|window open|application open|nelfund\s+open|still\s*(dey\s*)?open|dem\s*don\s*close|when\s*(will|dem|they).{0,20}(open|close)|deadline|closing\s*date/i.test(
      t,
    )
  ) {
    return emptyAnswer({
      answer: formatApplicationStatusAnswer(live),
      intent: 'current-information',
    })
  }

  if (isPurposeAsk(t) || PURPOSE_RE.test(t)) {
    return null
  }

  if (/sign\s*up|create\s*(an\s*)?account|register/i.test(t) && /login|sign\s*in/i.test(t) === false) {
    return emptyAnswer({
      answer:
        `**Sign up / new account:** ${PORTAL}\n\n` +
        `**Login (existing account):** ${LOGIN_URL}\n\n` +
        'Creating an account is not the same as submitting a loan. Whether **Request Loan** works depends on the **live** portal window and your school session.',
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
      answer: formatApplicationStatusAnswer(live),
      intent: 'current-information',
    })
  }

  if (/difference.{0,15}sign\s*up|sign\s*up.{0,15}(vs|versus|and).{0,15}(login|apply)/i.test(t)) {
    return emptyAnswer({
      answer:
        `• Sign **up** (new account): ${PORTAL}\n` +
        `• Sign **in** / login: ${LOGIN_URL}\n` +
        `• Website: ${SITE}\n\n` +
        'Signup creates the account; login opens an existing one; loan request is a separate step only while the **portal** allows it.',
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
  const openRe =
    typeof liveOpenRe === 'function' ? (liveOpenRe as any)() : liveOpenRe
  return (
    (openRe && typeof openRe.test === 'function' && openRe.test(text || '')) ||
    /is (the )?(loan|application|nelfund).{0,30}open|window open|when will nelfund|deadline/i.test(text || '')
  )
}
