const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 180: name mismatch, no admission letter, who gets paid, cancel/reapply, forgot email, Pidgin support/OTP. */
export function playbookHourly180(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /name\s*(no|not|never)\s*(match|the\s*same|correct)|mismatch|nin.{0,20}(bvn|jamb).{0,20}(name|different)|different\s*name|name\s*(for|on)\s*(nin|bvn|jamb)/i.test(
      t,
    )
  ) {
    return (
      '**Name must match across records**\n\n' +
      'The portal checks that **NIN, BVN, JAMB / admission, and bank** use the same legal name.\n' +
      '1. Compare the spellings on each slip yourself.\n' +
      '2. Fix NIN at NIMC, BVN at your bank, JAMB at a JAMB office \u2014 this chat cannot change those databases.\n' +
      '3. After they match, retry Profile on the portal. Do not open a second account.\n\n' +
      `Portal: ${PORTAL}\nStill blocked after the names match: ${ESUPPORT} with screenshot.`
    )
  }

  if (
    /no\s*(admission|offer)\s*letter|i\s*(no|don'?t|do not)\s*(get|have)\s*(admission|offer)|admission\s*letter\s*(lost|missing|required)/i.test(
      t,
    )
  ) {
    return (
      '**Admission letter**\n\n' +
      'A clear **admission letter** (JAMB admission letter is usually accepted for fresh students) is often required on the upload step.\n' +
      '\u2022 JPEG or PDF, readable names and school.\n' +
      '\u2022 Student ID / fee invoice can help but do not replace the letter when the portal says it is required.\n' +
      '\u2022 If you have not been admitted yet, finish admission first \u2014 the loan form follows the school record.\n\n' +
      `Upload only on ${PORTAL}.`
    )
  }

  if (
    /who\s*(go|will|does)\s*(dem\s*)?(pay|collect)|money\s*(go|enter)\s*(school|my\s*account)|school\s*(go\s*)?collect|who\s*receives?\s*(the\s*)?(money|loan|fees)/i.test(
      t,
    )
  ) {
    return (
      '**Who gets paid**\n\n' +
      '\u2022 **Institutional charges / school fees** \u2192 paid **to the school**, not to you.\n' +
      '\u2022 **Upkeep** (only if you selected it on the same application) \u2192 paid **to your BVN-matched account**.\n' +
      'You cannot take the school-fee part in cash from this chat or from an agent.\n\n' +
      `Check live status after login: ${LOGIN} \u2192 \u2630 \u2192 Loans\nFAQ: ${FAQ}`
    )
  }

  if (
    /cancel.{0,20}(again|re-?apply|apply)|i\s*(don|have)\s*cancel|fit\s*i\s*apply\s*again|reapply|second\s*application/i.test(
      t,
    )
  ) {
    return (
      '**Cancel and apply again**\n\n' +
      'Cancelling a **pending** application that has **not** been disbursed can usually be done on the portal; it cannot be undone from this chat.\n' +
      'Cancelling institutional charges also cancels upkeep on that request.\n' +
      'If nothing was released, you may start a new request in the same open window after the cancel succeeds.\n' +
      'If money already went to the school or to you, do not invent a reverse \u2014 use official support.\n\n' +
      `Login: ${LOGIN} \u2192 \u2630 \u2192 Loans\nTicket: ${ESUPPORT}`
    )
  }

  if (
    /forgot\s*(my\s*)?(email|mail|username)|no\s*remember\s*(the\s*)?(email|mail)|which\s*mail\s*i\s*use/i.test(
      t,
    )
  ) {
    return (
      '**Forgot the email on the account**\n\n' +
      'Use the official login page and the **Forgot password** / recovery option with the phone or email you registered.\n' +
      'Do not create a second account with a new mail if the first one already exists \u2014 that splits your record.\n' +
      'If recovery fails, open a support ticket with your NIN (do not paste NIN in this chat) and a screenshot.\n\n' +
      `Login: ${LOGIN}\nTicket: ${ESUPPORT}`
    )
  }

  if (
    /send\s*(me\s*)?(the\s*)?otp|otp\s*(code|pin)|give\s*(am|them|agent)\s*(the\s*)?otp|wetin\s*(be|mean)\s*otp/i.test(
      t,
    ) ||
    intent === 'scam-safety'
  ) {
    if (/otp|agent|whatsapp|telegram|pay/i.test(t) || intent === 'scam-safety') {
      return (
        '**OTP and agents**\n\n' +
        'An OTP is a one-time code the official portal / NIMC / bank sends **to you**.\n' +
        '\u2022 Never share OTP, password, NIN, or BVN with a WhatsApp, Telegram, or \u201cagent\u201d.\n' +
        '\u2022 Never pay anyone to process NELFUND.\n' +
        `\u2022 Apply only on ${PORTAL}. Tickets: ${ESUPPORT}. Site: ${SITE}`
      )
    }
  }

  if (
    /how\s*(i|to)\s*(go\s*)?(reach|call|message|contact)\s*(una|nelfund|support)|una\s*number|customer\s*care|helpline|abeg\s*who\s*(i\s*)?go\s*call/i.test(
      t,
    ) ||
    intent === 'contact-support'
  ) {
    return (
      '**Official support**\n\n' +
      `1. Login and screenshot the exact error: ${LOGIN}\n` +
      `2. Open a ticket: ${ESUPPORT}\n` +
      `3. FAQ: ${FAQ}\n` +
      '4. School-upload problems: campus NELFUND / ICT / Registry desk.\n\n' +
      'Phone numbers from social media are not official. Do not send OTP there.'
    )
  }

  return null
}
