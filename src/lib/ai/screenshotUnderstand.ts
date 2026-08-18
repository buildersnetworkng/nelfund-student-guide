/**
 * Interpret OCR / pasted portal UI text into structured understanding.
 * Works fully offline — no external API.
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
  registrationWindow?: {
    start?: string
    end?: string
    session?: string
    appearsClosed?: boolean
  } | null
  loanCounts?: {
    total?: number
    approved?: number
    pending?: number
    declined?: number
  } | null
  exactError?: string | null
  studentNameHint?: string | null
  explanation: string
  nextActions: string[]
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

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

function parseCount(label: string, text: string): number | undefined {
  const flat = text.replace(/\s+/g, ' ')
  const re = new RegExp(label.replace(/\s+/g, '\\s+') + '\\s*(\\d+)', 'i')
  const m = flat.match(re)
  if (m) return Number(m[1])
  return undefined
}

function parsePortalDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const m = raw.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})/i)
  if (!m) return null
  const month = MONTHS[m[1].toLowerCase()]
  if (month === undefined) return null
  const day = Number(m[2])
  const year = Number(m[3])
  if (!year || !day) return null
  return new Date(year, month, day, 23, 59, 59)
}

function windowStatus(endRaw: string | undefined): {
  appearsClosed: boolean
  appearsOpen: boolean
  note: string
} {
  const end = parsePortalDate(endRaw)
  if (!end) {
    return {
      appearsClosed: false,
      appearsOpen: false,
      note: 'Confirm on the live portal whether applications are open right now.',
    }
  }
  const now = new Date()
  if (now.getTime() > end.getTime()) {
    return {
      appearsClosed: true,
      appearsOpen: false,
      note: `Based on the end date shown on your screen (${endRaw}), that registration window has ended. Loan application for that session appears closed.`,
    }
  }
  return {
    appearsClosed: false,
    appearsOpen: true,
    note: `Based on the dates on your screen, the window may still be open until ${endRaw}. Confirm on the live portal before relying on this.`,
  }
}

export function understandPortalText(raw: string): ScreenshotUnderstanding | null {
  const text = (raw || '').replace(/\s+/g, ' ').trim()
  if (text.length < 8) return null

  const signals: string[] = []

  const counterHits = [
    /total\s*loans/i.test(text),
    /approved\s*loans/i.test(text),
    /pending\s*loans/i.test(text),
    /declined\s*loans/i.test(text),
  ].filter(Boolean).length

  const isDashboard =
    /welcome\s+to\s+student\s+loan\s+portal/i.test(text) ||
    counterHits >= 2 ||
    (/session\s*registration/i.test(text) && counterHits >= 1)

  const isLoginScreenUi =
    (/sign\s*in|log\s*in/i.test(text) &&
      /password|username|otp|captcha/i.test(text) &&
      /button|submit|form|field|enter\s*your/i.test(text)) ||
    (/enter\s*(your\s*)?(password|otp)/i.test(text) && !/\?/.test(text))
  const looksLikeQuestion =
    /\?|how\s*(do|to)|which\s*(link|url|site|website)|where\s*(do|to)|fix\s*my|my\s*password\s*is/i.test(
      text,
    )
  const isLogin = isLoginScreenUi && !isDashboard && !looksLikeQuestion

  const errorMatch =
    text.match(/missing\s*information[^.]{0,60}/i) ||
    text.match(/record\s*not\s*found[^.]{0,40}/i) ||
    text.match(/no\s*school\s*info(?:rmation)?[^.]{0,40}/i) ||
    text.match(/invalid\s*jamb[^.]{0,40}/i) ||
    text.match(/nin\s*(verification\s*)?failed[^.]{0,40}/i)

  let registrationWindow: ScreenshotUnderstanding['registrationWindow'] = null
  const sessionMatch = text.match(/(\d{4}\s*\/\s*\d{4})\s*session/i)
  const rangeMatch = text.match(
    /starts?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{4})\s+and\s+ends?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{4})/i,
  )
  if (sessionMatch || rangeMatch || /session\s*registration/i.test(text)) {
    signals.push('registration_notice')
    const end = rangeMatch ? rangeMatch[2] : undefined
    const status = windowStatus(end)
    if (status.appearsClosed) signals.push('window_closed')
    if (status.appearsOpen) signals.push('window_open')
    registrationWindow = {
      session: sessionMatch ? sessionMatch[1].replace(/\s/g, '') : undefined,
      start: rangeMatch ? rangeMatch[1] : undefined,
      end,
      appearsClosed: status.appearsClosed,
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

  const isQuestionAboutIssue =
    /\?|who\s*should|how\s*(do|to)|what\s*(does|do|is)|contact|draft|email|help\s*me|explain|mean|means|simple\s*english|pidgin/i.test(
      text,
    )

  const looksLikePastedUi =
    /welcome\s+to|student\s+loan\s+portal|total\s*loans|session\s*registration|error\s*code|try\s*again|click\s*here/i.test(
      text,
    ) || text.length > 180

  if (errorMatch && !isDashboard && !isQuestionAboutIssue && looksLikePastedUi) {
    return {
      kind: 'error',
      signals: [...signals, 'portal_error'],
      registrationWindow,
      loanCounts,
      exactError: errorMatch[0].trim(),
      studentNameHint,
      explanation: `The portal problem message is: "${errorMatch[0].trim()}". That usually relates to student-record matching with your school, not a random website glitch.`,
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
      'From this screen: **your NELFUND student account is set up** — you are already logged into the Student Loan Portal' +
        (studentNameHint ? ` as **${studentNameHint}**` : '') +
        '.',
    )

    if (registrationWindow) {
      const sess = registrationWindow.session
        ? ` for the **${registrationWindow.session}** session`
        : ''
      const start = registrationWindow.start || 'the published start date'
      const end = registrationWindow.end || 'the published end date'
      lines.push(
        `The yellow notice is about **session registration${sess}**: **starts ${start}** and **ends ${end}**.`,
      )

      const status = windowStatus(registrationWindow.end)
      if (status.appearsClosed) {
        lines.push(`**Loan application for that session appears closed** — ${status.note}`)
        lines.push(
          'That is different from a “pending” application. Closed means the registration/application window on the notice has ended, not that NELFUND is still reviewing a submitted loan.',
        )
      } else if (status.appearsOpen) {
        lines.push(status.note)
      } else {
        lines.push(status.note)
      }
    }

    if (loanCounts) {
      const t = loanCounts.total
      const a = loanCounts.approved
      const p = loanCounts.pending
      const d = loanCounts.declined
      if (t !== undefined || a !== undefined || p !== undefined || d !== undefined) {
        lines.push(
          `Loan counters: **Total ${t ?? '—'}**, **Approved ${a ?? '—'}**, **Pending ${p ?? '—'}**, **Declined ${d ?? '—'}**.`,
        )
        lines.push(
          '**Pending Loans = 0 does not mean your application is pending.** Zero across the board usually means you have not submitted a loan application in those buckets yet (or none are recorded).',
        )
      }
    }

    lines.push(
      'Next: watch the official portal for the next open cycle, or ask me what to prepare for when applications reopen.',
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
        `Check live status on the official portal: ${PORTAL}`,
        `Announcements: ${SITE}`,
        `Support ticket if something is wrong with the account: ${ESUPPORT}`,
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

  if (/nelfund|student\s*loan\s*portal|portal\.nelf/i.test(text) && !looksLikeQuestion) {
    return {
      kind: 'unknown',
      signals: ['portal_ui'],
      explanation:
        'I can see this is related to the NELFUND portal. Tell me what you want to do, or paste the main text from the screen (notice dates, loan counters, or any error).',
      nextActions: [`Portal: ${PORTAL}`, `Support: ${ESUPPORT}`],
      exactError: null,
      loanCounts: null,
      registrationWindow: null,
      studentNameHint: null,
    }
  }

  return null
}

export const SAMPLE_DASHBOARD_OCR = `
Welcome to Student Loan Portal, Damilola
Notice 2025/2026 Session Registration Starts March 5th 2026 And Ends June 5th 2026
Please note that you will not be able to apply for a loan this session after the end date.
Total Loans 0
Approved Loans 0
Pending Loans 0
Declined Loans 0
`
