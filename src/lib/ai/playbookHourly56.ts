const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-56 playbook extras for leftover other / pending / school / JAMB phrasing. */
export function playbookHourly56(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    intent === 'pending-application' &&
    /how\s*far|howfar|nothing\s*don|e\s*never|status\s*(no|never)|mates?\s*don|screenshot|dashboard|una\s*don\s*start\s*payment/i.test(
      t,
    )
  ) {
    return `**How far still means pending on the portal. I cannot see your dashboard from this chat.**\n\n1. Open ${PORTAL} and copy the exact status word. That word is the truth, not what mates collected.\n2. School charges go to the school. Upkeep, if you ticked it, goes to your bank later. No alert does not mean declined.\n3. I will not invent when money will enter.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'refund') {
    return `**If you already paid school fees yourself, NELFUND institutional charges still go to the school, not your pocket.**\n\n1. Ask bursary / the campus NELFUND desk how they handle students who paid first.\n2. Check the exact status on ${PORTAL}.\n3. I will not invent a refund rule or date.\n4. Still stuck: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /jamb|utme|direct\s*entry/i.test(t)) {
    return `**JAMB no gree means the number or name did not match.**\n\n1. Type the full JAMB / DE number exactly as on the admission letter.\n2. Name and date of birth must match JAMB, NIN, and school records.\n3. Do not pay anyone to fix JAMB. Retry ${PORTAL}.\n4. Still invalid after the school confirms the record: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey on the list is a school-record problem.**\n\n1. Search again on ${PORTAL}. Try the official short name and the full name.\n2. Ask ICT / Registry / campus NELFUND desk whether they uploaded students this cycle.\n3. I will not invent a hidden school code.\n4. Still missing after the school confirms: ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /email|last\s*year/i.test(t)) {
    return `**If that email don dey from last year, log in. Do not create a new account.**\n\n1. Sign in at ${SITE} with the same email.\n2. Forgot password: use the reset link on ${SITE}.\n3. New students only create an account on ${PORTAL}.\n4. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'documents-needed') {
    return `**Upload only what the live form asks for.**\n\n1. JAMB admission letter is commonly required.\n2. Passport photo or school ID only if the form asks (JPEG or PDF).\n3. NIN, BVN, and a bank account in your name.\n4. Upload on ${PORTAL}. I will not invent extra papers.`
  }

  return null
}
