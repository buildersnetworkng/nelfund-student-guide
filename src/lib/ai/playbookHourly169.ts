const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 169: private-school eligibility, password Pidgin, missing-info, repayment, school-upload. */
export function playbookHourly169(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /private\s*(uni|university|school|poly)|na\s*private\s*(school|uni)|my\s*school\s*na\s*private/i.test(t)
  ) {
    return (
      '**Private schools**\n\n' +
      'Official wording: NELFUND is for eligible students in **public** tertiary institutions.\n' +
      'A **private** university, polytechnic, or college is generally **not** on this scheme.\n\n' +
      `Confirm the live institution list only on ${PORTAL}.\n` +
      `Do not pay anyone who claims they can \u201cadd\u201d a private school.\n` +
      `Tickets: ${ESUPPORT}`
    )
  }

  if (
    /forgot?\s*(my\s*)?(pass|password)|reset\s*(my\s*)?(pass|password)|i\s*no\s*(remember| sabi)\s*(my\s*)?(pass|password)|pass\s*no\s*dey\s*work|password\s*(no|not)\s*(dey\s*)?work/i.test(
      t,
    ) ||
    intent === 'password-reset'
  ) {
    return (
      '**Password reset**\n\n' +
      `1. Open ${LOGIN}.\n` +
      `2. Use **Forgot / Reset password** for the **same email** you registered.\n` +
      '3. Check inbox and spam for the official reset mail.\n' +
      '4. Do not create a second email just to force a new form.\n' +
      `5. Still blocked: ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /missing\s*information|information\s*(is\s*)?missing|red\s*banner|complete\s*(your\s*)?(profile|information)|upload\s*(no|not)\s*complete/i.test(
      t,
    ) ||
    intent === 'missing-information'
  ) {
    return (
      '**Missing information**\n\n' +
      'The portal is asking for a field your school or your profile has not completed.\n\n' +
      '1. Read the **exact red banner** (admission letter, JAMB, NIN, BVN, bank, institution).\n' +
      '2. Fix what you can on the profile at ' +
      LOGIN +
      '.\n' +
      '3. If the school record is the gap, visit the campus NELFUND / ICT desk so they **upload** you.\n' +
      '4. Do not open a second account.\n' +
      `Ticket if still stuck: ${ESUPPORT}`
    )
  }

  if (
    /when\s*(i|we)\s*(go|will)\s*pay\s*back|how\s*(to|i\s*go)\s*repay|repayment\s*start|after\s*nysc|2\s*years?\s*after/i.test(
      t,
    ) ||
    intent === 'repayment'
  ) {
    return (
      '**Repayment**\n\n' +
      'Official FAQ: repayment is due **2 years after NYSC**.\n' +
      'NELFUND is an **interest-free loan**, not a grant.\n\n' +
      `Confirm current wording only on ${SITE} and ${PORTAL}.\n` +
      'I will not invent rates, monthly amounts, or jail terms.\n' +
      `Support tickets: ${ESUPPORT}`
    )
  }

  if (
    /school\s*(don|has|have)\s*(upload|uploaded)|how\s*(i|to)\s*know.{0,30}upload|uploaded\s*(my\s*)?(data|record|name)/i.test(
      t,
    ) ||
    intent === 'institution-verification'
  ) {
    return (
      '**School upload**\n\n' +
      `Sign in at ${LOGIN} and try **Verify educational information** / institution search.\n` +
      '- If your name and programme appear, the school record is on the portal.\n' +
      '- If you see **No Result found**, the campus desk still needs to upload you.\n' +
      'This chat cannot push the school file for you.\n' +
      `Stuck after the desk visit: ${ESUPPORT}`
    )
  }

  return null
}
