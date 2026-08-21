/**
 * Current-information answers — never invent official open/close dates.
 * Live path optionally reads cached knowledge status; falls back to safe guidance.
 */

import type { GroundedAnswer } from './types'

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const FAQ = 'https://nelf.gov.ng/faq'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function buildCurrentInformationAnswer(): GroundedAnswer {
  const answer = `**Current application status (how to check — not a guessed date)**

NELFUND opening and closing dates **change by cycle**. This assistant does not invent dates.

**Reliable sources only:**
• Official site: ${SITE}
• Student portal: ${PORTAL}
• FAQ: ${FAQ}

**Do not mix these up:**
• Account creation ≠ loan application still open
• A closed *previous* session notice ≠ “you can never create an account”
• Social media “deadlines” are unofficial until they match nelf.gov.ng or the portal

Say what you are trying to do (create account, apply for loan, sort BVN, missing information) and I will guide that path.`

  return {
    hasEvidence: true,
    intent: 'current-information',
    confidence: 0.85,
    responseMode: 'conversation',
    problem: null,
    answer,
    whatThisMeans: null,
    nextActions: [SITE, PORTAL, FAQ, ESUPPORT],
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

export async function buildCurrentInformationAnswerLive(): Promise<GroundedAnswer | null> {
  try {
    if (typeof fetch === 'undefined') return buildCurrentInformationAnswer()
    const res = await fetch('/api/knowledge/status', { method: 'GET' })
    if (!res.ok) return buildCurrentInformationAnswer()
    const data = (await res.json().catch(() => null)) as {
      summary?: string
      accountCreationOpen?: boolean
      applicationWindow?: string
    } | null
    if (data?.summary && typeof data.summary === 'string') {
      const base = buildCurrentInformationAnswer()
      base.answer = `${data.summary}\n\n---\n${base.answer}`
      return base
    }
  } catch {
    /* fall through */
  }
  return buildCurrentInformationAnswer()
}
