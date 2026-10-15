/**
 * Portal / website screenshot understanding from OCR text.
 * Returns a structured screen kind, applied status, and next steps.
 */

const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export type ScreenKind =
  | 'dashboard'
  | 'dashboard-before-apply'
  | 'dashboard-after-apply'
  | 'login'
  | 'signup'
  | 'error'
  | 'fee-disputes'
  | 'apply-flow'
  | 'website'
  | 'unknown'

export type ScreenUnderstanding = {
  kind: ScreenKind
  hasApplied: boolean | null
  exactError: string | null
  explanation: string
  nextActions: string[]
}

function extractCounts(raw: string): {
  total: number | null
  pending: number | null
  approved: number | null
  declined: number | null
} {
  const num = (re: RegExp) => {
    const m = raw.match(re)
    return m ? Number(m[1]) : null
  }
  return {
    total: num(/total\s*loans?\s*[:\s]*(\d+)/i),
    pending: num(/pending\s*loans?\s*[:\s]*(\d+)/i),
    approved: num(/approved\s*loans?\s*[:\s]*(\d+)/i),
    declined: num(/declined\s*loans?\s*[:\s]*(\d+)/i),
  }
}

function appliedFromCounts(c: {
  total: number | null
  pending: number | null
  approved: number | null
  declined: number | null
}): boolean | null {
  if (c.pending != null && c.pending > 0) return true
  if (c.total != null && c.total > 0) return true
  if (c.approved != null && c.approved > 0) return true
  if (
    c.total === 0 &&
    (c.pending === 0 || c.pending == null) &&
    (c.approved === 0 || c.approved == null)
  )
    return false
  return null
}

export const SAMPLE_DASHBOARD_OCR = `Welcome to Student Loan Portal
Total Loans 0
Approved Loans 0
Pending Loans 0
Declined Loans 0`

export function dashboardFollowUpExplanation(applied: boolean | null): string {
  if (applied === true) {
    return [
      'You are signed into the **Student Loan Portal**. The counters (Total / Approved / Pending / Declined) show loan requests on **this** account.',
      '',
      '• **Pending ≥ 1** (or Total ≥ 1) means you **have applied** — the request is submitted and still processing.',
      '• Pending is **not** the same as declined.',
      '• Open **Loans** tabs for View details.',
    ].join('\n')
  }
  if (applied === false) {
    return [
      'You are signed into the portal, but counters show **0** — you have **not** submitted institutional fee / upkeep for this session on this account yet.',
      'Being logged in is not the same as applying.',
    ].join('\n')
  }
  return 'Open Home and read Total / Pending numbers, or re-upload a clearer screenshot.'
}

