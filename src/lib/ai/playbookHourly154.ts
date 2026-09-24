const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 154 angle answers. No invented dates or amounts. */
export function playbookHourly154(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/screenshot|dashboard|picture|photo|image|total\s*loans|look\s*at\s*my/i.test(t)) {
      return `**I cannot read your dashboard from here.**\n\n1. Sign in at ${PORTAL} and copy the exact status word (Pending, Approved, etc.).\n2. Paste that word here if you want the next step for that word.\n3. School charges go to the school; upkeep only if that line is approved on the same file.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'how-to-apply') {
    if (/document|papers|upload|nin|bvn|what\s*do\s*i\s*need/i.test(t)) {
      return `**What you usually need to start**\n\n1. Admission in a listed public institution.\n2. JAMB / UTME number that matches your name.\n3. NIN, BVN, and a bank account in your name.\n4. Sign in at ${PORTAL} and complete the profile the form asks for.\nI will not invent extra papers. Confirm the live form on ${PORTAL}.`
    }
  }

  if (intent === 'repayment') {
    if (/salary|employer|debit|cut|years?\s*(to\s*)?pay/i.test(t)) {
      return `**Repayment follows official rules after study / NYSC.**\n\nI will not invent a start date, rate, or jail term.\nConfirm the current repayment notes on ${SITE}. Portal: ${PORTAL}.`
    }
  }

  if (intent === 'eligibility') {
    if (/private|part[\s-]*time|sandwich|noun/i.test(t)) {
      return `**Eligibility is set on the official portal, not by this chat.**\n\nPublic tertiary students with admission and matching records are the usual path. Private-school and some programme types may not qualify.\nConfirm your school and programme on ${PORTAL} and ${SITE}. I will not invent a yes/no for a school I cannot see.`
    }
  }

  return null
}
