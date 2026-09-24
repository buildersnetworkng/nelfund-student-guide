/**
 * Portal / website screenshot understanding from OCR text.
 * Identifies page type and whether the student has applied or not.
 * Grounded only on text visible in the screenshot (OCR). No live login.
 */

export type ScreenKind =
  | 'dashboard-before-apply'
  | 'dashboard-after-apply'
  | 'dashboard'
  | 'wallet'
  | 'loans-institutional'
  | 'loans-upkeep'
  | 'fee-disputes'
  | 'profile'
  | 'settings'
  | 'error'
  | 'login'
  | 'website'
  | 'portal-landing'
  | 'eligibility-form'
  | 'apply-flow'
  | 'signup'
  | 'unknown'

export interface ScreenUnderstanding {
  kind: ScreenKind
  /** true = applied (pending/approved row or total>0), false = not applied, null = cannot tell */
  hasApplied: boolean | null
  exactError: string | null
  explanation: string
  nextActions: string[]
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

/** Sample OCR text resembling the official portal dashboard (for tests). */
export const SAMPLE_DASHBOARD_OCR = `
Welcome to Student Loan Portal
Notice 2026/2027 Session Registration
Starts September 23rd 2026 And Ends December 31st 2026
Total Loans 0
Approved Loans 0
Pending Loans 0
Declined Loans 0
`

function numNear(t: string, label: RegExp): number | null {
  const m = t.match(new RegExp(label.source + '\\s*[:\\s]*(\\d+)', 'i'))
  if (m) return Number(m[1])
  return null
}

function extractCounts(raw: string): {
  total: number | null
  approved: number | null
  pending: number | null
  declined: number | null
} {
  const t = raw.replace(/\s+/g, ' ')
  return {
    total: numNear(t, /total\s*loans?/),
    approved: numNear(t, /approved\s*loans?/),
    pending: numNear(t, /pending\s*loans?/),
    declined: numNear(t, /declined\s*loans?/),
  }
}

function appliedFromCounts(c: ReturnType<typeof extractCounts>): boolean | null {
  if (c.total != null && c.total > 0) return true
  if (c.pending != null && c.pending > 0) return true
  if (c.approved != null && c.approved > 0) return true
  if (
    c.total === 0 &&
    (c.pending === 0 || c.pending == null) &&
    (c.approved === 0 || c.approved == null)
  ) {
    return false
  }
  return null
}

/** Follow-up when a student asks what the dashboard screenshot means. */
export function dashboardFollowUpExplanation(): string {
  return [
    '**What this dashboard means**',
    '',
    'You are signed into the **Student Loan Portal**. The counters (Total / Approved / Pending / Declined) show loan requests on **this** account.',
    '',
    '• **0 pending and 0 approved** usually means you have not submitted a loan request yet, or your school has not opened a session / uploaded your data.',
    '• **Pending ≥ 1** (or Total ≥ 1) means you **have applied** — the request is submitted and still processing.',
    '• Session registration dates on the notice are what the portal is advertising. Always re-check live on the portal before you rely on a deadline.',
    '• **Account creation** is different from **loan / upkeep application**. Being logged in does not automatically mean a loan was submitted.',
    '',
    `Next: confirm school and session on ${PORTAL}. If something is stuck, ticket ${ESUPPORT} with a clear screenshot. Site: ${SITE}.`,
  ].join('\n')
}

/**
 * Classify portal/website OCR text into a screen kind, applied status, and next steps.
 * Returns null when the text does not look like a portal/website dump.
 */
export function understandPortalText(text: string): ScreenUnderstanding | null {
  const raw = (text || '').trim()
  if (raw.length < 12) return null
  const t = raw.toLowerCase()

  const looksPortal =
    /student\s*loan\s*portal|total\s*loans|pending\s*loans|approved\s*loans|session\s*registration|welcome\s*to\s*student|nelf\.gov|portal\.nelf|sign\s*in|log\s*in|create\s*account|invalid\s*jamb|missing\s*information|under\s*review|institutional\s*loans|upkeep\s*loans|school\s*loan\s*history|personal\s*history|fee\s*disputes|wallet\s*balance|in\s*wallet|reset\s*account\s*details|profile\s*completed|bank\s*verification\s*number|click\s*to\s*change\s*password|institution has not opened/i.test(
      t,
    )
  if (!looksPortal && raw.length < 80) return null

  const counts = extractCounts(raw)
  const applied = appliedFromCounts(counts)

  if (/institution has not opened|has not opened a session|session for loan applications yet/i.test(raw)) {
    return {
      kind: 'dashboard-before-apply',
      hasApplied: false,
      exactError: null,
      explanation: [
        '**Screen:** Home / dashboard.',
        '**Have you applied?** **No** (or not yet for this session).',
        '',
        'The portal says your **institution has not opened a session** for loan applications.',
        'National window can already be open, but **your school** must open its session first.',
        'Counts are usually Total/Approved/Pending/Declined = 0.',
        '',
        '1. Contact your campus NELFUND / registry desk.',
        '2. Profile 100% does **not** remove this block.',
        `3. Still stuck: ticket ${ESUPPORT} with this screenshot.`,
      ].join('\n'),
      nextActions: [
        'Ask your school NELFUND desk to open the session',
        `Login: ${LOGIN}`,
        `Ticket: ${ESUPPORT}`,
      ],
    }
  }

  if (/fee\s*disputes|you have not raised any fee dispute|whichever amount they confirm/i.test(t)) {
    return {
      kind: 'fee-disputes',
      hasApplied: applied,
      exactError: null,
      explanation: [
        '**Screen:** Fee Disputes (menu → Disputes).',
        applied === true
          ? '**Application status:** You already have loan activity on this account (from other screens). Disputes is separate.'
          : applied === false
            ? '**Have you applied?** Not from the counters on this page alone.'
            : '**Have you applied?** This page alone does not list Total/Pending loans.',
        '',
        'Official rule: school agrees with your amount or gives the correct one — **whichever they confirm becomes the loan amount**.',
        'If empty: raise a dispute **when applying** if the fee shown looks wrong.',
      ].join('\n'),
      nextActions: [`Open ${PORTAL}`, `Support: ${ESUPPORT}`],
    }
  }

  if (
    /profile\s*completed|account\s*details|bank\s*verification\s*number|reset\s*account\s*details|account\s*reset\s*attempt/i.test(
      t,
    )
  ) {
    return {
      kind: 'profile',
      hasApplied: applied,
      exactError: null,
      explanation: [
        '**Screen:** Profile → Account Details (BVN / bank).',
        '**Have you applied?** This page does not show loan submission. Check **Home** (Total / Pending) or **Loans** tabs.',
        '',
        '• Profile can be **100%** while loans are still pending or while school session is closed.',
        '• **Reset Account Details** has limited attempts per session — use carefully.',
        '• For 2026/2027, re-enter BVN and bank when the portal asks.',
      ].join('\n'),
      nextActions: [
        'Open Home or Loans to see if you have applied',
        `Login: ${LOGIN}`,
      ],
    }
  }

  if (/change\s*password|click\s*to\s*change\s*password/i.test(t) && !/total\s*loans/.test(t)) {
    return {
      kind: 'settings',
      hasApplied: null,
      exactError: null,
      explanation: [
        '**Screen:** Settings → Change Password.',
        '**Have you applied?** This page cannot tell. Check Home (Total/Pending) or Loans.',
      ].join('\n'),
      nextActions: [`Login: ${LOGIN}`, 'Use Forgot password on the login page if locked out'],
    }
  }

  if (/wallet\s*balance|in\s*wallet/i.test(t)) {
    const inWallet = /in\s*wallet/i.test(t)
    return {
      kind: 'wallet',
      hasApplied: true,
      exactError: null,
      explanation: [
        '**Screen:** Wallet Balance (Home).',
        '**Have you applied?** **Yes** — a wallet line (Institution Loan / Upkeep) means loan activity exists on this account.',
        inWallet ? 'Status chip **In Wallet** is visible on this screenshot.' : '',
        '',
        'Amounts are **personal / school-specific**. I will not invent a universal figure.',
        'Confirm the exact naira amounts only on your live portal.',
      ]
        .filter(Boolean)
        .join('\n'),
      nextActions: [
        'Open Loans tabs for Pending / View / Cancel',
        `Login: ${LOGIN}`,
      ],
    }
  }

  if (/school\s*loan\s*history|institutional\s*fee|loan\s*type\s*institutional/i.test(t)) {
    const pendingRow = /status\s*[:\s]*pending|●?\s*pending/i.test(t)
    return {
      kind: 'loans-institutional',
      hasApplied: true,
      exactError: null,
      explanation: [
        '**Screen:** Loans → Institutional Loans → School Loan History.',
        '**Have you applied?** **Yes** — an Institutional Fee row is present.',
        pendingRow
          ? 'Status **Pending** = submitted, still processing (not declined).'
          : 'Read the Status column on the row.',
        'Actions may include **View** and **Cancel**.',
      ].join('\n'),
      nextActions: [
        'Wait for processing or open View for details',
        `Login: ${LOGIN}`,
        `Stuck long: ${ESUPPORT}`,
      ],
    }
  }

  if (/personal\s*history|loan\s*type\s*upkeep|upkeep\s*loans/i.test(t) && /date|status|view/i.test(t)) {
    const pendingRow = /status\s*[:\s]*pending|●?\s*pending/i.test(t)
    return {
      kind: 'loans-upkeep',
      hasApplied: true,
      exactError: null,
      explanation: [
        '**Screen:** Loans → Upkeep Loans → Personal History.',
        '**Have you applied?** **Yes** — an Upkeep row is present.',
        pendingRow
          ? 'Status **Pending** = submitted, still processing (not declined).'
          : 'Read the Status column on the row.',
        'Actions typically include **View**.',
      ].join('\n'),
      nextActions: [
        'Wait for processing or open View for details',
        `Login: ${LOGIN}`,
      ],
    }
  }

  const errorMatch =
    raw.match(/invalid\s+jamb[^\n.]{0,40}/i) ||
    raw.match(/missing\s+information[^\n.]{0,60}/i) ||
    raw.match(/school\s+not\s+(on\s+)?(the\s+)?list[^\n.]{0,40}/i) ||
    raw.match(/unable\s+to\s+verify[^\n.]{0,40}/i) ||
    raw.match(/session\s+expired[^\n.]{0,30}/i) ||
    raw.match(/error[:\s]+[^\n]{5,80}/i)

  if (errorMatch || (/invalid|error|failed|not\s*found|denied|rejected/.test(t) && !/declined\s*loans/.test(t))) {
    const exact = errorMatch ? errorMatch[0].trim().slice(0, 120) : null
    return {
      kind: 'error',
      hasApplied: applied,
      exactError: exact,
      explanation: exact
        ? `This screenshot shows a portal error: **${exact}**. Fix that exact message on the same account. Do not create a second profile.`
        : 'This looks like a portal error screen. Copy the exact error text, fix profile/JAMB/school data on the same login, then try again.',
      nextActions: [
        `Open ${LOGIN} with the same account`,
        'Correct JAMB, NIN, BVN, or school details that match the error',
        `If it still fails, ticket ${ESUPPORT} with a clear screenshot`,
      ],
    }
  }

  if (/sign\s*in|log\s*in|password|otp|forgot\s*password/.test(t) && !/total\s*loans|dashboard|pending\s*loans/.test(t)) {
    return {
      kind: 'login',
      hasApplied: null,
      exactError: null,
      explanation: [
        '**Screen:** Login / sign-in.',
        '**Have you applied?** Cannot tell until you sign in and open Home or Loans.',
        `Login: ${LOGIN}`,
      ].join('\n'),
      nextActions: [`${LOGIN}`, 'Use Forgot password if you cannot sign in'],
    }
  }

  if (/create\s*account|sign\s*up|register/.test(t) && !/total\s*loans/.test(t)) {
    return {
      kind: 'signup',
      hasApplied: false,
      exactError: null,
      explanation:
        'This looks like **account creation**. New students can register here. If you already registered last year, stop and **log in** instead.',
      nextActions: [`Portal: ${PORTAL}`, `Login: ${LOGIN}`, 'Complete BVN / profile after sign-up'],
    }
  }

  if (/eligibility|institutional\s*charges|request\s*for\s*student\s*loan|raise\s*a\s*dispute|terms\s*&\s*conditions|gsi\s*mandate/i.test(t)) {
    return {
      kind: 'apply-flow',
      hasApplied: null,
      exactError: null,
      explanation:
        'This looks like part of the **loan / upkeep application flow**. Complete each required field carefully. School fees and upkeep are different lines. After Submit, Home should show Pending ≥ 1.',
      nextActions: [`Continue on ${PORTAL}`, 'Do not submit twice', `Help desk: ${ESUPPORT}`],
    }
  }

  if (
    /total\s*loans|approved\s*loans|pending\s*loans|declined\s*loans|welcome\s*to\s*student\s*loan|session\s*registration|active\s*session/i.test(
      t,
    )
  ) {
    const start = raw.match(/starts?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)
    const end = raw.match(/ends?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)
    let windowNote = ''
    if (start && end) {
      windowNote = ` Notice dates on screen: ${start[1]} to ${end[1]}. Always re-check live on the portal.`
    }

    if (applied === true) {
      const pending = counts.pending != null ? String(counts.pending) : '≥1'
      const total = counts.total != null ? String(counts.total) : '≥1'
      return {
        kind: 'dashboard-after-apply',
        hasApplied: true,
        exactError: null,
        explanation: [
          '**Screen:** Student loan portal Home / dashboard.',
          `**Have you applied?** **Yes.**`,
          `Counters on this screenshot: Total **${total}**, Pending **${pending}**` +
            (counts.approved != null ? `, Approved **${counts.approved}**` : '') +
            (counts.declined != null ? `, Declined **${counts.declined}**` : '') +
            '.',
          '',
          'Pending means submitted and still processing — **not** declined.',
          'Open **Loans** → Institutional / Upkeep tabs for View (and Cancel on institutional when available).',
          windowNote,
        ]
          .filter(Boolean)
          .join('\n'),
        nextActions: [
          'Open Loans tabs for row details',
          `Live portal: ${PORTAL}`,
          `Long wait: ${ESUPPORT}`,
        ],
      }
    }

    if (applied === false) {
      return {
        kind: 'dashboard-before-apply',
        hasApplied: false,
        exactError: null,
        explanation: [
          '**Screen:** Student loan portal Home / dashboard.',
          '**Have you applied?** **No** (or not yet for this session on this account).',
          'Counters show **0** Total / Pending / Approved (or empty history).',
          '',
          'Being logged in is **not** the same as submitting institutional fee or upkeep.',
          'If the school session is open, use Request / apply flow. If Home says the institution has not opened a session, contact your campus desk first.',
          windowNote,
        ]
          .filter(Boolean)
          .join('\n'),
        nextActions: [
          'Confirm school session is open on Home',
          'Start Request for Student Loan only when the portal allows it',
          `Live portal: ${PORTAL}`,
        ],
      }
    }

    return {
      kind: 'dashboard',
      hasApplied: null,
      exactError: null,
      explanation: `This is the **student loan portal dashboard**.${windowNote} I could not read clear Total/Pending numbers from the OCR. Tell me the exact numbers on screen (Total, Pending) or re-upload a sharper screenshot.`,
      nextActions: [
        'Reply with Total Loans and Pending Loans numbers',
        `Live portal: ${PORTAL}`,
      ],
    }
  }

  if (/nelf\.gov|student\s*loan\s*initiative|about\s*us|faq/.test(t) && !/total\s*loans/.test(t)) {
    return {
      kind: 'website',
      hasApplied: null,
      exactError: null,
      explanation:
        'This looks like the **public NELFUND website**, not your personal loan dashboard. For application status, sign in on the portal.',
      nextActions: [`Portal: ${PORTAL}`, `Login: ${LOGIN}`, `Site: ${SITE}`],
    }
  }

  if (looksPortal) {
    return {
      kind: 'unknown',
      hasApplied: applied,
      exactError: null,
      explanation: [
        'I can see portal-related text, but the exact screen is unclear from OCR.',
        applied === true
          ? 'Counters suggest you **may have applied** (non-zero total/pending). Confirm on Home or Loans.'
          : applied === false
            ? 'Counters look like **0** — you may **not** have submitted yet. Confirm on Home or Loans.'
            : 'Tell me the exact status words on screen (e.g. Pending Loans 2, institution has not opened…), or re-upload a clearer screenshot.',
      ].join('\n'),
      nextActions: [`Open ${PORTAL}`, `Support: ${ESUPPORT}`],
    }
  }

  return null
}
