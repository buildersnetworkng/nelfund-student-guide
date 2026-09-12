/**
 * Current-information answers. Answer the question first, with correct WAT time.
 * Cycle year always comes from getCurrentAcademicCycle() / live status, never a fixed year.
 */

import { getCurrentAcademicCycle } from '../academicCycle'
import { PURPOSE_RE, isPurposeAsk, liveOpenRe } from './intent'
import type { GroundedAnswer } from './types'

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const FAQ = 'https://nelf.gov.ng/faq'

type LiveStatus = {
  cycle?: string
  status?: string
  status_label?: string
  note?: string
  last_checked?: string
  last_checked_iso?: string
  freshness?: string
  verified?: boolean
  confidence?: string
  signals?: string[]
  sources?: Array<{ id: string; label: string; url: string }>
}

function formatWat(isoOrDay?: string | null, useNow = false): string {
  try {
    const d = useNow || !isoOrDay
      ? new Date()
      : new Date(isoOrDay.includes('T') ? isoOrDay : `${isoOrDay}T12:00:00Z`)
    if (Number.isNaN(d.getTime())) return isoOrDay || 'unknown'
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(d)
      .replace(',', '')
      .replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1') + ' WAT'
  } catch {
    return isoOrDay || 'unknown'
  }
}

function todayWatLabel(): string {
  return formatWat(null, true)
}

function cycleLabel(data?: LiveStatus | null): string {
  if (data?.cycle && /\d{4}\s*\/\s*\d{4}/.test(data.cycle)) return data.cycle.replace(/\s/g, '')
  return getCurrentAcademicCycle()
}

function isStale(iso?: string | null): boolean {
  if (!iso) return true
  try {
    const t = new Date(iso.includes('T') ? iso : `${iso}T12:00:00Z`).getTime()
    return Number.isNaN(t) || Date.now() - t > 60 * 60 * 1000
  } catch {
    return true
  }
}

function interpretOpenState(data: LiveStatus): {
  loanWindow: 'open' | 'closed' | 'unconfirmed'
  accountCreation: 'open' | 'unconfirmed'
  loanLine: string
  accountLine: string
} {
  const status = (data.status || '').toLowerCase()
  const label = (data.status_label || '').toLowerCase()
  const note = (data.note || '').toLowerCase()
  const combined = `${status} ${label} ${note}`

  const loanClearlyOpen =
    status === 'open' &&
    /loan\s*application|application\s*window|upkeep\s*application/.test(combined) &&
    !/unconfirmed|not\s*yet\s*announced|not confirmed|treat\s*any/.test(combined)

  const loanClearlyClosed =
    status === 'closed' || /previous\s*application\s*cycle\s*appears\s*closed|window\s*appears\s*closed|loan\/upkeep closed/.test(combined)

  const accountOpen =
    /account\s*creation\s*(is\s*)?(currently\s*)?open|account\s*creation\s*may\s*be\s*available|register\s*and\s*sort|account creation open/.test(
      combined,
    ) || status === 'not_announced' || status === 'open'

  let loanWindow: 'open' | 'closed' | 'unconfirmed' = 'unconfirmed'
  if (loanClearlyOpen) loanWindow = 'open'
  else if (loanClearlyClosed) loanWindow = 'closed'
  else if (status === 'open' && /portal\s*activity|account\s*creation|unconfirmed|not confirmed/.test(combined)) {
    loanWindow = 'unconfirmed'
  } else if (status === 'extended') loanWindow = 'open'

  const accountCreation: 'open' | 'unconfirmed' = accountOpen ? 'open' : 'unconfirmed'

  const loanLine =
    loanWindow === 'open'
      ? '**Loan / upkeep application:** currently appears **open** on official signals. Still confirm dates on the portal.'
      : loanWindow === 'closed'
        ? '**Loan / upkeep application:** currently **closed** (or previous cycle closed). Wait for official opening dates on nelf.gov.ng.'
        : '**Loan / upkeep application:** **not confirmed open** yet. Portal activity does **not** automatically mean a new loan window is open.'

  const accountLine =
    accountCreation === 'open'
      ? '**Account creation (sign up):** currently **open**. You can register and sort BVN / profile.'
      : '**Account creation (sign up):** treat as unconfirmed until you can complete sign-up on the portal.'

  return { loanWindow, accountCreation, loanLine, accountLine }
}

function isIsOpenQuestion(q?: string): boolean {
  return /\b(is\s+(nelfund|it|the\s*portal|application)\s+open|still\s+open|still\s+accept|can\s+i\s+(still\s+)?apply|is\s+application\s+open|loan\s+window|application\s+window|dem\s+still\s+dey\s+(collect|open)|nelfund\s+dey\s+open)\b/i.test(
    q || '',
  )
}

