/**
 * Portal / website screenshot understanding from OCR text.
 * Flexible signal scoring: not locked to one exact layout.
 * When a screenshot is present, always try to name the screen and next step.
 */

export type ScreenKind =
  | 'dashboard'
  | 'error'
  | 'login'
  | 'website'
  | 'portal-landing'
  | 'eligibility-form'
  | 'apply-flow'
  | 'signup'
  | 'profile'
  | 'unknown'

export interface ScreenUnderstanding {
  kind: ScreenKind
  exactError: string | null
  explanation: string
  nextActions: string[]
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

/** Sample OCR text resembling the official portal dashboard (for tests). */
export const SAMPLE_DASHBOARD_OCR = `
Welcome to Student Loan Portal
Notice 2025/2026 Session Registration
Starts March 5th 2026 And Ends June 5th 2026
Please note that you will not be able to apply for a loan this session after the end date.
Total Loans 0
Approved Loans 0
Pending Loans 0
Declined Loans 0
`

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function parsePortalDate(s: string | undefined): Date | null {
  if (!s) return null
  const m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(20\d{2})/i)
  if (!m) return null
  const month = MONTHS[m[1].toLowerCase()]
  if (month == null) return null
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])))
}
