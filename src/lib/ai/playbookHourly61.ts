const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-61 playbook extras for leftover other topics. */
export function playbookHourly61(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'how-to-apply' && /wan(t)?\s*(to\s*)?apply|how\s*i\s*(go|fit)\s*apply|create\s*(account|profile)|guide\s*me/i.test(t)) {
    return `**To start:** account creation can be OPEN now. Loan and upkeep for 2026/2027 is not confirmed open yet.\n\n1. New student: sign up on ${PORTAL} with your own email, NIN, BVN, and JAMB.\n2. You used the same email last year: sign in on ${SITE}. Do not create a second account.\n3. Finish every field the portal asks. I will not invent a loan opening date. Confirm only on the portal.`
  }

  if (intent === 'rejected-application') {
    return `**Rejected or declined on the portal is a real status, not a rumour.** I cannot see your file from this chat.\n\n1. Open ${PORTAL} and copy the exact word and any reason shown.\n2. Common causes: school record not uploaded, name mismatch, programme type not accepted.\n3. Fix the reason with campus NELFUND desk, then retry. Still stuck: ${ESUPPORT}.`
  }

  if (intent === 'loan-or-scholarship') {
    return `**NELFUND is a student loan, not a grant and not a scholarship.** You are expected to repay after school or NYSC, on the terms the portal shows.\n\n1. Read the live FAQ: ${FAQ}\n2. Do not treat social media "free money" posts as policy.\n3. Apply only on ${PORTAL}.`
  }

  if (intent === 'academic-session') {
    return `**Pick the academic session the portal lists for your current registration.** Wrong session can stall the file.\n\n1. Match what your school uploaded, not a guess.\n2. Confirm with Registry or campus NELFUND desk, then retry ${PORTAL}.`
  }

  if (intent === 'eligibility' && /\b(nd|hnd|nce|poly|college)\b/i.test(t)) {
    return `**ND, HND, NCE, and public polytechnic or college of education students can be in scope if the school participates and the programme is full-time.** The live form is the rule.\n\n1. Search your official school name on ${PORTAL}.\n2. Part-time or private campuses are often outside. I will not invent an exception.`
  }

  if (intent === 'repayment') {
    return `**Repayment starts after school, usually tied to NYSC or work, not while you are still a student on the loan.** I will not invent a monthly figure.\n\n1. Read official repayment notes on ${SITE} and ${FAQ}.\n2. Ignore "life jail" rumours. Use the portal terms only.`
  }

  if (intent === 'institutional-charges') {
    return `**Institutional charges go to the school, not your personal account.** Upkeep, if you ticked it and it is approved, is separate.\n\n1. Ask bursary after the portal shows approved or disbursed.\n2. No alert to your phone does not mean the school was not paid. Check ${PORTAL} and bursary.`
  }

  if (intent === 'guarantor') {
    return `**Use only what the live portal asks for guarantor or next of kin.** I will not invent extra forms.\n\n1. Complete the fields on ${PORTAL}.\n2. If a field is missing, that is the current form. Confirm on ${FAQ}.`
  }

  if (intent === 'refund') {
    return `**Already paying school fees from your pocket does not set a refund week.** If NELFUND later pays the school, bursary handles how they treat students who already paid.\n\n1. Keep your file complete on ${PORTAL}.\n2. Ask bursary with your portal status. I will not invent a refund date.`
  }

  if (intent === 'pending-application' && /check|status/i.test(t)) {
    return `**To check status, open the portal yourself. This chat cannot see your dashboard.**\n\n1. ${PORTAL}\n2. Copy the exact word: Pending, Approved, Disbursed, Missing Information.\n3. Same word for weeks: campus desk, then ${ESUPPORT}.`
  }

  return null
}
