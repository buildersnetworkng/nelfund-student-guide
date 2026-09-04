/**
 * Portal / website screenshot understanding from OCR text.
 * Flexible signal scoring — not locked to one exact layout.
 * Works when copy, order, or OCR noise varies across similar pages.
 */

export type ScreenKind =
  | 'dashboard'
  | 'error'
  | 'login'
  | 'website'
  | 'portal-landing'
  | 'eligibility-form'
  | 'apply-flow'
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

type Signals = {
  nelfundBrand: boolean
  citizenshipQ: boolean
  educationalVerify: boolean
  jambVerify: boolean
  studentStatus: boolean
  getStartedQuestions: boolean
  loanCounters: boolean
  sessionNotice: boolean
  portalWelcome: boolean
  interestFreeMarketing: boolean
  websiteHero: boolean
  applyNowLogin: boolean
  missingInfo: boolean
  loginForm: boolean
  visibleLines: string[]
}

function collectSignals(raw: string): Signals {
  const t = raw.replace(/\s+/g, ' ').trim()
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
    .slice(0, 24)

  return {
    nelfundBrand: /nelfund|nigerian\s*education\s*loan|nelf\.gov|portal\.nelf/i.test(t),
    citizenshipQ: /are\s*you\s*a\s*nigerian|yes,?\s*i\s*am\s*a\s*nigerian|no,?\s*i\s*am\s*not/i.test(t),
    educationalVerify: /verify\s*(your\s*)?educational|educational\s*information/i.test(t),
    jambVerify: /verify\s*(with\s*)?jamb|jamb\s*(verification|reg)/i.test(t),
    studentStatus: /verify\s*(your\s*)?student\s*status|student\s*status/i.test(t),
    getStartedQuestions: /get\s*started\s*with\s*answering|answering\s*these\s*questions/i.test(t),
    loanCounters: /total\s*loans|approved\s*loans|pending\s*loans|declined\s*loans/i.test(t),
    sessionNotice: /session\s*registration|starts?\s+[A-Za-z]+\s+\d{1,2}|ends?\s+[A-Za-z]+\s+\d{1,2}|20\d{2}\s*\/\s*20\d{2}/i.test(t),
    portalWelcome: /welcome\s+to\s+(the\s+)?student\s+loan\s+portal/i.test(t),
    interestFreeMarketing: /interest\s*free|fast\s*&\s*easy|safe\s*&\s*secure|15\s*-\s*30\s*minutes|no\s*hidden\s*charges/i.test(t),
    websiteHero: /increasing\s*access\s*to\s*(all\s*)?education|simple\s*steps\s*to\s*secure\s*your\s*student\s*loan/i.test(t),
    applyNowLogin: /apply\s*now/i.test(t) && /\blogin\b/i.test(t),
    missingInfo: /missing\s*information|record\s*not\s*found|no\s*school\s*info|student\s*record\s*not/i.test(t),
    loginForm:
      /password/i.test(t) &&
      (/\blog\s*in\b|sign\s*in|email/i.test(t) || /kindly\s*provide.*login|required\s*details.*login/i.test(t)),
    visibleLines: lines,
  }
}

