const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-64 playbook. Answer first. No invented dates. No long dashes. */
export function playbookHourly64(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    return `**How far your loan:** I cannot see your file from here.\n\n1. Sign in on ${PORTAL}. Copy the exact status word (pending, under review, approved, processing, or empty).\n2. School charges go to the school account. No alert does not mean they declined you.\n3. Upkeep can land in a later batch if you ticked it.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'current-information') {
    return `**As of today:** account creation (sign up) can be open while loan and upkeep for 2026/2027 is not confirmed open.\n\n- New account: ${PORTAL}\n- Old email from last year: sign in on ${SITE}. Do not create another account.\n\nI will not invent a closing date. Recheck the official portal.`
  }

  if (intent === 'what-is-nelfund') {
    return `**NELFUND is the Nigeria Education Loan Fund.** Government created it so eligible students in public tertiary schools can get an interest-free loan for school charges and optional upkeep.\n\nIt is a loan you repay later, not a gift. ${SITE}`
  }

  if (intent === 'jamb-verification') {
    return `**Invalid JAMB** usually means the number, name, or date of birth does not match CAPS or the school upload.\n\n1. Type the number exactly as on your admission letter.\n2. Direct Entry still needs a real JAMB registration number.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /mail|email|password|sign\s*in|last\s*year|already\s*used/i.test(t)) {
    return `**That email is already on NELFUND. Log in. Do not create a new account.**\n\n1. Sign in on ${SITE} with the old email.\n2. Password no gree: official reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School not showing** usually means the school has not finished uploading your record, or the search name is too short.\n\n1. Search the full official name on ${PORTAL}.\n2. Ask ICT / Registry / campus NELFUND desk.\n3. Still missing: ${ESUPPORT}.`
  }

  return null
}