export function buildCurrentInformationAnswer(): GroundedAnswer {
  const cycle = getCurrentAcademicCycle()
  const answer = `**As of ${todayWatLabel()}** (${cycle})\n\nI do not invent opening or closing dates.\n\n**Loan / upkeep application** and **account creation** are different:\n• Sign **up** (new account): ${PORTAL}\n• Sign **in** / login: ${SITE}\n• Confirm live status only on those official pages\n\nWhat do you need: sign up, login, or submit a loan?`

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: 0.85,
    responseMode: 'conversation',
    problem: null,
    answer,
    whatThisMeans: null,
    nextActions: [PORTAL, SITE],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
}

function answerIsOpen(data: LiveStatus): GroundedAnswer {
  const { loanLine, accountLine } = interpretOpenState(data)
  const cycle = cycleLabel(data)
  const when = todayWatLabel()

  const answer = `**Is NELFUND open?** (as of **${when}**)\n\n**${cycle}**\n\n${loanLine}\n\n${accountLine}\n\n**Where to go**\n• **Sign up** (create account): ${PORTAL}\n• **Login / sign in** (existing account): ${SITE}\n• Support ticket: https://nelfund.esupport.ng/create\n\nI will not invent a closing date. Re-check the portal before you rely on a deadline.`

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: data.confidence === 'high' ? 0.9 : 0.82,
    responseMode: 'conversation',
    problem: null,
    answer,
    whatThisMeans: null,
    nextActions: [PORTAL, SITE],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
}

function answerGeneralStatus(data: LiveStatus): GroundedAnswer {
  const { loanLine, accountLine } = interpretOpenState(data)
  const cycle = cycleLabel(data)
  const when = todayWatLabel()

  const answer = `**NELFUND status as of ${when}** (${cycle})\n\n${loanLine}\n\n${accountLine}\n\n• **Sign up:** ${PORTAL}\n• **Login / sign in:** ${SITE}\n\nAlways verify on the official portal before acting.`

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: data.confidence === 'high' ? 0.9 : 0.82,
    responseMode: 'conversation',
    problem: null,
    answer,
    whatThisMeans: null,
    nextActions: [PORTAL, SITE],
    clarifyingQuestions: [],
    evidence: [],
    sources: [
      { id: 'portal', label: 'NELFUND portal', url: PORTAL, official: true },
      { id: 'site', label: 'NELFUND website', url: SITE, official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: PORTAL,
    escalation: null,
  }
}

async function loadStatus(): Promise<LiveStatus | null> {
  if (typeof fetch === 'undefined') return null
  try {
    let res = await fetch('/api/knowledge/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    let data = res.ok ? ((await res.json().catch(() => null)) as LiveStatus | null) : null

    if (!data || isStale(data.last_checked_iso || data.last_checked)) {
      try {
        await fetch('/api/knowledge/refresh', { method: 'GET' })
      } catch {
        /* ignore */
      }
      res = await fetch('/api/knowledge/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      data = res.ok ? ((await res.json().catch(() => null)) as LiveStatus | null) : null
    }
    return data
  } catch {
    return null
  }
}

export async function buildCurrentInformationAnswerLive(
  userQuestion?: string,
): Promise<GroundedAnswer> {
  try {
    const statusData = await loadStatus()

    if (statusData && (statusData.status_label || statusData.note || statusData.status)) {
      if (isIsOpenQuestion(userQuestion)) {
        return answerIsOpen(statusData)
      }
      return answerGeneralStatus(statusData)
    }
  } catch {
    /* fall through */
  }
  return buildCurrentInformationAnswer()
}

export function isPurposeQuestion(text: string): boolean {
  const q = (text || '').trim()
  return isPurposeAsk(q) || PURPOSE_RE.test(q)
}

/** Live window only. Never purpose / personal pending status / how-to. */
export function questionNeedsCurrentLive(text: string): boolean {
  const q = text || ''
  if (isPurposeQuestion(q)) return false
  if (/why\s+(was|is|dem|they|una|fg|e)|purpose|wetin\s*(be|mean)|what\s*(is|does)\s*(this\s+)?nelfund|explain\s+(this\s+)?nelfund|origin\s+of\s+nelfund|point\s+of\s+nelfund|na\s+wetin|nelfund\s+for\s+wetin|student\s+loans?\s+act/i.test(q)) return false
  if (/\b(my\s+)?(application|loan)\s+status\b|check\s+(my\s+)?status|\bpending\b|under\s*review/i.test(q) && !/is\s+(nelfund|it|portal|application)\s+(still\s+)?open/i.test(q)) {
    return false
  }
  return /\b(is\s+(nelfund|it|the\s*portal|application|loan)\s+(currently\s+)?open|still\s+open|still\s+accept|still\s+dey\s+(open|accept|collect)|dem\s+still\s+dey\s+(collect|accept|open)|deadline|closing\s+date|opening\s+date|when\s+(can|do|will)\s+.{0,20}(apply|open|close)|application\s*(window|period)|loan\s*window|latest\s+(update|news)|current\s+(status|information|update)|as\s+of\s+today|any\s+official\s+update|news\s+about\s+nelfund)\b/i.test(
    q,
  )
}