function dashboardExplanation(t: string): string {
  const hasWelcome = /welcome\s+to\s+(the\s+)?student\s+loan\s+portal/i.test(t)
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

function applyFlowExplanation(s: Signals): string {
  const bullets: string[] = []
  if (s.citizenshipQ) bullets.push('**Citizenship** question (e.g. “Are you a Nigerian?”) — NELFUND is for Nigerian citizens')
  if (s.educationalVerify) bullets.push('**Educational information** verification')
  if (s.jambVerify || s.studentStatus) bullets.push('**Student status / JAMB** verification')
  if (s.getStartedQuestions) bullets.push('“Get started with answering these questions” apply wizard')
  if (bullets.length === 0) {
    bullets.push('An **application / verification step** on the official portal')
  }

  const seen =
    s.visibleLines.length > 0
      ? '\n\n**Text visible on the screen (from the image):**\n' +
        s.visibleLines
          .filter((l) => /nigerian|verify|jamb|education|student|question|yes|no|back|help|nelfund/i.test(l))
          .slice(0, 8)
          .map((l) => `• ${l}`)
          .join('\n')
      : ''

  return (
    `This is a **NELFUND apply / eligibility step** on **portal.nelf.gov.ng** (application flow), not the public marketing homepage.\n\n` +
    `**What the image shows**\n` +
    bullets.map((b) => `• ${b}`).join('\n') +
    seen +
    `\n\n**What to do**\n` +
    `• Answer each question truthfully and complete verification in order\n` +
    `• Stay only on **${PORTAL}** — never pay an agent to “pass” these steps\n` +
    `• If a step fails or is stuck → **${ESUPPORT}**\n` +
    `• Public site: **${SITE}**`
  )
}

function flexiblePortalFallback(s: Signals, _raw: string): ScreenUnderstanding | null {
  const applyScore =
    (s.citizenshipQ ? 3 : 0) +
    (s.educationalVerify ? 2 : 0) +
    (s.jambVerify ? 2 : 0) +
    (s.studentStatus ? 1 : 0) +
    (s.getStartedQuestions ? 2 : 0)

  if (applyScore >= 2) {
    return {
      kind: applyScore >= 4 ? 'eligibility-form' : 'apply-flow',
      exactError: null,
      explanation: applyFlowExplanation(s),
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  if (s.nelfundBrand && s.visibleLines.length >= 3) {
    const snippet = s.visibleLines.slice(0, 6).map((l) => `• ${l}`).join('\n')
    return {
      kind: 'apply-flow',
      exactError: null,
      explanation:
        `This looks like a **NELFUND portal screen** (from the image text).\n\n` +
        `**Readable lines from the screenshot:**\n${snippet}\n\n` +
        `**Typical next steps on the portal**\n` +
        `• Continue only on **${PORTAL}**\n` +
        `• Log in / public site: **${SITE}**\n` +
        `• Stuck or error → **${ESUPPORT}**\n\n` +
        `Tell me what you are trying to do on this page (apply, verify JAMB, fix an error, check status) if you need a more specific next step.`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  return null
}

export function understandPortalText(text: string): ScreenUnderstanding | null {
  const t = (text || '').trim()
  if (!t || t.length < 8) return null

  const s = collectSignals(t)

  if (s.missingInfo) {
    return {
      kind: 'error',
      exactError: 'Missing information / record not found',
      explanation:
        '**Missing information** usually means the portal cannot match your details to a school record yet (name, NIN, JAMB, or matric).\n\nThis is **not** automatically a permanent rejection.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry the portal after they confirm\n4. Still failing → eSupport',
      nextActions: [PORTAL, ESUPPORT, SITE, 'Share your school name'],
    }
  }

  const applyScore =
    (s.citizenshipQ ? 3 : 0) +
    (s.educationalVerify ? 2 : 0) +
    (s.jambVerify ? 2 : 0) +
    (s.studentStatus ? 1 : 0) +
    (s.getStartedQuestions ? 2 : 0)
  if (applyScore >= 2) {
    return {
      kind: applyScore >= 4 ? 'eligibility-form' : 'apply-flow',
      exactError: null,
      explanation: applyFlowExplanation(s),
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  // Portal login form (Email + Password) — before welcome→dashboard
  if (s.loginForm && (s.nelfundBrand || s.portalWelcome)) {
    return {
      kind: 'login',
      exactError: null,
      explanation:
        `This is the **NELFUND student loan portal login page** (**portal.nelf.gov.ng**).\n\n` +
        `**What you are seeing**\n` +
        `• **Email** and **Password** fields to sign in to an existing account\n` +
        `• **Log In** button\n` +
        `• **Reset password** via Email or NIN (if shown)\n` +
        `• **Create New Account** if you do not have one yet\n\n` +
        `**Official links**\n` +
        `• Portal (this login / apply): **${PORTAL}**\n` +
        `• Public website: **${SITE}**\n` +
        `• Support: **${ESUPPORT}**\n\n` +
        `Never share your password or OTP with anyone claiming to be an agent.`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if (s.portalWelcome && s.interestFreeMarketing) {
    return {
      kind: 'portal-landing',
      exactError: null,
      explanation:
        `This is the **official NELFUND application portal landing page** (**portal.nelf.gov.ng**), not the public marketing site (nelf.gov.ng).\n\n` +
        `**What this page is for**\n` +
        `• Start **sign up / create account** and the loan application flow\n` +
        `• “Interest Free Loan”, “Fast & Easy”, “Safe & Secure” are portal marketing points — not your personal loan decision\n` +
        `• **Having Trouble? Get Help** is the portal’s help entry\n\n` +
        `**Where to go next**\n` +
        `• Continue on this portal: **${PORTAL}**\n` +
        `• Public website (info / some login routes): **${SITE}**\n` +
        `• Support tickets: **${ESUPPORT}**\n\n` +
        `Never share OTP or password with agents.`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if ((s.loanCounters || s.sessionNotice || (s.portalWelcome && !s.loginForm)) && !s.interestFreeMarketing) {
    return {
      kind: 'dashboard',
      exactError: null,
      explanation: dashboardExplanation(t),
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if ((s.websiteHero || s.applyNowLogin) && !s.portalWelcome && !s.interestFreeMarketing) {
    return {
      kind: 'website',
      exactError: null,
      explanation:
        `This is the **official NELFUND website homepage** (**nelf.gov.ng**), not the student loan portal dashboard.\n\n` +
        `**What the buttons mean**\n` +
        `• **LOGIN** → log in / sign in at **${SITE}**\n` +
        `• **APPLY NOW** → sign up / apply on the application portal **${PORTAL}**\n\n` +
        `“Simple Steps to Secure Your Student Loan” is the marketing steps section on the public site.\n\n` +
        `Always use only these official domains — never random WhatsApp/agent links.`,
      nextActions: [SITE, PORTAL, ESUPPORT],
    }
  }

  return flexiblePortalFallback(s, t)
}
