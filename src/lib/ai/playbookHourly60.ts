const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-60 playbook extras: pending wait, JAMB fail, open-status shorthand. */
export function playbookHourly60(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    intent === 'pending-application' &&
    /pending|never\s*pay|never\s*collect|stuck|nothing\s*has|when\s*(go|will)|no\s*pay/i.test(t)
  ) {
    return `**Pending for weeks is still a wait, not a silent decline.** I cannot see your dashboard from this chat, and I will not invent a pay week.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school first. Upkeep, if you ticked it, can arrive later with no SMS.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /jamb|utme/i.test(t)) {
    return `**Invalid JAMB means the number or the name/DOB pair does not match the record the portal can see.**\n\n1. Type the JAMB number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still uses a JAMB registration. Still failing: campus desk, then ${ESUPPORT}. Do not create a second account.`
  }

  if (intent === 'current-information') {
    return `**As of today:** account creation can be OPEN. Loan and upkeep for 2026/2027 is not confirmed open yet.\n\n- Sign up or finish profile: ${PORTAL}\n- Already registered last year: sign in at ${SITE}, do not create a new account\n\nI will not invent a closing date. Confirm only on the portal.`
  }

  return null
}
