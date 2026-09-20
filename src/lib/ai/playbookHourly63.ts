const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-63 playbook. Answer the student first. No invented dates. */
export function playbookHourly63(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    return `**Wetin dey happen to your loan:** I cannot open your dashboard from this chat.\n\n1. Sign in on ${PORTAL} and copy the exact status word (pending, under review, approved, or empty).\n2. School charges go to the school. No alert does not mean they declined you.\n3. Upkeep can land later than school fees if you ticked it.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'current-information') {
    return `**As of today:** account creation can be open while loan and upkeep for 2026/2027 is not confirmed.\n\n- New account: ${PORTAL}\n- Old email from last year: sign in on ${SITE}. Do not create another account.\n\nI will not invent a closing date. Check the portal, not WhatsApp.`
  }

  if (intent === 'what-is-nelfund') {
    return `**NELFUND is the Nigeria Education Loan Fund.** Government set it up so eligible students in public tertiary schools can get an interest-free loan for school charges and optional upkeep.\n\nIt is a loan, not free money. ${SITE}`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB no gree** usually means the number, name, or date of birth does not match CAPS or the school upload.\n\n1. Type it exactly as on the admission letter.\n2. Direct Entry still needs a real JAMB registration.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /mail|email|password|sign\s*in|last\s*year/i.test(t)) {
    return `**Use the old email. Log in. Do not create a new account.**\n\n1. Sign in on ${SITE}.\n2. Password no gree: official reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School name no dey** usually means the school has not finished uploading your record, or the search name is short.\n\n1. Search the full official name on ${PORTAL}.\n2. Ask ICT / Registry / campus NELFUND desk.\n3. Still missing: ${ESUPPORT}.`
  }

  return null
}
