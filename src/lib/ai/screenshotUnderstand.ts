/**
 * Portal / website screenshot understanding from OCR text.
 * Flexible signal scoring — not locked to one exact layout.
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
  signupForm: boolean
  profileForm: boolean
  resetPassword: boolean
  createAccount: boolean
  bvnNinFields: boolean
  visibleLines: string[]
}

function collectSignals(raw: string): Signals {
  const t = raw.replace(/\s+/g, ' ').trim()
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
    .slice(0, 30)

  return {
    nelfundBrand: /nelfund|nigerian\s*education\s*loan|nelf\.gov|portal\.nelf/i.test(t),
    citizenshipQ: /are\s*you\s*a\s*nigerian|yes,?\s*i\s*am\s*a\s*nigerian|no,?\s*i\s*am\s*not/i.test(t),
    educationalVerify: /verify\s*(your\s*)?educational|educational\s*information/i.test(t),
    jambVerify: /verify\s*(with\s*)?jamb|jamb\s*(verification|reg|number)/i.test(t),
    studentStatus: /verify\s*(your\s*)?student\s*status|student\s*status/i.test(t),
    getStartedQuestions: /get\s*started\s*with\s*answering|answering\s*these\s*questions/i.test(t),
    loanCounters: /total\s*loans|approved\s*loans|pending\s*loans|declined\s*loans/i.test(t),
    sessionNotice:
      /session\s*registration|starts?\s+[A-Za-z]+\s+\d{1,2}|ends?\s+[A-Za-z]+\s+\d{1,2}|20\d{2}\s*\/\s*20\d{2}/i.test(
        t,
      ),
    portalWelcome: /welcome\s+to\s+(the\s+)?student\s+loan\s+portal/i.test(t),
    interestFreeMarketing:
      /interest\s*free|fast\s*&\s*easy|safe\s*&\s*secure|15\s*-\s*30\s*minutes|no\s*hidden\s*charges/i.test(t),
    websiteHero:
      /increasing\s*access\s*to\s*(all\s*)?education|simple\s*steps\s*to\s*secure\s*your\s*student\s*loan/i.test(t),
    applyNowLogin: /apply\s*now/i.test(t) && /\blogin\b/i.test(t),
    missingInfo:
      /missing\s*information|record\s*not\s*found|no\s*school\s*info|student\s*record\s*not|unable\s*to\s*verify|invalid\s*(nin|bvn|credentials)/i.test(
        t,
      ),
    loginForm:
      /password/i.test(t) &&
      (/\blog\s*in\b|sign\s*in|email/i.test(t) ||
        /kindly\s*provide.*login|required\s*details.*login/i.test(t)),
    signupForm:
      /create\s*(a\s*)?(new\s*)?account|sign\s*up|register\s*(now|here)?/i.test(t) &&
      !/password/i.test(t),
    profileForm: /update\s*profile|personal\s*details|edit\s*profile|my\s*profile/i.test(t),
    resetPassword: /reset\s*(your\s*)?password|forgot\s*password/i.test(t),
    createAccount: /don'?t\s*have\s*an?\s*account|create\s*new\s*account/i.test(t),
    bvnNinFields: /\bbvn\b|\bnin\b|bank\s*verification|national\s*identity/i.test(t),
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
    if (sessionLabel) lines.push(`• It refers to the **${sessionLabel}** registration / loan window on the portal.`)
    if (startsRaw && endsRaw) lines.push(`• Official notice dates: **${startsRaw}** → **${endsRaw}**.`)
    if (endDate && now.getTime() > endDate.getTime()) {
      lines.push(`• Relative to today, that **${sessionLabel || 'session'}** apply window has **already ended**.`)
      lines.push(
        '• **Loan / upkeep for a newer session (e.g. 2026/2027)** only opens when NELFUND publishes it — do not pay any agent “to open” it.',
      )
    } else if (startDate && now.getTime() < startDate.getTime()) {
      lines.push(`• Relative to today, that window has **not started yet** (opens **${startsRaw}** per the notice).`)
    } else if (startDate && endDate && now.getTime() >= startDate.getTime() && now.getTime() <= endDate.getTime()) {
      lines.push(
        `• Relative to today, that notice window is **within** **${startsRaw}** → **${endsRaw}** — still confirm live status only on the official portal.`,
      )
    }
    lines.push('')
    lines.push(`Always re-check the same banner on ${PORTAL} or ${SITE}; dates can change.`)
  }
  lines.push('')
  lines.push('**What you should do**')
  lines.push('1. Keep your profile, NIN, JAMB, and school record complete while you wait')
  lines.push('2. Do **not** pay anyone to “activate” or “speed up” a loan')
  lines.push(`3. Watch ${PORTAL} / ${SITE} for the next official application window`)
  lines.push(`4. Portal error that will not clear → report to NELFUND support: ${ESUPPORT}`)
  return lines.join('\n')
}

export function dashboardFollowUpExplanation(): string {
  return (
    'In plain terms:\n\n' +
    '1. **You already have a NELFUND portal account** — login worked.\n' +
    '2. **Zeros** mean no loan/upkeep application is counted yet — not that you are banned.\n' +
    '3. Session **Notice** dates are that window only; a newer session opens only when NELFUND announces it.\n\n' +
    `Check live notices only at ${PORTAL} and ${SITE}.`
  )
}

function applyFlowExplanation(s: Signals): string {
  const bullets: string[] = []
  if (s.citizenshipQ)
    bullets.push('**Citizenship** question (e.g. “Are you a Nigerian?”) — NELFUND is for Nigerian citizens')
  if (s.educationalVerify) bullets.push('**Educational information** verification')
  if (s.jambVerify || s.studentStatus) bullets.push('**Student status / JAMB** verification')
  if (s.getStartedQuestions) bullets.push('“Get started with answering these questions” apply wizard')
  if (s.bvnNinFields) bullets.push('Identity fields (NIN / BVN) may be required on this step')
  if (bullets.length === 0) bullets.push('An **application / verification step** on the official portal')

  const seen =
    s.visibleLines.length > 0
      ? '\n\n**Text visible on the screen (from the image):**\n' +
        s.visibleLines
          .filter((l) =>
            /nigerian|verify|jamb|education|student|question|yes|no|back|help|nelfund|password|email|login|loan|pending|approved/i.test(
              l,
            ),
          )
          .slice(0, 10)
          .map((l) => `• ${l}`)
          .join('\n')
      : ''

  return (
    `This is a **NELFUND apply / eligibility step** on portal.nelf.gov.ng (application flow), not the public marketing homepage.\n\n` +
    `**What the image shows**\n` +
    bullets.map((b) => `• ${b}`).join('\n') +
    seen +
    `\n\n**What to do**\n` +
    `• Answer each question truthfully and complete verification in order\n` +
    `• Stay only on ${PORTAL} — never pay an agent to “pass” these steps\n` +
    `• If a step keeps failing → report it to NELFUND support: ${ESUPPORT}\n` +
    `• Public site: ${SITE}`
  )
}

function describeVisible(s: Signals): string {
  if (!s.visibleLines.length) return ''
  return (
    '\n\n**Readable lines from the screenshot:**\n' +
    s.visibleLines.slice(0, 10).map((l) => `• ${l}`).join('\n')
  )
}

function alwaysUsefulFromOcr(s: Signals, _raw: string): ScreenUnderstanding {
  const snippet = describeVisible(s)
  return {
    kind: 'apply-flow',
    exactError: null,
    explanation:
      `This looks like a **NELFUND-related screen** from your screenshot.` +
      snippet +
      `\n\n**What to do next**\n` +
      `• Continue only on the official portal: ${PORTAL}\n` +
      `• Public website: ${SITE}\n` +
      `• Need help from NELFUND? Report the issue here: ${ESUPPORT}\n` +
      `• Never share password, OTP, or NIN with agents\n\n` +
      `If you tell me what you are trying to do (login, apply, verify JAMB, fix an error, check status), I will give the exact next step.`,
    nextActions: [PORTAL, SITE, ESUPPORT],
  }
}

export function understandPortalText(text: string): ScreenUnderstanding | null {
  const t = (text || '').trim()
  if (!t || t.length < 6) return null

  const s = collectSignals(t)

  // Invalid JAMB number / format (red banner, student text, or common OCR misreads)
  if (
    /in\.?valid\s*jamb|lnvalid\s*jamb|jamb\s*(number|reg(istration)?)\s*(is\s*)?(invalid|wrong|incorrect|format)|jamb\s*number\s*format|e\.?\s*g\.?\s*\d{4}\s*\d{0,2}\s*[A-Za-z]{0,2}|0000\s*00\s*AA/i.test(
      t,
    )
  ) {
    return {
      kind: 'error',
      exactError: 'Invalid JAMB number format',
      explanation:
        `The portal is showing this error: **Invalid JAMB number format** (example on the banner looks like **0000 00AA**).\n\n` +
        `**What it means**\n` +
        `NELFUND did **not** accept the JAMB Registration Number you typed. It is usually a typing or format problem — not that you are banned from the loan.\n\n` +
        `**Fix it yourself first**\n` +
        `1. Open your **JAMB profile** or admission letter on a reliable device\n` +
        `2. Copy the **JAMB Registration Number exactly** as JAMB shows it (every digit and letter)\n` +
        `3. Paste it into the portal — avoid extra spaces; match capital/small letters if JAMB shows them that way\n` +
        `4. Check that **Date of birth** is the same as on JAMB\n` +
        `5. Tap **Verify JAMB Profile** again\n\n` +
        `**If it still says invalid after you copied correctly**\n` +
        `Report the problem to **NELFUND official support** (not agents on WhatsApp):\n` +
        `• Open a ticket here: ${ESUPPORT}\n` +
        `• Tell them: “JAMB Profile Verification shows Invalid JAMB number format”\n` +
        `• Attach a screenshot of the red error (you can cover your password if any)\n` +
        `• Include your JAMB reg number and school name in the ticket\n\n` +
        `Portal: ${PORTAL}\nWebsite: ${SITE}`,
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  if (s.missingInfo) {
    return {
      kind: 'error',
      exactError: 'Missing information / verification failed',
      explanation:
        '**Missing information / verification problem** usually means the portal cannot match your details (name, NIN, JAMB, matric, or school record) yet.\n\nThis is **not** automatically a permanent rejection.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry the portal after they confirm\n4. Still failing → report to NELFUND support: https://nelfund.esupport.ng/create',
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

  if (s.loginForm && (s.nelfundBrand || s.portalWelcome || s.resetPassword || s.createAccount)) {
    return {
      kind: 'login',
      exactError: null,
      explanation:
        `This is the **NELFUND student loan portal login page** (portal.nelf.gov.ng).\n\n` +
        `**What you are seeing**\n` +
        `• **Email** and **Password** fields to sign in\n` +
        `• **Log In** button\n` +
        (s.resetPassword ? `• **Reset password** via Email or NIN\n` : '') +
        (s.createAccount ? `• **Create New Account** if you do not have one yet\n` : '') +
        `\n**Official links**\n` +
        `• Portal (login / apply): ${PORTAL}\n` +
        `• Public website: ${SITE}\n` +
        `• Support: ${ESUPPORT}\n\n` +
        `Never share your password or OTP with anyone claiming to be an agent.`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if (/password/i.test(t) && s.nelfundBrand && /email|log\s*in|sign\s*in/i.test(t)) {
    return {
      kind: 'login',
      exactError: null,
      explanation:
        `This is the **NELFUND portal login** screen (portal.nelf.gov.ng).\n\n` +
        `Enter your **email** and **password**, then **Log In**.\n\n` +
        `• Portal: ${PORTAL}\n• Website: ${SITE}\n• Support: ${ESUPPORT}\n\n` +
        `Never share password or OTP with agents.`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  if (s.portalWelcome && s.interestFreeMarketing) {
    return {
      kind: 'portal-landing',
      exactError: null,
      explanation:
        `This is the **official NELFUND application portal landing page** (portal.nelf.gov.ng).\n\n` +
        `Use it to **sign up / create account** and start the loan application flow.\n\n` +
        `• Portal: ${PORTAL}\n• Website: ${SITE}\n• Support: ${ESUPPORT}`,
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
        `This is the **official NELFUND website homepage** (nelf.gov.ng).\n\n` +
        `• **LOGIN** → log in / sign in at ${SITE}\n` +
        `• **APPLY NOW** → sign up / apply at ${PORTAL}\n\n` +
        `Always use only these official domains.`,
      nextActions: [SITE, PORTAL, ESUPPORT],
    }
  }

  if (s.profileForm && s.nelfundBrand) {
    return {
      kind: 'profile',
      exactError: null,
      explanation:
        `This looks like a **NELFUND portal profile / personal details** screen.\n\n` +
        `Keep NIN, JAMB, name, and school details accurate and matching your records.\n\n` +
        `• Portal: ${PORTAL}\n• Support: ${ESUPPORT}`,
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  if (s.signupForm && s.nelfundBrand) {
    return {
      kind: 'signup',
      exactError: null,
      explanation:
        `This is a **NELFUND create account / sign-up** step on portal.nelf.gov.ng.\n\n` +
        `• Sign up / apply: ${PORTAL}\n• Existing account login: same portal\n• Support: ${ESUPPORT}`,
      nextActions: [PORTAL, SITE, ESUPPORT],
    }
  }

  // JAMB Profile Verification form (without format error already handled above)
  if (/jamb\s*profile\s*verification|enter\s*jamb\s*registration|verify\s*jamb\s*profile/i.test(t)) {
    return {
      kind: 'apply-flow',
      exactError: null,
      explanation:
        `This is the **JAMB Profile Verification** step on portal.nelf.gov.ng.\n\n` +
        `**What to enter**\n` +
        `• **JAMB Registration Number** — copy **exactly** from your official JAMB profile / admission letter (same digits and letters; no extra spaces)\n` +
        `• **Date of birth** — must match JAMB\n` +
        `• Then tap **Verify JAMB Profile**\n\n` +
        `**If the red banner says “Invalid JAMB number format” (e.g. 0000 00AA)**\n` +
        `• That means the number you typed does **not** match the format the portal expects\n` +
        `• Re-copy the number carefully from JAMB (check uppercase letters, no spaces unless JAMB shows them)\n` +
        `• Confirm DOB matches, then verify again\n` +
        `• Still failing after correct copy → report it to NELFUND support at ${ESUPPORT} (attach screenshot of the error; do not send your password)\n\n` +
        `• Portal: ${PORTAL}\n• Support: ${ESUPPORT}\n• Website: ${SITE}`,
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  if (s.jambVerify || s.educationalVerify || s.citizenshipQ || s.getStartedQuestions) {
    return {
      kind: 'apply-flow',
      exactError: null,
      explanation: applyFlowExplanation(s),
      nextActions: [PORTAL, ESUPPORT, SITE],
    }
  }

  if (s.nelfundBrand || /student\s*loan|portal|loan\s*fund/i.test(t)) {
    return alwaysUsefulFromOcr(s, t)
  }

  if (s.visibleLines.length >= 4) {
    return alwaysUsefulFromOcr(s, t)
  }

  return null
}
