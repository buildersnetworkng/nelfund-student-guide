const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 164: change of course, NYSC already done, email verify, vocational, Pidgin login. No invented amounts. */
export function playbookHourly164(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*after|i\s*change\s*course/i.test(t)) {
    return (
      '**Change of school / course**\n\n' +
      'The portal must match the record your **current** institution has uploaded (name, JAMB, matric).\n' +
      `1. Ask the new campus NELFUND desk to upload the current record.\n` +
      `2. Sign in with the **same** email at ${LOGIN} — do not open a second account.\n` +
      `3. If the old school is still showing: ${ESUPPORT} with a screenshot.\n` +
      `Confirm live status only on ${PORTAL}.`
    )
  }

  if (/already\s*(finish|finished|done)\s*nysc|i\s*(don|have)\s*(finish|serve)|serving\s*nysc\s*(now|already)|after\s*nysc\s*(can\s*i\s*)?apply/i.test(t)) {
    return (
      '**NYSC already done / serving**\n\n' +
      'NELFUND is a student loan for eligible students in public tertiary institutions. Official FAQ: repayment is due **2 years after NYSC**.\n' +
      'If you have already completed the programme the loan was meant to fund, confirm on the official site whether a new application is still accepted for your case — I will not invent extra categories.\n' +
      `Official: ${SITE} · portal ${PORTAL}`
    )
  }

  if (/verif(y|ication)\s*(mail|email)|email\s*(no|not|never)\s*(dey|come|arrive)|link\s*(no|not)\s*(dey|come)|confirm\s*email/i.test(t)) {
    return (
      '**Email verification**\n\n' +
      `1. Use the same inbox you typed on ${PORTAL}. Check spam / promotions.\n` +
      '2. Wait a few minutes, then request the link again from the official page only.\n' +
      '3. Do not open a second account with another email unless support says so.\n' +
      `4. Still nothing: ${ESUPPORT} with the exact email you used.`
    )
  }

  if (/vocational|skills?\s*school|monotechnic/i.test(t)) {
    return (
      '**Vocational / skills institutions**\n\n' +
      'Official FAQ includes public universities, polytechnics, colleges of education, and vocational / skills institutions when they are on the list and the record is uploaded.\n' +
      `Confirm your school appears on ${PORTAL}. If it does not, the campus desk must upload — I will not invent a private list.`
    )
  }

  if (/how\s*(i\s*take|i\s*go)\s*(log\s*in|login|sign\s*in)|abeg\s*(help\s*)?(me\s*)?(log\s*in|login)|i\s*no\s*fit\s*(log\s*in|login|enter)/i.test(t)) {
    return (
      '**How to log in**\n\n' +
      `1. Open ${LOGIN}\n` +
      '2. Enter the email and password you used to register.\n' +
      '3. Read the exact error if it fails.\n' +
      `4. Forgot password: reset on ${PORTAL}.\n` +
      `5. Still stuck: ${ESUPPORT} with a screenshot. Do not pay an agent.`
    )
  }

  if (/how\s+to\s+apply.+meant.+(loan|upkeep)|apply\s+(then\s+)?(for\s+)?(the\s+)?loan\s+and\s+upkeep/i.test(t) || intent === 'how-to-apply' && /upkeep|loan\s+and/i.test(t)) {
    return (
      '**Apply for institutional charges + optional upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. Request the student loan when the official window is open.\n' +
      '4. Tick **upkeep** in the **same** session if you want living support. Institutional charges still go to the school; upkeep (if ticked) goes to you.\n' +
      `5. Confirm amounts only on the portal. Stuck: campus desk, then ${ESUPPORT}.`
    )
  }

  return null
}
