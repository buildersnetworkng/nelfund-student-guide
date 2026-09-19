const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-55 playbook extras for leftover other / pending / login phrasing. */
export function playbookHourly55(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    intent === 'pending-application' &&
    /how\s*far|money\s*never|upkeep\s*never|alert\s*never|when\s*(will|go)\s*(they|dem|una)\s*pay|processing\s*since|under\s*review|wetin\s*dey\s*happen/i.test(
      t,
    )
  ) {
    return `**Pending means your file is still on the portal. It is not a payment date.**\n\n1. Open ${PORTAL} and copy the exact status word. That word is the truth, not WhatsApp.\n2. School charges go to the school. Upkeep, if you ticked it, goes to your bank later. No alert does not mean declined.\n3. I will not invent when money will enter. Confirm only on the portal.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /email|registered\s*last\s*year|already\s*(used|exist)|password|sign\s*in|login/i.test(t)) {
    return `**If that email was used last year, log in. Do not create a new account.**\n\n1. Sign in at ${SITE} with the same email.\n2. Forgot password: use the reset link on ${SITE}.\n3. New students only create an account on ${PORTAL}.\n4. Still locked: ${ESUPPORT}. Do not pay anyone to "open a second portal".`
  }

  if (intent === 'school-not-found') {
    return `**If your school is not on the list, the school record is the blocker.**\n\n1. Search again on ${PORTAL}. Try the official short name and the full name.\n2. Ask ICT / Registry / the campus NELFUND desk whether they have uploaded students this cycle.\n3. I will not invent a hidden school code.\n4. Still missing after the school confirms: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /invalid|no\s*dey\s*work|fail/i.test(t)) {
    return `**Invalid JAMB means the number did not match the record the portal expects.**\n\n1. Type the full JAMB / DE number exactly as on your admission letter.\n2. Name and date of birth must match JAMB and school records.\n3. Do not pay anyone to "fix JAMB". Retry ${PORTAL}.\n4. Still invalid after the school confirms the record: ${ESUPPORT}.`
  }

  if (intent === 'reapplication') {
    return `**Last year application is not automatic for a new session.**\n\n1. Use the same email and sign in at ${SITE}. Do not open a second account.\n2. Follow only what ${PORTAL} shows for this cycle.\n3. I will not invent a re-apply date. Check live status on the portal.\n4. Stuck: campus desk, then ${ESUPPORT}.`
  }

  return null
}
