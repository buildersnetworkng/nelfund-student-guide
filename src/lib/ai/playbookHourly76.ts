import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-76 wording. Short menu for vague other. No invented dates. No long dashes. */
export function playbookHourly76(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /abeg|confused|orient|newbie|no\s*idea|explain\s*small|break\s*am\s*down|i\s*dey\s*blank|lost\s*(pass|well)|where\s*person\s*go\s*start|wetin\s*first|any\s*help|point\s*me|no\s*understand/i.test(
        t,
      )
    ) {
      return `Pick one line so I can help:\n1. How to apply / create account\n2. Pending file or money never enter\n3. JAMB, school list, or login email already used\n4. Repayment later\n\nOfficial pages: ${SITE} and ${PORTAL}. I will not invent a live deadline.`
    }
  }

  if (intent === 'pending-application' && /mates?\s*don|everyday|week\s*don\s*pass|month\s*don\s*pass|zero\s*naira|acct\s*still\s*empty|only\s*me\s*never/i.test(t)) {
    return `Mates collecting does not change your file from this chat. Only ${PORTAL} shows your real status word.\n\n1. Copy submitted / processing / approved exactly.\n2. Do not open a second account.\n3. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}. I will not invent a pay date.`
  }

  if (intent === 'portal-login') {
    return `If that email worked last year or last session, sign in at ${SITE}. Use forgot password. Do not register another mail. Still locked: ${ESUPPORT}.`
  }

  return null
}
