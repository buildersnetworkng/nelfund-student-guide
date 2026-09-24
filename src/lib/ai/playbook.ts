/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { isOverviewAsk, fullNelfundOverview } from './overviewAsk'
import { explainTerm } from './termDefine'
import { playbookHourly156 } from './playbookHourly156'
import { playbookHourly157 } from './playbookHourly157'
import { playbookHourly158 } from './playbookHourly158'
import { playbookHourly159 } from './playbookHourly159'
import { playbookHourly160 } from './playbookHourly160'
import { playbookHourly161 } from './playbookHourly161'
import { playbookHourly162 } from './playbookHourly162'
import { playbookHourly163 } from './playbookHourly163'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string | null
  userText?: string | null
  priorIntent?: IntentId | null
}

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const userText = (ctx.userText || '').trim()

  if (userText && isOverviewAsk(userText)) {
    return fullNelfundOverview()
  }

  const term = userText ? explainTerm(userText, ctx.lastAssistant) : null
  if (term) return term.text

  const h163 = playbookHourly163(intent, userText)
  if (h163) return h163
  const h162 = playbookHourly162(intent, userText)
  if (h162) return h162
  const h161 = playbookHourly161(intent, userText)
  if (h161) return h161
  const h160 = playbookHourly160(intent, userText)
  if (h160) return h160
  const h159 = playbookHourly159(intent, userText)
  if (h159) return h159
  const h158 = playbookHourly158(intent, userText)
  if (h158) return h158
  const h157 = playbookHourly157(intent, userText)
  if (h157) return h157
  const h156 = playbookHourly156(intent, userText)
  if (h156) return h156

  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return (
      '**NELFUND** is the **Nigeria Education Loan Fund** \u2014 a government student loan scheme for eligible students in public tertiary institutions.\n\n' +
      '- **Institutional charges** go to the school.\n' +
      '- **Upkeep** (optional) goes to you if requested.\n' +
      `- Official: ${SITE} \u00b7 signup ${PORTAL} \u00b7 login ${LOGIN_URL}`
    )
  }

  if (intent === 'eligibility') {
    const levelBit = /200\s*level/i.test(userText)
      ? '200-level students can apply if they meet official rules \u2014 year of study is not a substitute for uploaded school data.\n\n'
      : /100\s*level|fresher|newly\s*admit/i.test(userText)
        ? '100-level / newly admitted students can apply once the school has uploaded the record.\n\n'
        : /300\s*level/i.test(userText)
          ? '300-level students can apply if they meet official rules \u2014 any level / year of study still needs a valid uploaded record.\n\n'
          : /400\s*level|final\s*year|500\s*level/i.test(userText)
            ? 'Final-year / 400-level (and similar) students can apply if they still meet official rules and the school record is uploaded.\n\n'
            : /poly(technic)?|college\s*of\s*education|coe\b/i.test(userText)
              ? 'Students in public polytechnics and colleges of education can apply if the institution is on the official list and the record is uploaded.\n\n'
              : /private/i.test(userText)
                ? 'Official coverage is for eligible students in **public** tertiary institutions \u2014 confirm private-school questions only on the portal.\n\n'
                : /part[\s-]*time|sandwich|post\s*graduate|postgraduate/i.test(userText)
                  ? 'Mode of study (part-time, sandwich, postgraduate) must match what the official portal accepts for your school record. Confirm there \u2014 I will not invent extra categories.\n\n'
                  : 'Any level / year of study can apply if official eligibility is met.\n\n'
    return (
      '**Eligibility**\n\n' +
      levelBit +
      '\u2022 Nigerian citizen\n' +
      '\u2022 Full-time student in a **public** tertiary institution\n' +
      '\u2022 Valid admission; have Matriculation number (when issued), JAMB, NIN, BVN, bank in your name ready\n\n' +
      `Confirm on ${PORTAL}.`
    )
  }

  if (intent === 'how-to-apply') {
    const upkeepBit = /upkeep|stipend|allowance/i.test(userText)
      ? '\nTick **upkeep** in the same application session if you want the optional living support (paid to you). Institutional charges still go to the school.\n'
      : ''
    return (
      '**How to apply**\n\n' +
      `1. Open ${PORTAL}\n` +
      '2. Create account or sign in.\n' +
      `3. Login page: ${LOGIN_URL}\n` +
      '4. Complete profile (JAMB, NIN, BVN, bank).\n' +
      '5. Request the loan when the official window is open.' +
      upkeepBit +
      `\n6. Stuck: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (intent === 'portal-login') {
    return `**How to log in / sign in**\n\n1. Open ${LOGIN_URL}\n2. Enter your NELFUND account email and password.\n3. Read the exact error if login fails.\n4. New account / signup: ${PORTAL}\n5. Portal hangs: refresh once, try another network, then ${ESUPPORT}.\n\nFor **forgot password** or **email already used**, ask those as separate questions \u2014 they are different fixes.`
  }

  if (intent === 'password-reset') {
    return (
      '**Forgot password**\n\n' +
      `1. Open ${LOGIN_URL} or ${PORTAL} \u2192 Forgot / Reset password.\n` +
      '2. Enter the email linked to your account.\n' +
      '3. Check inbox and spam.\n' +
      '4. Set a new password and sign in.\n' +
      `5. No email: ${ESUPPORT}. Do not create a second account unless support tells you to.`
    )
  }

  if (intent === 'email-already-used') {
    return (
      '**Email already used**\n\n' +
      `1. Sign in at ${LOGIN_URL} with that email.\n` +
      `2. If you forgot the password: reset for that same email on ${PORTAL}.\n` +
      `3. Still stuck: ${ESUPPORT} with a screenshot.\n\n` +
      '\u201cI used this email before\u201d is not a special rule \u2014 it only means an account may already exist.'
    )
  }

  if (intent === 'upkeep' || intent === 'upkeep-allowance') {
    return (
      '**Upkeep** is optional living support.\n\n' +
      '- Tick it in the same session as institutional charges.\n' +
      '- Paid to **your** bank account.\n' +
      `- Confirm amounts only on ${PORTAL}.`
    )
  }

  if (intent === 'institutional-charges' || intent === 'upkeep-vs-fees' || intent === 'school-fees') {
    return (
      '**School fees vs upkeep**\n\n' +
      '1. **Institutional charges** \u2192 paid to your **school**.\n' +
      '2. **Upkeep** (optional) \u2192 paid to **you**.\n' +
      `3. Confirm figures only on ${PORTAL}.`
    )
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    return (
      '**Missing information / school not on the list**\n\n' +
      'Usually the school has not finished uploading your record.\n\n' +
      '1. Confirm public institution.\n' +
      '2. Ask campus NELFUND desk about upload.\n' +
      `3. Retry ${PORTAL}. Still failing: ${ESUPPORT}.`
    )
  }

  if (intent === 'pending-application') {
    return (
      '**Pending / check status**\n\n' +
      `1. Sign in at ${LOGIN_URL} and read the exact status text.\n` +
      '2. Institutional charges go to the school after approval; upkeep (if ticked) goes to you.\n' +
      'Official FAQ: disbursement is within **30 days of approval** of a successful application.\n' +
      `3. Still unchanged after that window: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I will not invent your personal pay date.'
    )
  }

  if (intent === 'jamb-verification') {
    return (
      '**JAMB verification**\n\n' +
      '1. Use the JAMB number that matches your admission.\n' +
      '2. If NIN is not linked to JAMB, the portal may ask you to supply NIN.\n' +
      `3. Retry ${PORTAL}. Still \u201cinvalid JAMB\u201d: campus desk + ${ESUPPORT} with a screenshot.\n` +
      'I cannot change JAMB CAPS from this chat.'
    )
  }

  if (intent === 'documents-needed') {
    return (
      '**Documents typically asked on the portal**\n\n' +
      '\u2022 JAMB number / admission letter\n' +
      '\u2022 NIN and BVN\n' +
      '\u2022 Bank account in **your** name\n' +
      '\u2022 Matriculation number when the school has issued it\n' +
      '\u2022 School ID (if the form asks)\n\n' +
      `Upload only on ${PORTAL}. Never send documents to an agent.`
    )
  }

  if (intent === 'loan-or-scholarship') {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant or scholarship and it is not free money.\n' +
      `Repayment starts after the applicable study / NYSC period under official rules \u2014 confirm on ${SITE}. I will not invent rates.`
    )
  }

  if (intent === 'current-information' || intent === 'deadline' || intent === 'academic-session') {
    return (
      '**Application window**\n\n' +
      'Confirm live open/closed status only on the official portal \u2014 windows change.\n' +
      `Open ${PORTAL} or ${SITE}. Login: ${LOGIN_URL}.\n` +
      'I will not invent a private closing date beyond what the official pages show.'
    )
  }

  if (intent === 'repayment' || intent === 'gsi') {
    return (
      '**Repayment** starts after the applicable study / NYSC period under official rules.\n\n' +
      `Official FAQ: due **2 years after NYSC**. Confirm on ${SITE} and ${PORTAL}. I will not invent start dates, percentages, or jail terms.`
    )
  }

  if (intent === 'scam-safety') {
    return (
      '**Stay safe**\n\n' +
      '- Never pay agents.\n' +
      '- Never share OTP or password.\n' +
      `- Official only: ${SITE} \u00b7 ${PORTAL} \u00b7 ${LOGIN_URL} \u00b7 ${ESUPPORT}`
    )
  }

  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support**\n\n- Website: ${SITE}\n- Signup / portal: ${PORTAL}\n- Login / sign in: ${LOGIN_URL}\n- Tickets: ${ESUPPORT}\n\nI will not invent WhatsApp agents or private numbers.`
  }

  if (intent === 'nin-verification') {
    return (
      '**NIN on the portal**\n\n' +
      '1. Use the NIN that belongs to you and matches JAMB where the portal asks.\n' +
      `2. Retry ${PORTAL}. Still failing: campus desk + ${ESUPPORT}.`
    )
  }

  if (intent === 'bank-information') {
    return (
      '**Bank / BVN**\n\n' +
      `Use an account in your name. Update only on ${PORTAL}. Tickets: ${ESUPPORT}.`
    )
  }

  if (intent === 'email-draft') {
    const school = /lasu/i.test(userText)
      ? 'LASU'
      : /unilag/i.test(userText)
        ? 'UNILAG'
        : ctx.institutionName || 'the institution'
    const topic = /missing/i.test(userText) ? 'missing information / school record upload' : 'my NELFUND portal issue'
    return (
      `**Draft email**\n\n` +
      `Subject: NELFUND ${topic} \u2014 ${school} student\n\n` +
      `Dear ${school} NELFUND / ICT / Registry desk,\n\n` +
      `Please help confirm whether my student record has been uploaded for this NELFUND cycle. The portal still shows ${topic}.\n\n` +
      `I will attach my admission letter and JAMB number.\n\n` +
      `Thank you.\n\n` +
      `Send via official school channels. Copy a ticket at ${ESUPPORT} if the school confirms upload and the portal stays the same.`
    )
  }

  if (intent === 'rejected-application') {
    return (
      '**Rejected application**\n\n' +
      `Read the exact reason on ${LOGIN_URL}, then ${ESUPPORT} with a screenshot.`
    )
  }

  if (intent === 'reapplication') {
    return (
      '**Apply again**\n\n' +
      `Use the same email at ${LOGIN_URL}. Reset password on ${PORTAL} if needed. New request only when the official window is open.`
    )
  }

  if (intent === 'refund') {
    return (
      '**Refund**\n\n' +
      `Institutional charges go to the school. Raise the issue via ${ESUPPORT} with portal status. I will not invent a refund amount.`
    )
  }

  if (intent === 'guarantor') {
    return (
      '**Guarantor**\n\n' +
      `Official FAQ: no guarantor requirement. Confirm on ${SITE}. Apply on ${PORTAL}.`
    )
  }

  if (userText && /interest|zero\s*interest|interest[-\s]*free/i.test(userText)) {
    return (
      '**Interest**\n\n' +
      'Official portal describes the student loan as **interest-free** (no hidden charges).\n' +
      `Confirm current wording on ${SITE} and ${PORTAL}. I will not invent a rate.`
    )
  }

  if (userText && /nelfund|apply|login|eligib|upkeep|repay|portal|jamb|scam|password|email/i.test(userText)) {
    return `Open ${PORTAL}, note the exact status or error, then ask me with that wording. Login: ${LOGIN_URL}. Official tickets: ${ESUPPORT}.`
  }

  return null
}

export function isNelfundRelated(t: string): boolean {
  return /nelfund|apply|login|eligib|upkeep|repay|portal|jamb|scam|password|email/i.test(t)
}

export function isNearDuplicate(a?: string | null, b?: string | null): boolean {
  const x = (a || '').trim().toLowerCase()
  const y = (b || '').trim().toLowerCase()
  if (!x || !y) return false
  return x === y || (x.length > 20 && y.includes(x.slice(0, 24)))
}

export function isNewUserAsk(text?: string | null): boolean {
  const t = (text || '').trim()
  if (!t) return false
  return /^(how|what|who|when|where|can|is|do|abeg|wetin)\b/i.test(t) && t.length > 8
}

export function nextStepAdvance(ctx: PlaybookContext, intent?: IntentId | null): string {
  const id = intent || ctx.priorIntent
  const named = playbookAnswer((id || 'how-to-apply') as IntentId, ctx)
  if (named && named.length > 30) return named
  return (
    `**Next useful step**\n\n` +
    `1. Sign in at ${LOGIN_URL} and copy the exact portal wording.\n` +
    `2. Confirm school upload with the campus NELFUND desk if the list or name is wrong.\n` +
    `3. Official ticket if it stays the same: ${ESUPPORT}.`
  )
}
