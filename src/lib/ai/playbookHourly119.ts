import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://esupport.nelf.gov.ng/'

export function playbookHourly119(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources' && /help|assist|confused|wetin\s*una\s*fit|guide\s*me/i.test(t)) {
    return `How far. I only help with NELFUND.\n\nPick one: apply, pending status, school not on the list, JAMB error, last year email, upkeep, or repayment.\n\nPortal: ${PORTAL}`
  }

  if (intent === 'pending-application') {
    if (/how\s*far\s*(with|on)|wetin\s*dey\s*happen|never\s*(pay|enter|drop|release)|i\s*don\s*wait/i.test(t)) {
      return `I cannot see your file from this chat, so I cannot say a pay date.\n\n1. Copy the exact status word on ${PORTAL}.\n2. School charges go to the school. No alert does not mean declined.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    return `JAMB must match the admission letter exactly.\n\n1. Type the registration number with no extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not open a second account.`
  }

  if (intent === 'repayment') {
    return `Repayment follows official NELFUND rules after the applicable study or NYSC period.\n\nI will not invent a start date, rate, or penalty. Confirm on ${SITE} and ${PORTAL}.`
  }

  if (intent === 'portal-login' && /email|mail|last\s*year|already/i.test(t)) {
    return `That email already has an account. Log in. Do not create a new one.\n\n1. Sign in at ${SITE}\n2. Forgot password: reset on the same email.\n3. Still blocked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If your school is missing from the list, the institution record is usually not on the portal yet.\n\n1. Confirm it is a public institution on this cycle.\n2. Ask the campus NELFUND desk to upload your data.\n3. Retry ${PORTAL}. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'how-to-apply') {
    return `Start here, in this order:\n\n1. Use ${PORTAL}. Same email if you registered before.\n2. Complete NIN, BVN, JAMB, bank in your name.\n3. Request the loan only when the official window is open. I will not invent that date. Check ${SITE}.`
  }

  return null
}
