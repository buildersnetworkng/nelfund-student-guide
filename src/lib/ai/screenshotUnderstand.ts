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

function extractSessionNotice(t: string): string | null {
  const session =
    t.match(/20\d{2}\s*\/?\s*20\d{2}\s*session/i)?.[0] ||
    t.match(/20\d{2}\s*\/\s*20\d{2}/)?.[0] ||
    null
  const starts = t.match(/starts?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)?.[1]
  const ends = t.match(/ends?\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*20\d{2})/i)?.[1]
  if (!session && !starts && !ends) return null
  const parts: string[] = []
  if (session) parts.push(`**${session.replace(/\s+/g, ' ').trim()}** registration / loan window`)
  if (starts && ends) parts.push(`official notice: **${starts}** → **${ends}**`)
  else if (starts) parts.push(`starts **${starts}**`)
  else if (ends) parts.push(`ends **${ends}**`)
  if (/will not be able to apply|after the end date|not be able to apply/i.test(t)) {
    parts.push('After the **end date**, you generally cannot apply for that session’s loan window on the portal.')
  }
  return parts.length ? parts.join('. ') + '.' : null
}

function zerosExplanation(t: string): string {
  const hasZeros =
    /total\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    /approved\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    /pending\s*loans[\s\S]{0,40}\b0\b/i.test(t) ||
    (/\b0\b/.test(t) && /total\s*loans|approved\s*loans|pending\s*loans/i.test(t))
  if (!hasZeros) {
    return 'The **Total / Approved / Pending / Declined** tiles are portal counters. Read the status on **your** application card for the decision that applies to you.'
  }
  return (
    '**Total / Approved / Pending / Declined = 0** usually means you do **not** yet have an active loan application counted on this dashboard (or none has been submitted / matched yet).\n\n' +
    'These tiles are **counts**, not a personal rejection letter. They are **not** the same as “NELFUND banned you.”'
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
    const notice = extractSessionNotice(t)
    const zeros = zerosExplanation(t)
    const lines = [
      'That is the **NELFUND student loan portal dashboard**.',
      '',
      zeros,
    ]
    if (notice) {
      lines.push('', '**Notice on your screen**', notice, '', `Confirm the same dates only on ${PORTAL} or ${SITE} — windows can change.`)
    } else {
      lines.push(
        '',
        'If a **Notice** banner is visible (session registration start/end dates), that is the official window text for applying — not the zero counters.',
      )
    }
    lines.push(
      '',
      '**What to do next**',
      '1. Read any yellow/red **Notice** on the dashboard carefully',
      '2. Complete profile / school record if you have not applied yet',
      `3. Apply only while the official window is open (${PORTAL})`,
      `4. Unsure → ${ESUPPORT}`,
    )
    return {
      kind: 'dashboard',
      exactError: null,
      explanation: lines.join('\n'),
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
