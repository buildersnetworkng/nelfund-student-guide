const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 175: email-already-used Pidgin, missing info, window closed, loan vs grant, scam pay, docs upload. */
export function playbookHourly175(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /email\s*(don|already|has)\s*(use|used|exist|dey)|mail\s*(already|don)\s*(use|used|exist)|this\s*email\s*(is\s*)?(already|don)\s*(in\s*use|used)|account\s*(already|don)\s*(exist|dey)/i.test(
      t,
    )
  ) {
    return (
      '**Email already used**\n\n' +
      `That address already has a NELFUND account. Do not open a second one.\n\n` +
      `1. Sign in at ${LOGIN} with the same email.\n` +
      `2. If you forgot the password: **Forgot / Reset password** on ${PORTAL}.\n` +
      `3. Still blocked: send a support message with a screenshot at ${ESUPPORT}.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /missing\s*(info|information|details)|information\s*(no|not|never)\s*(complete|dey|show)|profile\s*(no|not)\s*complete|incomplete\s*(profile|information)/i.test(
      t,
    )
  ) {
    return (
      '**Missing information**\n\n' +
      'The portal is asking for a field your school or your profile has not finished.\n\n' +
      '1. Open Profile and fill NIN, JAMB, BVN, bank in **your** name.\n' +
      '2. If the school name or matric is the gap, ask the campus NELFUND / ICT desk to upload the record.\n' +
      `3. Retry ${PORTAL}. Still the same: ${ESUPPORT} with a screenshot.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (
    /dem\s*don\s*close|window\s*(don|has)\s*close|application\s*(don|has)\s*close|can\s*i\s*still\s*apply|still\s*(dey\s*)?open\s*(for|now)|deadline\s*(pass|don\s*pass)/i.test(
      t,
    )
  ) {
    return (
      '**Application window**\n\n' +
      '**Yes — 2026/2027 is open on the official portal** (23 September 2026 – 31 December 2026).\n\n' +
      '• Your school must also open its session on Home.\n' +
      '• Re-enter BVN and bank when asked.\n' +
      `Confirm live dates only on ${PORTAL} and ${SITE}. I will not invent a private deadline.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(e|it)\s*(scholarship|grant)|wetin\s*be\s*(the\s*)?difference.{0,20}(loan|scholarship)/i.test(
      t,
    )
  ) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant, scholarship, or free money.\n\n' +
      `Official FAQ (${FAQ}): repayment is due **2 years after NYSC**.\n` +
      `Confirm on ${SITE}. Apply only at ${PORTAL}.`
    )
  }

  if (
    /pay\s*(me\s*)?(5k|5000|ten\s*k|10k|agent)|agent\s*(say|said|wan|want).{0,30}(pay|otp|nin)|whatsapp.{0,20}(pay|otp)|make\s*i\s*pay\s*(before|first)/i.test(
      t,
    )
  ) {
    return (
      '**Scam — do not pay**\n\n' +
      'Applying is **free**. Nobody on WhatsApp should collect money, OTP, or NIN to “process” NELFUND.\n\n' +
      `• Official only: ${SITE} · ${PORTAL} · ${LOGIN}\n` +
      `• Report / ask official support: ${ESUPPORT}\n` +
      'If you already paid an agent, stop and use the official portal with your own email.'
    )
  }

  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry|bring)|which\s*(file|document|paper)\s*(to\s*)?upload|upload\s*(wetin|what)/i.test(
      t,
    )
  ) {
    return (
      '**What to upload**\n\n' +
      'Typical portal asks (confirm live form):\n' +
      '• JAMB admission letter\n' +
      '• NIN and BVN (typed, not a paid “agent form”)\n' +
      '• Bank account in **your** name\n' +
      '• Matric number when issued; school ID if the form asks\n\n' +
      `Upload only on ${PORTAL}. Never send files to WhatsApp.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (intent === 'email-already-used') {
    return (
      '**Email already used**\n\n' +
      `Sign in at ${LOGIN}. Reset password on the same email. Do not create a second account. Support: ${ESUPPORT}`
    )
  }

  return null
}
