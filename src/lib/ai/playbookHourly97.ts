import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour 97: pending answers split by angle (how far vs money vs what next). */
export function playbookHourly97(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/money|alert|credit|enter|drop|pay(\s*me)?|upkeep|tuition|fees?/i.test(t) && /never|no|not|never|una\s*don\s*pay|mates|class/i.test(t)) {
      return `Money not entering is a portal payment status, not a date I can invent.\n\n1. Sign in at ${PORTAL} and copy the exact word on the dashboard.\n2. School charges and upkeep are separate. One can move while the other stays.\n3. Mates collecting does not mean your file is ready. Same word for weeks after campus desk confirms: ${ESUPPORT}.`
    }
    if (/how\s*far|wetin\s*dey\s*happen|status|processing|pending|under\s*review|same\s*place|never\s*(change|move)/i.test(t)) {
      return `Pending or processing means the portal has the file. I cannot see your record from here.\n\n1. Open ${PORTAL} and read the exact status word.\n2. If campus must confirm admission or fees, ask that desk first.\n3. Same word for a long stretch after that: ${ESUPPORT}. I will not invent an approval date.`
    }
    if (/what\s*(should|will|can)\s*i\s*do|wetin\s*i\s*go\s*do|what'?s\s*next|first\s*step|so\s*what/i.test(t)) {
      return `Next step for a pending file is on the portal, not a new application.\n\n1. Log in at ${PORTAL}.\n2. Screenshot the status word.\n3. Campus desk if they must confirm. Still stuck: ${ESUPPORT}.`
    }
    return `Your application status lives on ${PORTAL}.\n\n1. Sign in and copy the exact word (pending, processing, approved, and so on).\n2. Do not open a second account.\n3. If that word does not change after campus confirmation, use ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `Invalid JAMB means the number did not match what the portal expects.\n\n1. Type it exactly on ${PORTAL}. No extra space.\n2. Use the same number as JAMB and your admission papers.\n3. Still fail: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /(mail|email|register|last\s*year|already)/i.test(t)) {
    return `If that email was used last year, log in. Do not create a new account.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If the school is not on the list, the file cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  return null
}
