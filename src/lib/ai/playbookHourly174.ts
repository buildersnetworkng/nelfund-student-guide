const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 174: GSI mandate, parent apply, change email, vocational, hostel vs upkeep, Pidgin reset. */
export function playbookHourly174(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /gsi\s*(mandate|consent)|accept\s*(the\s*)?(terms|gsi)|what\s*(is|be)\s*gsi|mandate\s*(before|before\s*i)\s*submit/i.test(
      t,
    )
  ) {
    return (
      '**Terms & GSI Mandate**\n\n' +
      'Before submit, the portal asks you to accept **Terms** and a **GSI Mandate** (bank debit instruction used later for repayment).\n\n' +
      '1. Read the live wording on the portal — do not accept on a WhatsApp link.\n' +
      '2. Use an account **in your name** that you control.\n' +
      '3. Official FAQ: the loan is **interest-free**; repayment is due **2 years after NYSC** — confirm on ' +
      FAQ +
      '.\n' +
      'I will not invent a deduction percentage or jail term.\n' +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /for\s+(my\s+)?(child|son|daughter|ward)|parent\s+(apply|application)|guardian\s+(apply|application)|can\s*(i|my\s*parent)\s*apply\s*for\s*(my\s*)?(child|son)/i.test(
      t,
    )
  ) {
    return (
      '**Parent / guardian applying**\n\n' +
      'The student loan account is for the **student**. A parent can sit with the student, but details (NIN, BVN, JAMB, bank) must belong to the student.\n\n' +
      `1. Open ${PORTAL} together. Do not create a parent-only email as if it were the student.\n` +
      '2. Never share OTP or password with an agent who says they will "process" it.\n' +
      `3. Official FAQ: **no guarantor** is required — confirm on ${FAQ}.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/change\s*(my\s*)?email|new\s*email\s*(address|for)|email\s*(wrong|no\s*dey\s*work)|wan(t)?\s*change\s*mail/i.test(t)) {
    return (
      '**Change email**\n\n' +
      `Stay on the first email at ${LOGIN}.\n` +
      '1. Use **Forgot / Reset password** if you cannot sign in.\n' +
      '2. Do not open a second student account just to attach a new mail — that creates duplicate records.\n' +
      `3. Portal will not let you edit email: ${ESUPPORT} with a screenshot and both addresses.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /vocational|skills?\s*acquisition|college\s*of\s*education|\bcoe\b|nce\s*student|monotechnic/i.test(
      t,
    ) ||
    (intent === 'eligibility' && /vocational|nce|coe|mono/i.test(t))
  ) {
    return (
      '**College of education / vocational / monotechnic**\n\n' +
      'NELFUND is for eligible students in **public** tertiary institutions on the live portal list — including public universities, polytechnics, and colleges of education when that school is uploaded for the cycle.\n\n' +
      `1. Search the **exact official school name** on ${PORTAL}.\n` +
      '2. If **No Result found**, ask the campus NELFUND desk to upload student records.\n' +
      '3. Private vocational centres are not the same as a public institution on the list.\n' +
      `Confirm on ${SITE}. Tickets: ${ESUPPORT}`
    )
  }

  if (/hostel|accommodation|feeding|transport\s*money|upkeep\s*(cover|include|for)\s*(hostel|rent|feeding)/i.test(t)) {
    return (
      '**Upkeep vs hostel / feeding**\n\n' +
      '**Institutional charges** = school fees paid **to the school**.\n' +
      '**Upkeep** = optional living support paid **to your account** if you tick it.\n\n' +
      'Upkeep is not a separate hostel booking on this guide. The portal may show a monthly stipend figure — confirm the live number on the application screen.\n' +
      'I will not invent a hostel or feeding amount.\n' +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /forget\s*(my\s*)?password|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(no|not|never)\s*(dey|work)|i\s*no\s*remember\s*(my\s*)?(password|pass)/i.test(
      t,
    )
  ) {
    return (
      '**Forgot password**\n\n' +
      `1. Open ${LOGIN}.\n` +
      '2. Use **Forgot / Reset password** on the **same email** you registered.\n' +
      '3. Complete the OTP only on that email or number — never send it to WhatsApp "agents".\n' +
      '4. Do not create a second account.\n' +
      `Still blocked: ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (/how\s*much.{0,20}(repay|pay\s*back)|percentage.{0,16}(salary|repay)|10\s*%|ten\s*percent/i.test(t)) {
    return (
      '**Repayment amount**\n\n' +
      `Official FAQ (${FAQ}): the loan is due **2 years after NYSC**. The portal describes it as **interest-free**.\n` +
      'I will not invent a salary percentage, monthly figure, or penalty.\n' +
      `Read the live GSI / Terms text on ${PORTAL} and ${SITE} before you accept.`
    )
  }

  return null
}
