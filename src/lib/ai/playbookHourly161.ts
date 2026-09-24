const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 161: Pidgin/typo leftovers — vocational, parent apply, already NYSC, part-time. No invented amounts. */
export function playbookHourly161(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/parent\s*(fit|can|go)\s*apply|mama\s*(wan|go)\s*apply|daddy\s*apply|apply\s*for\s*(my\s*)?(child|pikin|son|daughter)/i.test(t)) {
    return (
      '**Who applies**\n\n' +
      'The student applies on their own official account at the portal. A parent can sit with them, but the NIN, BVN, JAMB and bank details must belong to the student.\n' +
      `Start at ${PORTAL}. Login: ${LOGIN}.`
    )
  }

  if (/vocational|skills?\s*acquisition|innovation\s*enterprise|iet\b/i.test(t)) {
    return (
      '**Vocational / skills programmes**\n\n' +
      'NELFUND coverage depends on whether the institution and programme appear on the official list and the school has uploaded the record.\n' +
      `Confirm only on ${PORTAL} / ${SITE}. I will not invent extra programme types.`
    )
  }

  if (/don\s*(finish|complete)\s*nysc|after\s*nysc\s*(i\s*)?(still\s*)?fit\s*apply|alumni\s*fit\s*apply/i.test(t)) {
    return (
      '**After NYSC / alumni**\n\n' +
      'The loan is for eligible students in public tertiary study. After you have finished and done NYSC, new undergraduate applications are generally not the use-case — repayment rules apply instead.\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm on ${SITE}.`
    )
  }

  if (/part[-\s]*time|sandwich|distance\s*learn|weekend\s*programme/i.test(t) && /eligib|apply|fit|can/i.test(t)) {
    return (
      '**Part-time / sandwich**\n\n' +
      'Mode of study must match what the official portal accepts for your uploaded school record.\n' +
      `Confirm on ${PORTAL}. I will not invent extra categories.`
    )
  }

  if (intent === 'profile-update') {
    return (
      '**Update profile**\n\n' +
      `Sign in at ${LOGIN} and edit only what the portal allows. Bank/NIN/email issues: reset or ticket at ${ESUPPORT}.`
    )
  }

  return null
}
