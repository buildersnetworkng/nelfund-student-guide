const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 160: documents, support, scam, window, interest, loan-vs-scholarship, Pidgin. No invented amounts. */
export function playbookHourly160(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /documents?\s*(i\s*)?(need|required)|wetin\s*i\s*(go|suppose)\s*carry|requirements?\s*(to\s*)?apply|wetin\s*una\s*need/i.test(
      t,
    ) ||
    intent === 'documents-needed'
  ) {
    return (
      '**Documents / what to have ready**\n\n' +
      'Have these ready before you start on the official portal:\n' +
      '- JAMB registration number and admission details\n' +
      '- NIN and BVN that belong to **you**\n' +
      '- Bank account in **your** name\n' +
      '- Institution / admission / matriculation details as the school uploaded them\n' +
      `- Upload only what ${PORTAL} asks for (often JAMB admission letter; school ID if requested).\n` +
      `Never send documents to an agent. Official site: ${SITE}`
    )
  }

  if (
    /contact\s*(support|nelfund)|esupport|customer\s*care|who\s*(do\s*i|to)\s*call|how\s*i\s*go\s*(yarn|reach)\s*(una|dem|support)|abeg\s*who\s*(i\s*)?go\s*call/i.test(
      t,
    ) ||
    intent === 'contact-support' ||
    intent === 'contact-lookup'
  ) {
    return (
      '**Official support only**\n\n' +
      `1. First try ${PORTAL} / ${LOGIN} and copy the exact error text.\n` +
      '2. Campus NELFUND desk if the problem is school data (missing record, school not listed).\n' +
      `3. Ticket: ${ESUPPORT}\n` +
      `4. Confirm contacts on ${SITE} — I will not invent a phone number.\n` +
      'This chat cannot see or change your application.'
    )
  }

  if (/scam|fake\s*portal|pay\s*(an?\s*)?agent|otp|buy\s*slot|whatsapp\s*(man|agent)|dem\s*ask\s*me\s*make\s*i\s*pay/i.test(t) || intent === 'scam-safety') {
    return (
      '**Scam / fake portal**\n\n' +
      `- Apply and log in only at ${PORTAL} and ${SITE}.\n` +
      '- Applying is **free**. Never pay an agent, buy a slot, or send OTP / BVN / NIN on WhatsApp.\n' +
      `- If someone copied the official look: stop, open ${PORTAL} yourself, then ${ESUPPORT}.`
    )
  }

  if (
    /application\s*(open|close|still\s*dey)|is\s*(the\s*)?(loan|portal|application)\s*(open|close)|deadline|window|dem\s*don\s*close|fit\s*still\s*apply|still\s*dey\s*open/i.test(
      t,
    ) ||
    intent === 'current-information' ||
    intent === 'deadline'
  ) {
    return (
      '**Application open / closed**\n\n' +
      'Windows change. Confirm live status only on the official pages — I will not invent a deadline.\n' +
      `Check ${SITE} and ${PORTAL}. If the window is open, apply there (not on a copycat site).`
    )
  }

  if (
    /loan\s*(or|vs|versus)\s*scholarship|na\s*(scholarship|grant)|free\s*money|dem\s*go\s*give\s*am\s*free|na\s*loan\s*or\s*scholarship/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan vs scholarship**\n\n' +
      'NELFUND is an **interest-free loan**, not a scholarship or grant. You repay later under official rules.\n' +
      'Official FAQ: repayment is due **2 years after NYSC**.\n' +
      `Confirm live wording on ${SITE}. I will not invent rates or jail terms.`
    )
  }

  if (/interest[-\s]*free|zero\s*interest|any\s*interest|dem\s*dey\s*charge\s*interest|e\s*get\s*interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'Official portal wording: the student loan is **interest-free** (no hidden charges on that official claim).\n' +
      'It is still a **loan** you repay after the official grace period (FAQ: 2 years after NYSC).\n' +
      `Confirm on ${SITE} / ${PORTAL}. I will not invent a percentage.`
    )
  }

  if (/how\s*(i\s*)?(go|fit|take)\s*(log\s*in|login)|abeg\s*how\s*(i\s*)?go\s*enter\s*(the\s*)?portal|i\s*wan\s*login/i.test(t) || intent === 'portal-login') {
    return (
      '**How to log in**\n\n' +
      `1. Open ${LOGIN} (or ${PORTAL} → sign in).\n` +
      '2. Use the **same email** you registered.\n' +
      '3. If the password fails, use the official reset on that same page — do not create a second account.\n' +
      `4. Still stuck (email already used): ${ESUPPORT} with a screenshot.`
    )
  }

  return null
}
