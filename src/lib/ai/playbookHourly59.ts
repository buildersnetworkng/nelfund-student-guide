const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-59 playbook extras: money never enter, email used, school list, NIN/BVN, part-time, already paid. */
export function playbookHourly59(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    intent === 'pending-application' &&
    /money|alert|credit|mates|how\s*far|dashboard|pending\s*loans|una\s*don\s*pay/i.test(t)
  ) {
    return `**Pending or "money never enter" does not mean declined.** I cannot see your file from this chat, and I will not invent a pay date.\n\n1. Open ${PORTAL} and copy the exact status word (Pending, Approved, Disbursed, Missing Information).\n2. School charges go to the school first. Upkeep, if you ticked it and the window is open, can reach your bank later. No SMS is not a rejection.\n3. Mates collecting first is common. If the same word sits for weeks, use campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /email|already|last\s*year|register/i.test(t)) {
    return `**If that email was used last year, log in. Do not create a new account.**\n\n1. Sign in on ${PORTAL} with the old email.\n2. Use Forgot password if you cannot enter.\n3. A second account often locks JAMB / NIN. Still stuck: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /school|institution|list/i.test(t)) {
    return `**If your school is not showing, the record is usually not uploaded yet, or the name spelling differs.**\n\n1. Search short official name, not nickname.\n2. Ask ICT / Registry / campus NELFUND desk to confirm upload.\n3. Retry ${PORTAL}. Still missing after school confirms: ${ESUPPORT}.`
  }

  if (intent === 'missing-information' && /nin|bvn/i.test(t)) {
    return `**NIN or BVN must match the name on JAMB and your bank.** I will not invent a bypass.\n\n1. Check the digits, no extra space.\n2. If NIMC or bank name differs, fix the source first, then retry ${PORTAL}.\n3. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'eligibility' && /part[-\s]*time|sandwich|weekend|distance/i.test(t)) {
    return `**NELFUND is built around eligible full-time students in participating public institutions.** Part-time, sandwich, weekend, or distance routes are often outside the live form.\n\n1. Confirm on ${PORTAL} and ${FAQ}. I will not invent an exception.\n2. If the portal rejects the programme type, that is the live rule.`
  }

  if (intent === 'how-to-apply' && /already\s*paid|don\s*pay|bursary/i.test(t)) {
    return `**Already paying school fees does not block you from checking the portal, and it does not guarantee a refund date.**\n\n1. Still complete or update your file on ${PORTAL} if the window is open.\n2. Institutional charges, if approved, go to the school. Ask bursary how they treat students who already paid.\n3. I will not invent a refund week. Official pages only: ${PORTAL} ${SITE}.`
  }

  if (intent === 'how-to-apply' && /^(abeg|please|pls)\s*(help|assist)|help\s*me/i.test(t)) {
    return `**Tell me the exact problem** (pending, school not showing, invalid JAMB, email already used, or "is it open").\n\nMeanwhile: account creation can be open while loan / upkeep is not confirmed. Check ${PORTAL} and ${SITE} only.`
  }

  return null
}