export function understandPortalText(text: string): ScreenUnderstanding | null {
  const raw = (text || '').trim()
  if (raw.length < 12) return null
  const t = raw.toLowerCase()

  const looksPortal =
    /student\s*loan\s*portal|total\s*loans|pending\s*loans|approved\s*loans|session\s*registration|welcome\s*to\s*student|nelf\.gov|portal\.nelf|sign\s*in|log\s*in|create\s*account|invalid\s*jamb|missing\s*information|under\s*review|institutional\s*loans|upkeep\s*loans|school\s*loan\s*history|personal\s*history|fee\s*disputes|wallet\s*balance|in\s*wallet|reset\s*account\s*details|profile\s*completed|bank\s*verification\s*number|click\s*to\s*change\s*password|institution has not opened|cancel\s*loan|admission\s*letter\s*required|ask about nelfund|nelfund student guide/i.test(
      t,
    )
  if (!looksPortal && raw.length < 80) return null

  const counts = extractCounts(raw)
  const applied = appliedFromCounts(counts)

  if (
    /ask about nelfund|ask anything about nelfund|nelfund student guide|independent student guide|suggested next|was this helpful|send to class group/i.test(
      raw,
    ) ||
    (/is nelfund loan application open/i.test(raw) && /how do i apply for nelfund/i.test(raw))
  ) {
    return {
      kind: 'unknown',
      hasApplied: null,
      exactError: null,
      explanation: [
        'This screenshot is of the **NELFUND Student Guide** (this app), not the official loan portal.',
        '',
        'To check your real application status, open the official portal and upload a screenshot of **Home / Loans** (Total / Pending), or type your question here.',
        '',
        `Portal: ${PORTAL}`,
        `Login: ${LOGIN}`,
        `Official site: ${SITE}`,
      ].join('\n'),
      nextActions: [
        'Type your question (e.g. Is application open?)',
        `Upload portal Home screenshot from ${PORTAL}`,
        `Login: ${LOGIN}`,
      ],
    }
  }

  if (/cancel\s*(loan|application)|are\s*you\s*sure\s*you\s*want\s*to\s*cancel|yes,?\s*cancel\s*loan|don'?t\s*cancel/i.test(raw)) {
    return {
      kind: 'error',
      hasApplied: true,
      exactError: 'Cancel Loan Application confirmation',
      explanation: [
        '**Screen:** Cancel Loan Application confirmation.',
        '',
        'The portal asks if you are sure you want to cancel this loan application.',
        '**Cancelling institutional / school-fees loan also cancels upkeep** if you have one. **Cannot be undone.**',
        '',
        "• Keep the loan → tap **Don't Cancel**.",
        '• Withdraw completely → only then **Yes, Cancel Loan**.',
        '',
        'Pending is normal while processing — cancel only if you applied by mistake.',
        `Portal: ${PORTAL}`,
        `Login: ${LOGIN}`,
        `Send a support message with your screenshot (if you have one): ${ESUPPORT}`,
      ].join('\n'),
      nextActions: [
        "Tap Don't Cancel if you still want the loan",
        `Login: ${LOGIN}`,
        `Send a support message with screenshot: ${ESUPPORT}`,
      ],
    }
  }

  if (/institution has not opened|has not opened a session|session for loan applications yet/i.test(raw)) {
    return {
      kind: 'dashboard-before-apply',
      hasApplied: false,
      exactError: null,
      explanation: [
        '**Screen:** Home — **“Your institution has not opened a session for loan applications yet.”**',
        '',
        'National open does **not** mean every school is ready. Your campus must open its session.',
        '',
        '**What to try:**',
        `1. Log in again: ${LOGIN}`,
        '2. Open **☰ → Loans** and **Home**.',
        '3. **Refresh / reload** the page — other students in your school may already be applying; a reload sometimes updates the status.',
        '4. Contact your **campus NELFUND / registry / student affairs desk**.',
        '5. Profile 100% does **not** remove this message by itself.',
        '',
        'If it is **still the same** after login + Loans + refresh: send a support message with your screenshot (if you have one) here:',
        `→ ${ESUPPORT}`,
        '(Official NELFUND help form — describe the problem and attach the screenshot.)',
      ].join('\n'),
      nextActions: [
        'Log in again and refresh Home / Loans',
        'Ask campus NELFUND desk',
        `Send support message with screenshot: ${ESUPPORT}`,
      ],
    }
  }

  if (/admission\s*letter\s*(is\s*)?required|upload\s*(an?\s*)?admission/i.test(raw)) {
    return {
      kind: 'error',
      hasApplied: null,
      exactError: 'An admission letter is required',
      explanation: [
        '**Screen:** Application blocker — **An admission letter is required**.',
        '',
        'Upload a clear admission letter (or school admission evidence the portal accepts), then continue.',
        'If it still fails, try a sharper file and ensure it is not password-protected.',
        `Portal: ${PORTAL}`,
        `Send a support message with your screenshot (if you have one): ${ESUPPORT}`,
      ].join('\n'),
      nextActions: ['Upload admission letter on the portal', `Send a support message with screenshot: ${ESUPPORT}`],
    }
  }

  if (/no\s*result\s*found|select\s*institution|verify\s*educational/i.test(raw)) {
    return {
      kind: 'error',
      hasApplied: null,
      exactError: 'No Result found',
      explanation: [
        '**Screen:** **Verify Educational Information** (signup / profile) — Select Institution.',
        '**What it means:** **No Result found** — the name typed is not matching the portal list (or the school is not loaded for this cycle yet).',
        '',
        '1. Try shorter names (e.g. Olabisi Onabanjo, OOU, Onabanjo University).',
        '2. Confirm public tertiary eligibility for this cycle.',
        '3. If nothing matches: campus **NELFUND / ICT / registry** must confirm the school is listed and records uploaded.',
        '4. Do not create a second account.',
        `Login: ${LOGIN}`,
        `Send a support message with your screenshot (if you have one): ${ESUPPORT}`,
        '(That link is the official NELFUND help form — open it, describe the problem, attach the screenshot.)',
      ].join('\n'),
      nextActions: ['Retry shorter school name', 'Ask campus NELFUND desk', `Send a support message with screenshot: ${ESUPPORT}`],
    }
  }

  if (/fee\s*disputes|you have not raised any fee dispute/i.test(t)) {
    return {
      kind: 'fee-disputes',
      hasApplied: applied,
      exactError: null,
      explanation: [
        '**Screen:** Fee Disputes.',
        'This page is for fee disputes, not the main apply form. Check Home / Loans for application status.',
        `Portal: ${PORTAL}`,
      ].join('\n'),
      nextActions: [`Portal: ${PORTAL}`, 'Open Home for Total / Pending'],
    }
  }

  if (
    (/sign\s*in|log\s*in|password|otp|forgot\s*password/.test(t) &&
      !/total\s*loans|dashboard|pending\s*loans|ask about nelfund|how do i apply/i.test(t)) &&
    (/password|otp|forgot|email\s*or\s*phone|enter\s*your/.test(t) || /portal\.nelf|nelf\.gov/.test(t))
  ) {
    return {
      kind: 'login',
      hasApplied: null,
      exactError: null,
      explanation: [
        '**Screen:** Login / sign-in on the official portal.',
        '**Have you applied?** Cannot tell until you sign in and open Home or Loans.',
        `Login: ${LOGIN}`,
        'Forgot password: use the link on that same login page.',
      ].join('\n'),
      nextActions: [`${LOGIN}`, 'Use Forgot password if you cannot sign in'],
    }
  }

  if (
    (/create\s*account|sign\s*up\s*(here|now)?|new\s*student\s*registration|register\s*(here|now|an?\s*account)/i.test(t) ||
      (/email|phone|nin|bvn/.test(t) && /create\s*account|sign\s*up/.test(t))) &&
    !/total\s*loans|pending\s*loans|already\s*registered|registered\s*last\s*year|email\s*already\s*used/.test(t)
  ) {
    return {
      kind: 'signup',
      hasApplied: false,
      exactError: null,
      explanation: [
        '**Screen:** Portal **account creation / sign-up**.',
        '',
        '• **New students:** you can create an account here, then complete profile (NIN, BVN, school).',
        '• **Already registered last year:** do **not** create another account — **log in** with the same email.',
        '',
        `Sign up / portal: ${PORTAL}`,
        `Login: ${LOGIN}`,
      ].join('\n'),
      nextActions: [`Login if returning: ${LOGIN}`, `Portal: ${PORTAL}`, 'Complete BVN / profile after sign-up'],
    }
  }

  if (/eligibility|institutional\s*charges|request\s*for\s*student\s*loan|terms\s*&\s*conditions|gsi\s*mandate/i.test(t)) {
    return {
      kind: 'apply-flow',
      hasApplied: null,
      exactError: null,
      explanation:
        'This looks like part of the **loan / upkeep application flow**. Complete each required field carefully. School fees and upkeep are different lines. After Submit, Home should show Pending ≥ 1.',
      nextActions: [`Continue on ${PORTAL}`, 'Do not submit twice', `Send a support message: ${ESUPPORT}`],
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
      windowNote = `\nSession text on screen mentions **${start[1]}** to **${end[1]}** — confirm live on the portal.`
    }

    if (applied === true) {
      return {
        kind: 'dashboard-after-apply',
        hasApplied: true,
        exactError: null,
        explanation: [
          '**Screen:** Student loan portal Home / dashboard.',
          '**Have you applied?** **Yes** on this account.',
          counts.total != null || counts.pending != null
            ? `Counters: Total **${counts.total ?? '?'}**, Pending **${counts.pending ?? '?'}**` +
              (counts.approved != null ? `, Approved **${counts.approved}**` : '') +
              (counts.declined != null ? `, Declined **${counts.declined}**` : '') +
              '.'
            : 'Pending / Total look non-zero.',
          '',
          'Pending means submitted and still processing — **not** declined.',
          'Open **Loans** → Institutional / Upkeep tabs for View.',
          windowNote,
        ]
          .filter(Boolean)
          .join('\n'),
        nextActions: ['Open Loans tabs for row details', `Live portal: ${PORTAL}`, `Long wait — send support message: ${ESUPPORT}`],
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
      nextActions: ['Reply with Total Loans and Pending Loans numbers', `Live portal: ${PORTAL}`],
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
      explanation:
        applied === true
          ? 'This looks portal-related and may show an existing application. Open **Home** for Total / Pending, or type the exact status words you see.'
          : 'This looks portal-related. Tell me the exact status words on screen (e.g. Pending Loans 2, institution has not opened…), or re-upload a clearer screenshot of Home / Loans.',
      nextActions: [`Portal: ${PORTAL}`, `Login: ${LOGIN}`, `Send a support message with your screenshot (if you have one): ${ESUPPORT}`],
    }
  }

  return null
}
