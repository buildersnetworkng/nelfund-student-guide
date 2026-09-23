import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-111 replies. Ends with null — must not call 110 (cycle 111→110→…→106→111).
 */
export function playbookHourly111(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/(mates?|paddy|course\s*mates?)\s*(don|have)\s*(collect|receive|see\s*money)/i.test(t)) {
      return `Mates collecting first is common. Files move in school batches, not one WhatsApp line.\n\n1. Compare the exact status word on ${PORTAL}, not rumours.\n2. Do not open a second account to catch up.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/school\s*(fees?|charges?)\s*(don|has)\s*(pay|paid|enter).{0,40}(upkeep|stipend|allowance)\s*(no|not|never)/i.test(t)) {
      return `School charges and upkeep are not the same payment.\n\n1. Charges go to the school. Upkeep goes to your bank if you ticked it in that session.\n2. Upkeep can come later. I will not invent the amount or date.\n3. Confirm both words on ${PORTAL}.`
    }
    if (/status\s*(still|dey|is)\s*(processing|pending|same)|dashboard\s*(still\s*)?(dey\s*)?(show(ing)?\s*)?(0|zero|nil)|application\s*(never|no)\s*(move|change|update)|e\s*don\s*stay\s*(pending|same)/i.test(t)) {
      return `Status still processing / dashboard zero: refreshing every hour does not move the queue.\n\n1. Copy the exact word on ${PORTAL}.\n2. Ask the campus desk if your record is uploaded.\n3. Weeks on the same word: ${ESUPPORT}. I will not invent a batch date.`
    }
  }

  if (intent === 'official-sources') {
    if (/i\s*just\s*(dey\s*)?(find|look\s*for)\s*(sense|direction)|point\s*me\s*(small|abeg)|which\s*(one|matter)\s*(i\s*)?(fit|should)\s*(ask|start)/i.test(t)) {
      return `Short menu (not live status):\n\n1. What NELFUND is: ${SITE}\n2. Sign in or apply: ${PORTAL}\n3. Ticket if the portal blocks you: ${ESUPPORT}\n\nReply with one line: apply, pending, JAMB, school list, login, or repayment.`
    }
  }

  return null
}
