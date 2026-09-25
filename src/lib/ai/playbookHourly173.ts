const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 173: session closed, how-long pending, refund already paid, phone change, Pidgin charges, two applications. */
export function playbookHourly173(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /institution.{0,40}session|session\s*(not\s*)?(open|opened|close|closed)|school\s*(never|no|not)\s*(open|start).{0,20}session|my\s*school\s*(session|portal)\s*(no|not|never)/i.test(
      t,
    ) ||
    (intent === 'institution-verification' && /session/i.test(t))
  ) {
    return (
      '**Institution session not open**\n\n' +
      'The national window can be open while **your school session** on the portal is still closed.\n\n' +
      '1. Read the exact Home notice after you sign in.\n' +
      '2. Ask the campus NELFUND / ICT / Registry desk to open or upload the session for your cohort.\n' +
      '3. Do not create a second account while you wait.\n' +
      `4. Confirm live status on ${PORTAL}. Ticket if the school says it is uploaded and Home is unchanged: ${ESUPPORT}`
    )
  }

  if (
    /how\s*long.{0,20}(pending|take|wait)|pending.{0,20}(weeks|month|since)|since\s*(january|february|march|april|may|june|july|august|september|october|november|december|\d+)/i.test(
      t,
    )
  ) {
    return (
      '**How long can pending last?**\n\n' +
      'Pending means the request is submitted and still processing — it is not the same as declined.\n\n' +
      `1. Sign in at ${LOGIN} and open Institutional / Upkeep details.\n` +
      '2. Official FAQ language: disbursement is discussed as within **30 days of approval** of a successful application — pending is *before* that approval step.\n' +
      '3. I will not invent your personal pay date.\n' +
      `4. Unchanged for a long stretch after approval wording appears: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (/refund|already\s*(pay|paid)\s*(school\s*)?fees|school\s*(don|has)\s*(collect|collected)/i.test(t) || intent === 'refund') {
    return (
      '**Fees already paid / refund**\n\n' +
      'Institutional charges go **to the school**, not through this chat.\n\n' +
      '1. Keep your school receipt.\n' +
      '2. Ask the campus bursary / NELFUND desk how they treat students who already paid for the same session.\n' +
      `3. Raise a portal ticket at ${ESUPPORT} with status screenshots if the school asks NELFUND to look at it.\n` +
      `I will not invent a refund amount. Official site: ${SITE}`
    )
  }

  if (/change\s*(my\s*)?(phone|number|gsm)|phone\s*number\s*(wrong|no\s*dey)|new\s*phone\s*number/i.test(t)) {
    return (
      '**Change phone number**\n\n' +
      `Update contact details only on ${LOGIN} after you sign in.\n` +
      '1. Do not create a second email just to attach a new number.\n' +
      '2. OTP for login or reset must stay on the number/email you control — never forward it.\n' +
      `3. Portal will not let you edit a field: ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /wetin\s*be\s*(institutional\s*)?charg|institutional\s*chargers|na\s*school\s*fees|wetin\s*be\s*the\s*school\s*fees\s*part/i.test(
      t,
    )
  ) {
    return (
      '**Institutional charges (school fees part)**\n\n' +
      '**Institutional charges** are the school-fees loan. NELFUND pays that part **to the school**.\n' +
      '**Upkeep** is optional living support paid **to your account** if you tick it in the same session.\n\n' +
      `Confirm the live figure only on ${PORTAL}. I will not invent an amount.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/two\s*(loan|application)|apply\s*(am\s*)?(two|2)\s*times|duplicate\s*(loan|application)|second\s*application/i.test(t)) {
    return (
      '**Two applications / duplicate request**\n\n' +
      'Use **one** student account. A second email usually makes support harder, not faster.\n\n' +
      `1. Sign in at ${LOGIN} with the first email.\n` +
      '2. Read Institutional and Upkeep tabs — pending is normal while it processes.\n' +
      '3. Do not cancel unless you applied by mistake and understand the portal warning (cancelling institutional can cancel upkeep).\n' +
      `4. Duplicate mess: ${ESUPPORT} with both emails if you already opened two.`
    )
  }

  if (/na\s*free\s*money|dem\s*go\s*collect\s*(am\s*)?back|scholarship\s*or\s*loan|loan\s*abi\s*scholarship/i.test(t)) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free student loan**, not a grant and not free money.\n' +
      `Repayment follows official rules after study / NYSC — confirm on ${SITE}. I will not invent a rate.\n` +
      `Apply only on ${PORTAL}.`
    )
  }

  return null
}
