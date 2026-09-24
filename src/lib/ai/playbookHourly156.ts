const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 156: Pidgin/typo paraphrases + thin remaining paths. No invented amounts. */
export function playbookHourly156(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/guarantor|surety|somebody\s+go\s+sign/i.test(t)) {
    return (
      '**Guarantor**\n\n' +
      'Official FAQ: students do **not** need a guarantor to access the loan.\n' +
      `Confirm current wording on ${SITE}.`
    )
  }

  if (/private\s+(uni|university|school)|na\s+private/i.test(t)) {
    return (
      '**Private schools**\n\n' +
      'Coverage described on official pages is for eligible students in **public** tertiary institutions.\n' +
      `Confirm your school on ${PORTAL} — if it is not on the list, the campus cannot invent a slot.`
    )
  }

  if (/wetin\s+be\s+institutional|wetin\s+una\s+mean\s+by\s+charg/i.test(t)) {
    return (
      '**Institutional charges** = school fees billed by your school. Paid **to the school**.\n' +
      `Upkeep (if ticked) is separate and paid to you. Confirm figures only on ${PORTAL}.`
    )
  }

  if (intent === 'portal-login' || /how\s+(i|to)\s+(log|sign)/i.test(t)) {
    return null
  }

  if (/appeal|denied|reject/i.test(t)) {
    return (
      '**If an application is denied**\n\n' +
      `Official FAQ: raise a complaint from the portal or email via the official support path. Ticket: ${ESUPPORT}.\n` +
      `Login: ${LOGIN}`
    )
  }

  return null
}
