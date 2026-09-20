const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-62 playbook extras. Keep answers short, Pidgin-safe, no invented dates. */
export function playbookHourly62(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'what-is-nelfund') {
    return `**NELFUND is the Nigeria Education Loan Fund.** The Students Loans Act set it up so eligible students in public tertiary schools can get an interest-free loan for school charges and optional upkeep.\n\nIt is a loan, not a scholarship. School charges go to the school. Upkeep, if approved, goes to your bank.\n\n${SITE}`
  }

  if (intent === 'current-information') {
    return `**As of today:** you can create an account on the portal. Loan and upkeep for 2026/2027 is not confirmed open yet.\n\n- New: sign up on ${PORTAL} with NIN, BVN, and JAMB.\n- Last year email: sign in on ${SITE}. Do not open a second account.\n\nI will not invent a closing date. Confirm only on the portal, not social media.`
  }

  if (intent === 'pending-application') {
    return `**How far / money never enter:** I cannot see your file from this chat.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school. No SMS does not mean declined.\n3. Upkeep can land later than school fees if you ticked it.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `**Invalid JAMB** usually means the number, name, or date of birth does not match CAPS or the school upload.\n\n1. Type the JAMB number exactly as on the admission letter.\n2. Direct Entry still needs a real JAMB registration.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not create a second account.`
  }

  if (intent === 'portal-login') {
    return `**That email is already on the system.** Log in. Do not create a new account.\n\n1. Sign in on ${SITE} with the same email from last year.\n2. Forgot password or OTP no dey come: use official reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey show** usually means the school has not finished uploading your record, or you are searching a short or unofficial name.\n\n1. Search the full official name on ${PORTAL}.\n2. Ask ICT / Registry / campus NELFUND desk if your data is uploaded.\n3. Private campuses are often outside the scheme.\n4. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'bank-information' && /opay|palmpay|wallet|bank/i.test(t)) {
    return `**Use a regular Nigerian bank account in your own name.** Some wallets get rejected.\n\n1. Fix the account on ${PORTAL} while signed in.\n2. Name must match NIN and BVN.\n3. Still failing: ${ESUPPORT}.`
  }

  if (intent === 'eligibility') {
    return `**Who can apply:** typically Nigerian students in participating **public** universities, polys, colleges of education, and listed vocational schools, on the mode the live form accepts.\n\nPart-time, sandwich, private campuses, and some postgraduate routes are often outside. Confirm on ${PORTAL} and ${FAQ}. I will not invent an exception.`
  }

  if (intent === 'documents-needed') {
    return `**What the portal usually asks**\n\n1. JAMB admission letter.\n2. NIN, BVN, and a bank account in your name.\n3. Passport photo only if the form asks.\n4. Upload on ${PORTAL}. Do not invent extra papers.`
  }

  if (intent === 'reapplication') {
    return `**If you applied last session, sign in with the same email.** Do not open a second account.\n\n1. ${SITE} for sign in.\n2. Update profile if the portal allows.\n3. Loan window for a new session is only official on ${PORTAL}.`
  }

  return null
}
