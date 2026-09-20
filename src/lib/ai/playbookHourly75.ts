import type { IntentId } from './types'
import { playbookHourly76 } from './playbookHourly76'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-75 wording. Short menu for vague other. No invented dates. No long dashes. */
export function playbookHourly75(intent: IntentId, userText?: string): string | null {
  const chained = playbookHourly76(intent, userText)
  if (chained) return chained

  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /confused|orient|brief|short\s*(guide|menu)|no\s*sabi|show\s*me\s*(the\s*)?way|small\s*help|kindly\s*assist|how\s*e\s*take\s*be|arrange\s*(am|dis)|yarn\s*me/i.test(
        t,
      )
    ) {
      return `Pick one line so I can help:\n1. How to apply / create account\n2. Pending file or money never enter\n3. JAMB, school list, or login email already used\n4. Repayment later\n\nOfficial pages: ${SITE} and ${PORTAL}. I will not invent a live deadline.`
    }
  }

  if (intent === 'pending-application' && /waiting\s*tire|never\s*move|forget\s*my\s*file|since\s*(january|february|march|april|may|june|july|august|september)/i.test(t)) {
    return `Long wait does not change from this chat. Only ${PORTAL} shows your real status word.\n\n1. Copy submitted / processing / approved exactly.\n2. Do not open a second account.\n3. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}. I will not invent a pay date.`
  }

  if (intent === 'portal-login') {
    return `If that email worked last year or last session, sign in at ${SITE}. Use forgot password. Do not register another mail. Still locked: ${ESUPPORT}.`
  }

  return null
}
