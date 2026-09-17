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
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function parsePortalDate(s: string | undefined): Date | null {
  if (!s) return null
  const m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(20\d{2})/i)
  if (!m) return null
  const month = MONTHS[m[1].toLowerCase()]
  if (month == null) return null
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2])))
}

/** Follow-up when a student asks what the dashboard screenshot means. */
export function dashboardFollowUpExplanation(): string {
  return [
    '**What this dashboard means**',
    '',
    'You are signed into the **Student Loan Portal**. The counters (Total / Approved / Pending / Declined) show loan requests on **this** account.',
    '',
    '• **0 pending and 0 approved** usually means you have not submitted a loan request yet, or your school has not uploaded your data for this session.',
    '• Session registration dates on the notice are what the portal is advertising. Always re-check live on the portal before you rely on a deadline.',
    '• **Account creation** is different from **loan / upkeep application**. Being logged in does not automatically mean a loan window is open.',
    '',
    `Next: confirm school and session on ${PORTAL}. If something is stuck, ticket ${ESUPPORT} with a clear screenshot. Site: ${SITE}.`,
  ].join('\n')
}

/**
 * Classify portal/website OCR text into a screen kind and student-facing next steps.
 * Returns null when the text does not look like a portal/website dump.
 */
export function understandPortalText(text: string): ScreenUnderstanding | null {
  const raw = (text || '').trim()
  if (raw.length < 12) return null
  const t = raw.toLowerCase()

  const looksPortal =
    /student\s*loan\s*portal|total\s*loans|pending\s*loans|approved\s*loans|session\s*registration|welcome\s*to\s*student|nelf\.gov|portal\.nelf|sign\s*in|log\s*in|create\s*account|invalid\s*jamb|missing\s*information|under\s*review/.test(
      t,
    )
  if (!looksPortal && raw.length < 80) return null

  const errorMatch =
    raw.match(/invalid\s+jamb[^\n.]{0,40}/i) ||
    raw.match(/missing\s+information[^\n.]{0,60}/i) ||
    raw.match(/school\s+not\s+(on\s+)?(the\s+)?list[^\n.]{0,40}/i) ||
    raw.match(/unable\s+to\s+verify[^\n.]{0,40}/i) ||
    raw.match(/session\s+expired[^\n.]{0,30}/i) ||
    raw.match(/error[:\s]+[^\n]{5,80}/i)

  if (errorMatch || /invalid|error|failed|not\s*found|denied|rejected/.test(t)) {
    const exact = errorMatch ? errorMatch[0].trim().slice(0, 120) : null
    return {
      kind: 'error',
      exactError: exact,
      explanation: exact
        ? `This screenshot shows a portal error: **${exact}**. Fix that exact message on the same account. Do not create a second profile.`
        : 'This looks like a portal error screen. Copy the exact error text, fix profile/JAMB/school data on the same login, then try again.',
      nextActions: [
        `Open ${PORTAL} and sign in with the same account`,
        'Correct JAMB, NIN, BVN, or school details that match the error',
        `If it still fails, ticket ${ESUPPORT} with a clear screenshot`,
      ],
    }
  }

  if (/sign\s*in|log\s*in|password|otp|forgot\s*password/.test(t) && !/total\s*loans|dashboard/.test(t)) {
    return {
      kind: 'login',
      exactError: null,
      explanation:
        'This looks like the **login / sign-in** screen. Use an existing account. If the email is already registered from last year, choose **login**, not create account.',
      nextActions: [`Sign in at ${SITE}`, `Or open the portal: ${PORTAL}`, 'Use the same email you registered with before'],
    }
  }

  if (/create\s*account|sign\s*up|register|new\s*user/.test(t) && !/total\s*loans/.test(t)) {
    return {
      kind: 'signup',
      exactError: null,
      explanation:
        'This looks like **account creation**. New students can register here. If you already registered last year, stop and **log in** instead.',
      nextActions: [`Portal: ${PORTAL}`, `Website login: ${SITE}`, 'Complete BVN / profile after sign-up'],
    }
  }

  if (/total\s*loans|approved\s*loans|pending\s*loans|declined\s*loans|welcome\s*to\s*student\s*loan|session\s*registration/.test(t)) {
    const start = raw.match(/starts?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)
    const end = raw.match(/ends?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)
    const startD = parsePortalDate(start?.[1])
    const endD = parsePortalDate(end?.[1])
    let windowNote = ''
    if (startD && endD) {
      windowNote = ` Notice dates on screen: ${start?.[1]} to ${end?.[1]}. Always re-check live on the portal.`
    }
    return {
      kind: 'dashboard',
      exactError: null,
      explanation: `This is the **student loan portal dashboard**.${windowNote} Use Request for Student Loan only when your school data is uploaded and the portal shows an open session.`,
      nextActions: [
        'Confirm school / session appears on the dashboard',
        'If pending, wait for school upload or portal review, do not open a second account',
        `Live portal: ${PORTAL}`,
      ],
    }
  }

  if (/eligibility|institutional\s*charges|upkeep|request\s*for\s*student\s*loan/.test(t)) {
    return {
      kind: 'apply-flow',
      exactError: null,
      explanation:
        'This looks like part of the **loan / upkeep application flow**. Complete each required field carefully. School fees and upkeep are different lines.',
      nextActions: [`Continue on ${PORTAL}`, 'Do not submit twice', `Help desk: ${ESUPPORT}`],
    }
  }

  if (/nelf\.gov|student\s*loan\s*initiative|about\s*us|faq/.test(t) && !/total\s*loans/.test(t)) {
    return {
      kind: 'website',
      exactError: null,
      explanation:
        'This looks like the **public NELFUND website**, not your personal loan dashboard. For application status, sign in on the portal.',
      nextActions: [`Portal: ${PORTAL}`, `Site: ${SITE}`],
    }
  }

  if (looksPortal) {
    return {
      kind: 'unknown',
      exactError: null,
      explanation:
        'I can see portal-related text, but the exact screen is unclear. Tell me the exact status or error word on the screen, or ask a specific question.',
      nextActions: [`Open ${PORTAL}`, `Support: ${ESUPPORT}`],
    }
  }

  return null
}
