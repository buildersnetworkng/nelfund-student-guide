import type { IntentId } from './types'
import { playbookHourly97 } from './playbookHourly97'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-96 wording. Vague help returns a short menu, never a live status dump. */
export function playbookHourly96(intent: IntentId, userText?: string): string | null {
  const newer = playbookHourly97(intent, userText)
  if (newer) return newer

  const t = (userText || '').trim()
  if (!t) return null

  if (
    intent === 'official-sources' &&
    /help|assist|guide|orientate|confused|lost|start|menu|direction|newbie|beginner|wetin\s*i\s*(suppose|go|fit)\s*do|how\s*e\s*take\s*be|una\s*fit|i\s*just\s*dey\s*come|break\s*am\s*down/i.test(
      t,
    )
  ) {
    return `I can help with NELFUND. Pick one line:\n\n- Apply / create account\n- Login / email already used\n- Pending / money never enter\n- JAMB or school not on the list\n- Repayment\n\nOfficial pages: ${SITE} ${PORTAL} ${FAQ}\nI will not invent a deadline or a live pay status.`
  }

  if (intent === 'pending-application' && /sleep|no\s*gree\s*(move|change)|weeks\s*(don|has)\s*pass|processing\s*since|class\s*don\s*collect|dashboard\s*still\s*(zero|0)|under\s*review\s*since|pending\s*since/i.test(t)) {
    return `A file that looks asleep is still a portal status, not a date I can invent.\n\n1. Sign in at ${PORTAL} and copy the exact word.\n2. School charges and upkeep are different payments.\n3. Same word for weeks after campus desk confirms: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /jamb|utme|caps|wahala/i.test(t)) {
    return `Invalid JAMB means the number did not match.\n\n1. Type it exactly on ${PORTAL}. No extra space.\n2. Same number as JAMB and admission papers.\n3. Still fail: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'repayment' && /repay|pay\s*back|nysc|gsi|deduct|10\s*%/i.test(t)) {
    return `Repayment follows the Students Loans Act after the applicable NYSC or study period.\n\n1. Confirm the live rule on ${SITE} and ${PORTAL}.\n2. I will not invent a start date, percentage, or jail term.\n3. Still studying or serving: you are not in a repayment window I can invent.`
  }

  if (intent === 'school-not-found' && /school|institution|list|drop/i.test(t)) {
    return `If the school is not on the list, the application cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /(mail|email|register|last\s*year)/i.test(t)) {
    return `If that email was used last year, log in. Do not create a new account.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  return null
}
