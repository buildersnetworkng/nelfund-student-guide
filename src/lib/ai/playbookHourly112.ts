import type { IntentId } from './types'
import { playbookHourly111 } from './playbookHourly111'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-112 replies. Vague Pidgin help stays a short menu.
 * No invented pay dates. No long dashes.
 */
export function playbookHourly112(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /help|guide|assist|direction|lost|confused|sabi|where\s*to\s*start|begin|any\s*(help|info)|wetin\s*i\s*suppose|una\s*fit\s*help|make\s*una\s*help/i.test(
        t,
      )
    ) {
      return `Short menu (not live status):\n\n1. What NELFUND is: ${SITE}\n2. Sign in or apply: ${PORTAL}\n3. Ticket if the portal blocks you: ${ESUPPORT}\n\nReply with one line: apply, pending, JAMB, school list, login, or repayment.`
    }
  }

  if (intent === 'pending-application') {
    if (/how\s*far\s*(with\s*)?(this\s*)?(my\s*)?(nelfund|loan)|e\s*still\s*dey\s*(pending|processing)|dem\s*never\s*(pay|disburse)|i\s*don\s*apply\s*(but|since)/i.test(t)) {
      return `I cannot open your file from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. Same word for weeks is usually school verification, not a broken form.\n3. Campus NELFUND desk first, then ${ESUPPORT}. I will not invent a pay date.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb|utme|caps/i.test(t)) {
      return `JAMB / UTME must match the portal record.\n\n1. Type the number exactly as on your JAMB slip.\n2. CAPS admission name should match what you typed.\n3. Still blocked: campus records desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    return `Repayment follows only what the official portal shows for your file.\n\n1. Sign in at ${PORTAL} and open repayment if the menu is there.\n2. I will not invent a start date, percentage, or bank.\n3. Confirm on ${SITE} or raise a ticket at ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If the school is missing from the list, do not invent a name.\n\n1. Search the short official name at ${PORTAL}.\n2. Ask your campus NELFUND desk to confirm the institution record.\n3. Ticket: ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    return `Last year register usually means reuse the same portal account.\n\n1. Try forgot password at ${PORTAL}.\n2. Do not open a second email unless official support says so.\n3. Stuck: ${ESUPPORT}.`
  }

  return playbookHourly111(intent, userText)
}
