import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-117 replies for leftover other / vague help. No invented dates or amounts.
 */
export function playbookHourly117(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /^(abeg|pls|please)?\s*(help(\s*me)?|i\s*need\s*help|una\s*fit\s*help|assist|guide\s*me|i\s*dey\s*confused|wetin\s*i\s*go\s*do|help|stuck|wahala)[.!?\s]*$/i.test(
        t.trim(),
      )
    ) {
      return `How far. I cover NELFUND only.\n\nPick one: apply, pending status, school not on the list, JAMB error, login / last year email, upkeep, or repayment.\n\nPortal: ${PORTAL}`
    }
  }

  if (intent === 'how-to-apply' && /abeg|wan\s*collect|how\s*(person|man)\s*(go|fit)|first\s*tin|never\s*start/i.test(t)) {
    return `To start application:\n\n1. Confirm your public school can appear on the list.\n2. Sign in or create at ${PORTAL}. Same email if you registered before.\n3. Finish JAMB, NIN, BVN, bank in your name.\n4. Request the loan only when the official window is open. I will not invent that date.`
  }

  if (
    intent === 'pending-application' &&
    /how\s*far|money\s*(never|no)|una\s*never\s*pay|nothing\s*don\s*drop|under\s*review|status\s*(still\s*)?(pending|dey)|i\s*don\s*apply\s*(since|long)|wetin\s*(dey\s*)?happen/i.test(
      t,
    )
  ) {
    return `Pending / money never enter means the file is still waiting. I cannot see your dashboard from here.\n\n1. Copy the exact status word on ${PORTAL}.\n2. School charges go to the school. No SMS is not the same as declined.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `JAMB must match admission and NIN.\n\n1. Type the number exactly. No extra space.\n2. Name and date of birth must match.\n3. Still failing: campus desk, then ${ESUPPORT}. Do not open a second account.`
  }

  if (intent === 'portal-login') {
    return `If that email was used last year, log in. Do not create another account.\n\n1. Sign in at ${SITE}.\n2. Forgot password or OTP: use reset on ${SITE}.\n3. Still blocked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If the school is not on the list, the record is usually not uploaded yet.\n\n1. Confirm you attend a public institution.\n2. Ask campus NELFUND desk to upload your data.\n3. Retry ${PORTAL}. Still failing: ${ESUPPORT}.`
  }

  if (intent === 'repayment') {
    return `Repayment follows official NELFUND rules after the applicable NYSC or study period.\n\n1. Confirm on ${SITE} and ${PORTAL}.\n2. I will not invent a start date or percentage.`
  }

  return null
}
