import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour 98: short menu for vague help; pending / login leftovers. */
export function playbookHourly98(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources' && /help|assist|guide|sabi|confused|lost|menu|start|orientate|assistance|una\s*fit/i.test(t)) {
    return `I can help with NELFUND. Pick one line:\n\n1. How to apply or create an account: ${PORTAL}\n2. Already registered: sign in at ${SITE}\n3. Pending / money never enter: check the exact status word on ${PORTAL}\n4. JAMB, school not on list, or login error: same portal, then ${ESUPPORT}\n\nOfficial FAQ: ${FAQ}. I will not invent a deadline or a pay date.`
  }

  if (intent === 'pending-application') {
    return `I cannot see your file from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. School charges and upkeep can move on different days.\n3. Same word after campus desk confirms: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `JAMB must match the admission papers exactly.\n\n1. Retype the number on ${PORTAL} with no extra space.\n2. Name and date of birth must match NIN.\n3. Still fail: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    return `If that email was used before, log in. Do not create a second account.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If the school is missing from the list, the file cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'repayment') {
    return `Repayment follows the official Act after the applicable study or NYSC period. I will not invent a start date or percentage.\n\nConfirm on ${SITE} and ${PORTAL}.`
  }

  return null
}
