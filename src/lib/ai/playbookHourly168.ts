const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 168: parent/guardian, returning email, NYSC done, JAMB Pidgin, window Pidgin, pending meaning. */
export function playbookHourly168(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /for\s+(my\s+)?(child|son|daughter|ward)|parent\s+(want|wan|dey)|guardian\s+(apply|ask)|apply\s+for\s+(my\s+)?( pikin|pikin|child)/i.test(
      t,
    )
  ) {
    return (
      '**Parent / guardian applying for a student**\n\n' +
      'The portal profile belongs to the **student** (their NIN, BVN, JAMB number, and school record).\n\n' +
      `1. The student signs up and logs in at ${LOGIN}.\n` +
      '2. You can sit with them, but do not create a second account in your own email.\n' +
      '3. Never send OTP, password, NIN or BVN to a WhatsApp helper.\n' +
      `Official site: ${SITE}. Stuck: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (
    /last\s*year\s*(email|account|login)|old\s*email\s*(from\s*)?(last|previous)|returning\s*student|I\s*(don|have)\s*apply\s*(before|last)/i.test(
      t,
    ) ||
    intent === 'reapplication'
  ) {
    return (
      '**Returning applicant / last-year email**\n\n' +
      `Use the **same email** at ${LOGIN}. Do not open a second profile.\n` +
      '1. Forgot password if you lost access — reset only on the official portal.\n' +
      '2. Confirm the school has uploaded this session’s record before you submit again.\n' +
      `3. One student, one account. Ticket if the old email is locked: ${ESUPPORT}.`
    )
  }

  if (/already\s*(finish|finished|done)\s*nysc|serving\s*nysc|I\s*(don|have)\s*(finish|complete)\s*nysc/i.test(t)) {
    return (
      '**NYSC already done or serving**\n\n' +
      'NELFUND is a **student loan** for eligible students still in a listed public institution.\n' +
      'If you have already completed NYSC, this chat will not invent a new graduate window.\n' +
      `Confirm any live wording on ${SITE} and ${PORTAL}. Official FAQ: repayment is due **2 years after NYSC**.\n` +
      `Questions about an existing loan: ${LOGIN} then ${ESUPPORT}.`
    )
  }

  if (
    /jamb\s*(no|number)?\s*(no|not|never)\s*(gree|dey|work|verify)|invalid\s*(jamb|utme)|utme\s*(no|number)\s*(wrong|invalid)/i.test(
      t,
    ) ||
    intent === 'jamb-verification'
  ) {
    return (
      '**JAMB / UTME number will not verify**\n\n' +
      'Type the number **exactly as on your JAMB slip** — no extra space or old session mix-up.\n' +
      '1. The school must also have uploaded you against that same JAMB number.\n' +
      `2. Retry on ${PORTAL} after the campus desk confirms the upload.\n` +
      `3. Still failing: ${ESUPPORT} with the exact red banner (no invented JAMB rule).`
    )
  }

  if (
    /dem\s*don\s*close|window\s*(don|has)\s*close|still\s*(dey\s*)?open\s*(now|so)|application\s*(still\s*)?(open|close)|when\s*(dem|they)\s*(go\s*)?open/i.test(
      t,
    )
  ) {
    return (
      '**Is the application open?**\n\n' +
      'Windows **change by cycle**. I will not invent a close date.\n' +
      `Check the live banner on ${SITE} and try ${PORTAL}.\n` +
      `Login: ${LOGIN}. If the form is closed, wait for an official announcement — not a WhatsApp broadcast.`
    )
  }

  if (/wetin\s*(be|mean)\s*pending|pending\s*(no|not|never)\s*(move|change)|status\s*(still\s*)?pending/i.test(t)) {
    return (
      '**Pending on the portal**\n\n' +
      'Pending means submitted and still processing — **not** declined.\n' +
      `Sign in at ${LOGIN} → Loans → View details.\n` +
      'I cannot move the queue from this chat. Official FAQ talks about disbursement after **approval**, not while pending.\n' +
      `No movement after a long wait: campus desk, then ${ESUPPORT} with a screenshot.`
    )
  }

  if (/school\s+uploaded|uploaded\s+my\s+data|has\s+my\s+school\s+upload/i.test(t)) {
    return (
      '**Has my school uploaded my data?**\n\n' +
      'Missing information usually means the campus has not uploaded you yet (or the name / JAMB number does not match).\n\n' +
      '1. Ask the campus NELFUND / ICT / Registry desk to upload or refresh your record.\n' +
      `2. Retry ${PORTAL} after they confirm.\n` +
      '3. Do not open a second account.\n' +
      `Still Missing information: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/polytechnic|poly\b|monotechnic/i.test(t)) {
    return (
      '**Polytechnic / monotechnic**\n\n' +
      'Eligibility in this guide follows official language: **full-time** students in **public tertiary** institutions (universities, polytechnics, colleges of education) that appear on the portal list.\n\n' +
      `Confirm your school is listed on ${PORTAL}. I will not invent a private-poly exception.\n` +
      `If the school is missing: campus desk, then ${ESUPPORT}.`
    )
  }

  if (/fresher|freshers|newly\s+admitted|just\s+(got|gain)\s+admission/i.test(t)) {
    return (
      '**Fresher / newly admitted / 100-level**\n\n' +
      'Newly admitted students can be eligible once the school uploads the record. Matriculation number is used when the school has issued it.\n\n' +
      `1. Confirm the school appears on ${PORTAL}.\n` +
      '2. Use your JAMB number if matric is not out yet — only if the portal accepts it.\n' +
      `3. Campus desk if Missing information, then ${ESUPPORT}.`
    )
  }

  if (/do\s+not\s+have\s+matric|no\s+matric|matric(ulation)?\s+number\s+(yet|no|not)/i.test(t)) {
    return (
      '**No matriculation number yet**\n\n' +
      'The school must still upload you. Use the identifier the portal asks for (often JAMB) until matric is issued.\n\n' +
      'Ask ICT / Registry / the campus NELFUND desk to complete the upload.\n' +
      `Retry ${PORTAL}. Ticket if it stays blocked: ${ESUPPORT}.`
    )
  }

  return null
}
