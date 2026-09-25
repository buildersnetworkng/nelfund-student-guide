const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 172: private school, level, upkeep amount, Pidgin closed window, ticket, forget password. */
export function playbookHourly172(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/private\s*(uni|university|school|poly)|fit\s*apply.{0,20}private/i.test(t)) {
    return (
      '**Private school eligibility**\n\n' +
      'NELFUND on this cycle is for eligible students in **public** tertiary institutions.\n' +
      'A **private** university or private polytechnic is not the same list.\n\n' +
      `1. Search the exact school name on ${PORTAL}.\n` +
      `2. If it does not appear, confirm official eligibility on ${SITE} — do not pay an agent for a “private slot.”\n` +
      `3. Tickets: ${ESUPPORT}`
    )
  }

  if (/\b(100|200|300|400|500)\s*(l|level)\b|which\s*level\s*(fit|can)\s*apply|fresher|newly\s*admitted/i.test(t)) {
    return (
      '**Which level can apply**\n\n' +
      'Eligibility is about a **public** institution, admission, and a school session that is open on the portal — not a WhatsApp “only 100L / only 200L” rumour.\n\n' +
      `1. Confirm your school and session on ${PORTAL}.\n` +
      '2. Freshers still need JAMB / admission evidence the form asks for.\n' +
      `3. Confirm live rules on ${SITE} and ${FAQ}. I will not invent a cut-off level.`
    )
  }

  if (/how\s*much.{0,20}upkeep|upkeep.{0,20}(how\s*much|amount|stipend)|wetin\s*be\s*upkeep|what\s*(is|be)\s*upkeep/i.test(t)) {
    return (
      '**Upkeep**\n\n' +
      'Upkeep is optional **living support** paid **to your bank account** if you tick it in the same loan session.\n' +
      'It is not school fees. Institutional charges go **to the school**.\n\n' +
      `Confirm the live monthly figure only on ${PORTAL} (the portal display can change). I will not invent an amount.\n` +
      `Official site: ${SITE}. Login: ${LOGIN}`
    )
  }

  if (/dem\s*don\s*close|don\s*close\s*(application|portal|window)|still\s*(dey\s*)?open|application\s*(don\s*)?(open|close)/i.test(t)) {
    return (
      '**Is the window open?**\n\n' +
      'Treat social-media “dem don close” as unofficial.\n\n' +
      `Confirm live open/closed dates only on ${PORTAL} and ${SITE}.\n` +
      `This guide will not invent a closing date.\nLogin: ${LOGIN}`
    )
  }

  if (/open\s*(a\s*)?ticket|how\s*i\s*go\s*(open|yarn|reach).{0,20}(ticket|support|esupport)|esupport|help\s*desk/i.test(t)) {
    return (
      '**Official ticket**\n\n' +
      `Create a ticket only at ${ESUPPORT}.\n` +
      'Attach a clear screenshot of the portal error or status.\n' +
      'Do not pay anyone who offers to “open a ticket” for you.\n' +
      `Login first: ${LOGIN}`
    )
  }

  if (/i\s*forget\s*(my\s*)?password|forget\s*(my\s*)?password|no\s*remember\s*(my\s*)?password/i.test(t) || intent === 'password-reset') {
    return (
      '**Forgot / forget password**\n\n' +
      `1. Open ${LOGIN} → Forgot / Reset password.\n` +
      '2. Use the **same email** already on the account.\n' +
      '3. Check inbox and spam.\n' +
      '4. Do not create a second account.\n' +
      `5. No mail: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/school\s*(no|not|never)\s*(dey|show|list)|no\s*dey\s*(for\s*)?(the\s*)?list|not\s*listed/i.test(t) || intent === 'school-not-found') {
    return (
      '**School not on the list**\n\n' +
      'Usually the institution has not finished uploading your record, or the name you typed is not the official portal name.\n\n' +
      '1. Try the exact official school name.\n' +
      '2. Confirm you attend a **public** institution on this cycle.\n' +
      '3. Ask the campus NELFUND desk to upload your cohort.\n' +
      `4. Retry on ${PORTAL}. Ticket: ${ESUPPORT}`
    )
  }

  if (/someone\s*(ask|wan|want).{0,20}(otp|pin|password)|ask\s*me\s*for\s*(otp|pin)|send\s*(the\s*)?(otp|code)/i.test(t)) {
    return (
      '**OTP / agent safety**\n\n' +
      '**Never share OTP, password or NIN.** Official staff will not collect a fee on WhatsApp.\n\n' +
      `Apply and log in only at ${PORTAL} / ${LOGIN}.\n` +
      `Official site: ${SITE}. Tickets: ${ESUPPORT}.`
    )
  }

  return null
}
