import type { IntentId } from './types'
import { playbookHourly104 } from './playbookHourly104'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-106 replies. Vague help stays a short menu, never a live status dump.
 */
export function playbookHourly106(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /help|assist|guide|menu|confused|lost|stranded|where\s*to\s*start|orientate|direct\s*me|wetin\s*i\s*(suppose|go)\s*do|una\s*fit\s*help/i.test(
        t,
      )
    ) {
      return `Short menu (not live status):\n\n1. Apply steps: ${SITE}\n2. Portal login / old email: ${PORTAL}\n3. Ticket if the portal blocks you: ${ESUPPORT}\n\nReply with one line: apply, pending, JAMB, school list, login, or repayment.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb|utme|caps/i.test(t)) {
      return `Invalid JAMB is a data match, not a new loan.\n\n1. Type the number exactly as on your JAMB slip.\n2. Confirm CAPS / admission name matches the portal.\n3. Still blocked: campus records desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'school-not-found') {
    return `If the school is missing from the list, do not invent a name.\n\n1. Search short official name at ${PORTAL}.\n2. Ask your campus NELFUND desk to confirm the institution record.\n3. Ticket: ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    if (/email|last\s*year|register|password|old\s*account/i.test(t)) {
      return `Last year register usually means reuse the same portal account.\n\n1. Try forgot password at ${PORTAL}.\n2. Do not open a second email unless official support says so.\n3. Stuck: ${ESUPPORT}.`
    }
  }

  return playbookHourly104(intent, userText)
}
