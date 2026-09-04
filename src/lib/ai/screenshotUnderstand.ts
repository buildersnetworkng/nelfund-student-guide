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

function dashboardExplanation(t: string): string {
  const hasWelcome = /welcome\s+to\s+student\s+loan\s+portal/i.test(t)
  const hasZeros =
    /total\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    /approved\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    /pending\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    (/\b0\b/.test(t) && /total\s*loans|approved\s*loans|pending\s*loans/i.test(t))

  const sessionLabel =
    t.match(/20\d{2}\s*\/?\s*20\d{2}\s*session/i)?.[0]?.replace(/\s+/g, ' ').trim() ||
    t.match(/20\d{2}\s*\/\s*20\d{2}/)?.[0] ||
    null
  const startsRaw = t.match(/starts?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)?.[1]
  const endsRaw = t.match(/ends?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)?.[1]
  const startDate = parsePortalDate(startsRaw)
  const endDate = parsePortalDate(endsRaw)
  const now = new Date()

  const lines: string[] = []

  if (hasWelcome) {
    lines.push(
      'Good news: that screen means you **successfully signed in** to the **NELFUND student loan portal** (your account is working).',
    )
  } else {
    lines.push('That is the **NELFUND student loan portal dashboard**.')
  }

  lines.push('')

  if (hasZeros) {
    lines.push(
      '**Total / Approved / Pending / Declined = 0** means you do **not** yet have a loan or upkeep application counted on this dashboard. That is normal if you have only created the account and have **not** submitted a loan application for an open window.',
    )
    lines.push('')
  }

  if (sessionLabel || startsRaw || endsRaw) {
    lines.push('**What the Notice means**')
    if (sessionLabel) {
      lines.push(`• It refers to the **${sessionLabel}** registration / loan window on the portal.`)
    }
    if (startsRaw && endsRaw) {
      lines.push(`• Official notice dates: **${startsRaw}** → **${endsRaw}**.`)
    }
    if (endDate && now.getTime() > endDate.getTime()) {
      lines.push(
        `• Relative to today, that **${sessionLabel || 'session'}** apply window has **already ended** (after the end date the portal says you cannot apply for that session).`,
      )
      lines.push(
        '• **Loan / upkeep application for a newer session (e.g. 2026/2027)** is **not** shown as open on this notice — wait for NELFUND to publish the next window on the official sites. Do not pay any agent “to open” it.',
      )
    } else if (startDate && now.getTime() < startDate.getTime()) {
      lines.push(
        `• Relative to today, that window has **not started yet** (opens **${startsRaw}** per the notice).`,
      )
    } else if (startDate && endDate && now.getTime() >= startDate.getTime() && now.getTime() <= endDate.getTime()) {
      lines.push(
        `• Relative to today, that notice window is **within** **${startsRaw}** → **${endsRaw}** — still confirm live status only on the official portal.`,
      )
    }
    lines.push('')
    lines.push(`Always re-check the same banner on ${PORTAL} or ${SITE}; dates can change.`)
  } else {
    lines.push(
      'If a yellow **Notice** shows session registration start/end dates, that is the apply window text — not the zero counters.',
    )
  }

  lines.push('')
  lines.push('**What you should do**')
  lines.push('1. Keep your profile, NIN, JAMB, and school record complete while you wait')
  lines.push('2. Do **not** pay anyone to “activate” or “speed up” a loan')
  lines.push(`3. Watch ${PORTAL} / ${SITE} for the next official application window`)
  lines.push(`4. Stuck on a portal error → ${ESUPPORT}`)

  return lines.join('\n')
}

/** Short follow-up when the student asks “what does this mean” after a dashboard reply. */
export function dashboardFollowUpExplanation(): string {
  return (
    'In plain terms:\n\n' +
    '1. **You already have a NELFUND portal account** — the “Welcome to Student Loan Portal” screen means login worked.\n' +
    '2. **Zeros (Total / Approved / Pending / Declined)** mean you have **not** submitted a loan/upkeep application that the dashboard is counting yet — not that you are banned.\n' +
    '3. The **Notice** (e.g. 2025/2026 registration **March 5 → June 5 2026**) is about that session’s apply window. After the end date, you generally **cannot** apply for that session. A **2026/2027** (or next) loan window only opens when NELFUND announces it on the official site — this guide will not invent that date.\n\n' +
    `Check live notices only at ${PORTAL} and ${SITE}.`
  )
}

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

  if (
    /welcome\s+to\s+student\s+loan\s+portal|pending\s*loans|approved\s*loans|total\s*loans|declined\s*loans/i.test(
      t,
    )
  ) {
    return {
      kind: 'dashboard',
      exactError: null,
      explanation: dashboardExplanation(t),
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if (/login|sign\s*in|create\s*(an?\s*)?account|register/i.test(t) && /portal|nelfund|nelf\.gov/i.test(t)) {
    return {
      kind: 'login',
      exactError: null,
      explanation: `Use only the official portal: ${PORTAL}\n\nDo not enter passwords or OTP on any other site or with any agent.`,
      nextActions: [PORTAL, SITE],
    }
  }

  return null
}
