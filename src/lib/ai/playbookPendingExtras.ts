const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Extra pending-status answers for leftover unknown phrasings. */
export function playbookPendingExtras(t: string): string | null {
  if (/\b(declin(ed|e)|reject(ed)?|unsuccessful|not\s*approv)/i.test(t)) {
    return `**Declined / unsuccessful is a status word, not a new application.**\n\n1. Open ${PORTAL} and copy the **exact** sentence (reason if shown).\n2. Do not open a second account. Sign in at ${SITE} if you already have one.\n3. Common next checks: JAMB number format, school record uploaded, public-institution eligibility.\n4. Ask the campus NELFUND desk if the school must re-upload. Then ticket ${ESUPPORT} with that exact sentence and a screenshot.\n\nI cannot reverse a decision from this chat.`
  }
  if (/(no|never|not|no\s*dey)\s*(see|show|find)\s*(my\s*)?(application|loan|file)|application\s*(disappear|missing|no\s*show)/i.test(t)) {
    return `**If the loan file is not showing**\n\n1. Sign **in** at ${SITE} with the same email you used to apply. Do not create a second account.\n2. Confirm you are on ${PORTAL} after login, not a random WhatsApp link.\n3. If the dashboard is empty, the school may not have uploaded your record yet. Ask the campus NELFUND desk.\n4. Still empty after that? Ticket ${ESUPPORT} with name, school, and the email on the account.`
  }
  if (/credit\s*alert|no\s*credit|alert\s*(no|never)\s*(enter|drop|come)/i.test(t)) {
    return `**No credit alert yet** is still a wait question.\n\n1. Institutional charges go to the **school**, so you may see no personal alert even after school fees move.\n2. Upkeep (only if you ticked it in the same session) goes to the bank account on your profile.\n3. Open ${PORTAL} and copy the exact status word. I will not invent a pay date.\n4. Long same-word wait: ticket ${ESUPPORT}.`
  }
  return null
}
