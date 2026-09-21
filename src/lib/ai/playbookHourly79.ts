import type { IntentId } from './types'
import { playbookHourly82 } from './playbookHourly82'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-79 wording. Chains 82 then 83. Pending angles differ by phrase. */
export function playbookHourly79(intent: IntentId, userText?: string): string | null {
  const chained = playbookHourly82(intent, userText)
  if (chained) return chained
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/na\s*only\s*me\s*never|only\s*me\s*never\s*(collect|see|get)|mates?\s*don\s*(collect|receive|see\s*pay)/i.test(t)) {
      return `Mates getting paid does not change your own file from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word for YOUR login.\n2. School charges can land at the school while your bank stays quiet.\n3. Do not open a second account because friends collected. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/zero\s*naira|acct\s*still\s*empty|account\s*(still\s*)?(empty|quiet)|dashboard\s*(still\s*)?(na\s*)?(0|zero)|nothing\s*don\s*(drop|enter|show)|no\s*(credit\s*)?alert/i.test(t)) {
      return `Empty account and no alert is not proof the file died.\n\n1. Open ${PORTAL} and read submitted, processing, or approved. I cannot see the dashboard from here.\n2. Institutional charges go to the school first. Upkeep only if you ticked it for that session.\n3. I will not invent a credit date. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/file\s*dey\s*sleep|loan\s*dey\s*sleep|una\s*forget\s*(my\s*)?(own|file)|application\s*hang|e\s*hang|wetin\s*dey\s*happen\s*to\s*(my\s*)?(loan|file|own|application)/i.test(t)) {
      return `I cannot tell if the file slept. Only the portal has the live word.\n\n1. Copy that word from ${PORTAL}. Do not invent a new status.\n2. Keep one login. Do not register again to wake the file.\n3. Weeks unchanged: campus NELFUND desk, then ${ESUPPORT}. I will not invent a batch.`
    }
    if (/status\s*no\s*change|e\s*remain\s*pending|under\s*review\s*since|processing\s*since|still\s*on\s*(pending|processing|review)|e\s*still\s*dey\s*(review|process|pending)/i.test(t)) {
      return `Same pending or review word for a long time is a wait, not a new apply.\n\n1. Stay on ${PORTAL} with the same email.\n2. School fees and upkeep can move on different days.\n3. I will not invent how many days review lasts. Still stuck: campus desk, then ${ESUPPORT}.`
    }
    if (/so\s*what\s*(will|should)\s*i\s*do|what'?s\s*next|wetin\s*i\s*go\s*do|first\s*step|what\s*should\s*i\s*do\s*now/i.test(t)) {
      return `Next step for this pending thread is check the live word, not a fresh registration.\n\n1. Open ${PORTAL} and copy submitted / processing / approved.\n2. Keep one account.\n3. If that word has not moved for a long time, take the copy to your campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  return null
}
