const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 168: application window, grant vs loan, telegram/WhatsApp scam, email-used Pidgin, support phone. */
export function playbookHourly168(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /still\s*(open|dey\s*open)|dem\s*don\s*close|application\s*(still\s*)?(open|close|closed)|can\s*i\s*still\s*apply|window\s*(open|close)|deadline|last\s*day\s*to\s*apply|when\s*(e|it)\s*(go|will)\s*close/i.test(
      t,
    )
  ) {
    return (
      '**Application open or closed**\n\n' +
      'Windows change. Confirm live open/closed status only on the official pages.\n\n' +
      `1. Open ${PORTAL} (login: ${LOGIN}) and ${SITE}.\n` +
      '2. If the Request loan button is available and your school record is uploaded, complete the form.\n' +
      '3. If the window is closed, wait for an official announcement — do not pay anyone to “keep a slot”.\n' +
      'I will not invent a private closing date.'
    )
  }

  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|wetin\s*be\s*(the\s*)?difference|is\s*(this|dis|it)\s*(a\s*)?(grant|scholarship)|free\s*money/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant, scholarship, or free money.\n\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm on ${SITE}.\n` +
      'I will not invent rates, percentages, or jail terms.\n' +
      `Apply only at ${PORTAL}.`
    )
  }

  if (
    /telegram|whatsapp\s*(link|group|man|agent|guy)|pay\s*(am|them|agent)|otp|never\s*share|fake\s*portal|scam/i.test(t) ||
    intent === 'scam-safety'
  ) {
    return (
      '**Stay safe**\n\n' +
      '- Never pay an agent, Telegram admin, or WhatsApp “officer”.\n' +
      '- Never share OTP, password, NIN, or BVN outside the official portal.\n' +
      `- Official only: ${SITE} · ${PORTAL} · ${LOGIN} · ${ESUPPORT}\n` +
      'If someone copied the portal look, close the tab and use the links above.'
    )
  }

  if (
    /email\s*(don|already|has)\s*(dey|used|exist)|this\s*mail\s*(don|already)\s*(dey|used)|old\s*email|i\s*use(d)?\s*this\s*email\s*before/i.test(
      t,
    ) ||
    intent === 'email-already-used'
  ) {
    return (
      '**Email already used**\n\n' +
      `1. Sign in at ${LOGIN} with that same email.\n` +
      `2. If you forgot the password: Forgot / Reset on ${PORTAL} for that email.\n` +
      '3. Do not invent a second Gmail just to force a new form.\n' +
      `4. Still blocked: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/interest\s*dey|does\s*(e|it|am)\s*get\s*interest|zero\s*interest|interest[-\s]*free|how\s*much\s*interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'Official portal wording: the student loan is **interest-free** (no hidden charges).\n' +
      `Confirm current wording on ${SITE} and ${PORTAL}. I will not invent a rate.`
    )
  }

  if (/official\s*(phone|number|whatsapp|hotline)|nelfund\s*(phone|number)|how\s*i\s*go\s*(yarn|call|reach)\s*(them|una|support)/i.test(t)) {
    return (
      '**Official support**\n\n' +
      `I will not invent a private phone or WhatsApp line.\n` +
      `- Website: ${SITE}\n` +
      `- Portal: ${PORTAL}\n` +
      `- Login: ${LOGIN}\n` +
      `- Tickets: ${ESUPPORT}\n` +
      'Use a campus NELFUND desk for school-upload issues.'
    )
  }

  if (/how\s*(to|do\s*i|i\s*go)\s*apply.{0,50}(loan|upkeep)|i\s*meant.{0,30}(loan|upkeep)|loan\s+and\s+upkeep/i.test(t)) {
    return (
      '**Apply for the loan and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. When the official window is open, request the student loan.\n' +
      '4. Tick **upkeep** in the **same session** if you want optional living support (paid to you).\n' +
      '5. Institutional charges still go **to the school**.\n' +
      `Confirm figures only on ${PORTAL}. Stuck: ${ESUPPORT}.`
    )
  }

  return null
}
