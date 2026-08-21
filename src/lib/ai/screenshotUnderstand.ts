/**
 * Lightweight portal-text / OCR understanding (no external vision API).
 * Maps common NELFUND portal phrases to structured hints.
 */

export type ScreenKind = 'dashboard' | 'error' | 'login' | 'unknown'

export interface ScreenUnderstanding {
  kind: ScreenKind
  exactError: string | null
  explanation: string
  nextActions: string[]
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

export function understandPortalText(text: string): ScreenUnderstanding | null {
  const t = (text || '').trim()
  if (!t || t.length < 8) return null

  if (/missing\s*information|record\s*not\s*found|no\s*school\s*info|student\s*record\s*not/i.test(t)) {
    return {
      kind: 'error',
      exactError: 'Missing information / record not found',
      explanation:
        '**Missing information** usually means the portal cannot match your details to a school record yet (name, NIN, JAMB, or matric).\n\nThis is **not** automatically a permanent rejection.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry the portal after they confirm\n4. Still failing → eSupport',
      nextActions: [PORTAL, ESUPPORT, SITE, 'Share your school name'],
    }
  }

  if (/welcome\s+to\s+student\s+loan\s+portal|pending\s*loans|approved\s*loans|total\s*loans/i.test(t)) {
    return {
      kind: 'dashboard',
      exactError: null,
      explanation:
        'That looks like the **student loan portal dashboard**.\n\nDashboard counters (Pending / Approved loans) are **system totals**, not your personal decision.\n\nCheck **your** application card/status on the same portal for the text that applies to you.',
      nextActions: [PORTAL, SITE],
    }
  }

  if (/login|sign\s*in|create\s*(an?\s*)?account|register/i.test(t) && /portal|nelfund|nelf\.gov/i.test(t)) {
    return {
      kind: 'login',
      exactError: null,
      explanation:
        `Use only the official portal: ${PORTAL}\n\nDo not enter passwords or OTP on any other site or with any agent.`,
      nextActions: [PORTAL, SITE],
    }
  }

  return null
}
