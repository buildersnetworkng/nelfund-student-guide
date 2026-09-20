const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-68 playbook. Vague help = short menu. No invented dates. No long dashes. */
export function playbookHourly68(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /^(pls|plz|please|abeg)\s*(help|assist|guide)|help\s*(me\s*)?(out|now)|i\s*need\s*(una|your)\s*help|una\s*fit\s*guide\s*me|make\s*una\s*help\s*me|i\s*no\s*sabi|i\s*just\s*dey\s*confused|assist\s*me\s*abeg|guide\s*me\s*pls|wetin\s*i\s*fit\s*do\s*now/i.test(
      t,
    )
  ) {
    return `How far. I cover **NELFUND** only.\n\nPick one line:\n- how to apply\n- pending / how far my file\n- JAMB or login error\n- school not on the list\n- repayment\n\nOfficial pages: ${SITE} and ${PORTAL}. I will not dump a live status I cannot see.`
  }

  if (intent === 'pending-application') {
    return `**Pending / how far:** only ${PORTAL} shows your file. I cannot see it from this chat.\n\n1. Copy the exact status word.\n2. No SMS does not mean declined.\n3. Same word for weeks: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'current-information') {
    return `**I will not invent a deadline.** Account creation can be open while the loan window is not confirmed. Check ${PORTAL} and ${SITE} only.`
  }

  if (intent === 'repayment') {
    return `**Repayment** follows official NELFUND rules after the applicable NYSC or study period. I will not invent a start date or percentage. Confirm on ${SITE}.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB wahala:** type the number exactly as on the admission letter. Name and date of birth must match NIN. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    return `**Email already used / last year register:** sign in on ${SITE}. Do not create a second account. Reset password on ${SITE} if needed.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey list:** search the full official name on ${PORTAL}, then ask ICT / Registry. Still missing: ${ESUPPORT}.`
  }

  return null
}
