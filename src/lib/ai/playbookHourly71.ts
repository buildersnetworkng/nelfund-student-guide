const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export function playbookHourly71(intent: string, userText: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (
    /^(abeg|pls|please|bros|sis)?\s*(help|assist|guide)\s*(me|us)?|i\s*(just\s*)?(need|wan|want)\s*(help|assist)|wetin\s*(i\s*)?(fit|can|go)\s*(ask|do)|help\s*me\s*(with\s*)?(this|dis)\s*(thing|matter|issue)|una\s*(fit|can)\s*help\s*me|i\s*dey\s*confused|make\s*una\s*help\s*me|i\s*no\s*know\s*where\s*to\s*start|guide\s*me|wetin\s*una\s*fit\s*do\s*for\s*me|what\s*can\s*you\s*help/i.test(
      t,
    )
  ) {
    return `How far. I can help with NELFUND apply, portal login, pending status, JAMB / NIN, school list, upkeep, and repayment.\n\nOfficial only:\n- Sign in: ${SITE}\n- Sign up / apply: ${PORTAL}\n- FAQ: ${FAQ}\n- Ticket: ${ESUPPORT}\n\nSay the exact problem (example: pending, invalid JAMB, school not showing). I will not invent a live status or deadline.`
  }

  if (intent === 'pending-application' && /no\s*movement|never\s*comot|still\s*write|forget\s*my\s*(file|own)|how\s*long/i.test(t)) {
    return `**Still the same word on the portal:** I cannot see or speed your file from this chat.\n\n1. Copy the exact status on ${PORTAL}.\n2. Do not open a second account while you wait.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}. I will not invent a pay date.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB number wahala:** type it exactly as on the admission letter. Name and date of birth must match NIN. Direct Entry still needs a real JAMB registration. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'current-information') {
    return `**Open / deadline:** I will not invent a closing date.\n\nConfirm the live loan window on ${SITE} and ${PORTAL}. Account creation can be open while the loan request window is not. Do not use social media dates.`
  }

  if (intent === 'repayment') {
    return `**Repayment** follows the Students Loans Act after the applicable NYSC / study period. Confirm on ${SITE}. I will not invent a start date, salary cut, or jail term.`
  }

  if (intent === 'school-not-found') {
    return `**School not on the list:** search the full official name on ${PORTAL}. Ask ICT / Registry if the record is uploaded. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /mail|email|register|password|sign\s*up/i.test(t)) {
    return `**Email already used / you registered before.** Sign in at ${SITE}. Do not create a second account. Forgot password: reset on ${SITE}, then ${ESUPPORT} if it still blocks you.`
  }

  return null
}
