import { playbookHourly172 } from './playbookHourly172'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 171: vocational/part-time, GSI, change-of-school, verify-email, parent apply, passport, OTP. */
export function playbookHourly171(intent: string, userText: string): string | null {
  const chained = playbookHourly172(intent, userText)
  if (chained) return chained
  const t = userText || ''

  if (/vocational|skills?\s*school|monotechnic|part[\s-]*time|sandwich/i.test(t)) {
    return (
      '**Programme type (vocational / part-time / sandwich)**\n\n' +
      'NELFUND is for eligible students in **public** tertiary institutions on this cycle.\n' +
      'Whether a **vocational, monotechnic, part-time or sandwich** programme qualifies depends on what the **official portal list and your school session** allow — not on a WhatsApp list.\n\n' +
      `1. Search the exact school name on ${PORTAL}.\n` +
      '2. If the school is missing, ask the campus NELFUND desk whether they uploaded your cohort.\n' +
      `3. Confirm live eligibility only on ${SITE}.\n` +
      `Tickets: ${ESUPPORT}`
    )
  }

  if (/gsi|global\s*standing|debit\s*my\s*account/i.test(t) || intent === 'gsi') {
    return (
      '**GSI / account debit**\n\n' +
      'GSI (Global Standing Instruction) is the repayment mandate banks use after you become eligible to repay.\n\n' +
      '1. Read the portal mandate text before you tick it.\n' +
      '2. Repayment is not the same as “someone debiting you during school.” Follow the official repayment timing on the portal.\n' +
      '3. Nobody on WhatsApp should collect a fee to “switch off GSI.”\n' +
      `4. Questions about a live debit: ${LOGIN}, then ${ESUPPORT} with a screenshot.\n` +
      `Official site: ${SITE}`
    )
  }

  if (/change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*after/i.test(t)) {
    return (
      '**Change of school or course**\n\n' +
      'A transfer or new admission is a new educational record. The old school session on the portal will not follow you automatically.\n\n' +
      `1. Confirm the **new** school appears on ${PORTAL}.\n` +
      '2. Ask the new campus NELFUND desk to upload / verify your record.\n' +
      '3. Do not open a second personal email just to force a new form.\n' +
      `4. Still blocked: ${ESUPPORT} with both old and new school names.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/verif(y|ication)\s*(mail|email)|email\s*(no|not|never)\s*(dey|come)|confirm\s*email/i.test(t)) {
    return (
      '**Verification email**\n\n' +
      `1. Register only on ${PORTAL}.\n` +
      '2. Check inbox **and spam** for the official verification mail.\n' +
      '3. Use the same email on **Forgot / Reset password** if you already created an account.\n' +
      '4. Do not pay anyone who offers to “verify” you.\n' +
      `5. Still missing after a few minutes: ${ESUPPORT} with the exact email you used.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/for\s+(my\s+)?(child|son|daughter|ward)|parent\s+|guardian\s+/i.test(t)) {
    return (
      '**Parent or guardian applying**\n\n' +
      'The student owns the NELFUND account. A parent can sit with the student, but the portal details must be the **student’s** NIN, JAMB, BVN and bank account.\n\n' +
      `1. Open ${PORTAL} together and register with the student’s email.\n` +
      '2. Do not create the account in the parent’s name unless that is the student’s legal record.\n' +
      '3. Never send OTP, password or NIN to a “helper” on WhatsApp.\n' +
      `4. Apply when the official window is open. Tickets: ${ESUPPORT}`
    )
  }

  if (/passport\s*(photo|photograph)|profile\s*picture|upload\s*photo/i.test(t)) {
    return (
      '**Passport photograph**\n\n' +
      'Use a clear, recent passport-style photo on a plain background.\n\n' +
      '1. Face fully visible, no heavy filter, file not password-protected.\n' +
      '2. Upload on the profile step, then continue the loan request.\n' +
      '3. If the portal rejects the file, try a smaller JPG/PNG and retry on the same account.\n' +
      `Login: ${LOGIN}. Still blocked: ${ESUPPORT}`
    )
  }

  if (
    /otp|one[- ]time(\s*password)?|send\s*(me\s*)?(the\s*)?code|give\s*(me\s*)?(your\s*)?(otp|pin)/i.test(t) ||
    (intent === 'scam-safety' && /otp|pin|password|code/i.test(t))
  ) {
    return (
      '**OTP / password safety**\n\n' +
      '**Never share OTP, password or NIN** with anyone who claims they can process NELFUND.\n\n' +
      '• Official staff will not ask you to pay or to forward a code on WhatsApp.\n' +
      `• Apply and log in only at ${PORTAL} / ${LOGIN}.\n` +
      `• Official site: ${SITE}. Tickets: ${ESUPPORT}.\n` +
      'If you already shared a code, change the password on the official login page and watch the account.'
    )
  }

  return null
}
