/**
 * Interpret OCR / pasted portal UI text into structured understanding.
 * Does not invent policy — reads signals from the student's screen.
 */

export type PortalScreenKind =
  | 'dashboard'
  | 'error'
  | 'login'
  | 'application_form'
  | 'unknown'

export type ScreenshotUnderstanding = {
  kind: PortalScreenKind
  signals: string[]
  registrationWindow?: { start?: string; end?: string; session?: string } | null
  loanCounts?: {
    total?: number
    approved?: number
    pending?: number
    declined?: number
  } | null
  exactError?: string | null
  studentNameHint?: string | null
  /** Natural language reply for offline / mock agent */
  explanation: string
  nextActions: string[]
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

function parseCount(label: string, text: string): number | undefined {
  const re = new RegExp(label + '\\s*[\n\r]*\\s*(\d+)', 'i')
  const m = text.match(re)
  if (m) return Number(m[1])
  return undefined
}

export function understandPortalText(raw: string): ScreenshotUnderstanding | null {
  const text = (raw || '').replace(/\s+/g, ' ').trim()
  if (text.length < 8) return null

  const signals: string[] = []
  const lower = text.toLowerCase()

  const isDashboard =
    /welcome\s+to\s+student\s+loan\s+portal/i.test(text) ||
    (/total\s*loans/i.test(text) && /approved\s*loans/i.test(text)) ||
    (/pending\s*loans/i.test(text) && /declined\s*loans/i.test(text))

  const isLogin =
    /sign\s*in|log\s*in|password|otp/i.test(lower) && !isDashboard

  const errorMatch =
    text.match(/missing\s*information[^.]{0,60}/i) ||
    text.match(/record\s*not\s*found[^.]{0,40}/i) ||
    text.match(/no\s*school\s*info(?:rmation)?[^.]{0,40}/i) ||
    text.match(/invalid\s*jamb[^.]{0,40}/i) ||
    text.match(/nin\s*(verification\s*)?failed[^.]{0,40}/i)

  // Registration window from official notice text
  let registrationWindow: ScreenshotUnderstanding['registrationWindow'] = null
  const sessionMatch = text.match(/(\d{4}\s*\/\s*\d{4})\s*session/i)
  const rangeMatch = text.match(
    /(?:starts?|start)\s*([A-Za-z]+\s*\d{1,2}\s*,?\s*\d{4})\s*(?:and\s*)?ends?\s*([A-Za-z]+\s*\d{1,2}\s*,?\s*\d{4})/i,
  )
  const rangeMatch2 = text.match(
    /(March|April|May|June|July|August|September|October|November|December)\s*(\d{1,2})\s*,?\s*(\d{4}).{0,40}(March|April|May|June|July|August|September|October|November|December)\s*(\d{1,2})\s*,?\s*(\d{4})/i,
  )
  if (sessionMatch || rangeMatch || rangeMatch2 || /session\s*registration/i.test(text)) {
    signals.push('registration_notice')
    registrationWindow = {
      session: sessionMatch ? sessionMatch[1].replace(/\s/g, '') : undefined,
      start: rangeMatch
        ? rangeMatch[1]
        : rangeMatch2
          ? `${rangeMatch2[1]} ${rangeMatch2[2]} ${rangeMatch2[3]}`
          : undefined,
      end: rangeMatch
        ? rangeMatch[2]
        : rangeMatch2
          ? `${rangeMatch2[4]} ${rangeMatch2[5]} ${rangeMatch2[6]}`
          : undefined,
    }
  }

  if (/will\s*not\s*be\s*able\s*to\s*apply/i.test(text)) {
    signals.push('deadline_warning')
  }

  const loanCounts = isDashboard
    ? {
        total: parseCount('Total Loans', text),
        approved: parseCount('Approved Loans', text),
        pending: parseCount('Pending Loans', text),
        declined: parseCount('Declined Loans', text),
      }
    : null

  if (isDashboard) signals.push('dashboard')
  if (loanCounts) signals.push('loan_counters')

  const nameMatch = text.match(/Welcome\s+to\s+Student\s+Loan\s+Portal[,\s]+([A-Za-z]+)/i)
  const studentNameHint = nameMatch ? nameMatch[1] : null

  if (errorMatch) {
    return {
      kind: 'error',
      signals: [...signals, 'portal_error'],
      registrationWindow,
      loanCounts,
      exactError: errorMatch[0].trim(),
      studentNameHint,
      explanation: `Your screenshot shows a portal problem message: “${errorMatch[0].trim()}”. That usually relates to student-record matching with your school, not a random website glitch.`,
      nextActions: [
        'Tell me which institution you attend so I can point you to the right office.',
        'Confirm name, NIN, JAMB, and matric match your school records exactly.',
        `If needed, open NELFUND support: ${ESUPPORT}`,
      ],
    }
  }

  if (isDashboard) {
    const lines: string[] = []
    lines.push(
      'This looks like your **NELFUND Student Loan Portal dashboard** (you are already logged in).',
    )
    if (studentNameHint) {
      lines.push(`The portal is welcoming you as **${studentNameHint}**.`)
    }
    if (registrationWindow) {
      const sess = registrationWindow.session ? ` for the **${registrationWindow.session}** session` : ''
      const start = registrationWindow.start || 'the published start date'
      const end = registrationWindow.end || 'the published end date'
      lines.push(
        `The yellow notice is about **session registration${sess}**. It indicates registration **starts ${start}** and **ends ${end}**.`,
      )
      if (signals.includes('deadline_warning')) {
        lines.push(
          'The red warning means you should complete registration within that window — after the end date you may not be able to apply for that session.',
        )
      }
      lines.push(
        'Treat those dates as shown on **your** portal screen. Always re-check the live notice on the portal in case NELFUND updates it.',
      )
    }
    if (loanCounts) {
      const t = loanCounts.total ?? 0
      const a = loanCounts.approved ?? 0
      const p = loanCounts.pending ?? 0
      const d = loanCounts.declined ?? 0
      lines.push(
        `Your loan counters show **Total ${t}**, **Approved ${a}**, **Pending ${p}**, **Declined ${d}**. Zeros usually mean you do not have a loan application in those states yet — not that the portal is broken.`,
      )
    }
    lines.push(
      'If you tell me what you want next (start registration, check status, fix an error, or contact support), I can guide the next step.',
    )

    return {
      kind: 'dashboard',
      signals,
      registrationWindow,
      loanCounts,
      exactError: null,
      studentNameHint,
      explanation: lines.join('\n\n'),
      nextActions: [
        `Continue only on the official portal: ${PORTAL}`,
        'Start or continue registration if the session window is open on your account.',
        `Public information site: ${SITE}`,
        `Tracked support if something is blocked: ${ESUPPORT}`,
      ],
    }
  }

  if (isLogin) {
    return {
      kind: 'login',
      signals: ['login'],
      explanation:
        'This looks like a login / sign-in screen. Use only the official portal and never share passwords or OTP in chat.',
      nextActions: [`Open: ${PORTAL}`, 'Reset password only through official portal options if available.'],
      exactError: null,
      loanCounts: null,
      registrationWindow: null,
      studentNameHint: null,
    }
  }

  if (/nelfund|student\s*loan\s*portal|portal\.nelf/i.test(text)) {
    return {
      kind: 'unknown',
      signals: ['portal_ui'],
      explanation:
        'I can see this is related to the NELFUND portal. Tell me what you want to do (understand a notice, fix an error, start applying, or contact support), or paste the main text from the screen.',
      nextActions: [`Portal: ${PORTAL}`, `Support: ${ESUPPORT}`],
      exactError: null,
      loanCounts: null,
      registrationWindow: null,
      studentNameHint: null,
    }
  }

  return null
}

/** Sample OCR-like text from a typical dashboard screenshot (for tests). */
export const SAMPLE_DASHBOARD_OCR = `
Welcome to Student Loan Portal, Damilola
Notice 2025/2026 Session Registration Starts March 5th 2026 And Ends June 5th 2026
Please note that you will not be able to apply for a loan this session after the end date.
Total Loans 0
Approved Loans 0
Pending Loans 0
Declined Loans 0
`
