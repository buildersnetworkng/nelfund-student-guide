import type { IntentId } from './types'
import { playbookHourly110 } from './playbookHourly110'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-111 replies. Same pending intent, different angles.
 * No invented pay dates. No long dashes.
 */
export function playbookHourly111(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/how\s*far\s*(na\s*)?(my\s*)?(own|loan|file|application)/i.test(t)) {
      return `How far your own: I cannot open your file from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. Same word for weeks is usually school verification, not a broken form.\n3. Campus NELFUND desk first, then ${ESUPPORT}.`
    }
    if (/money\s*(never|no)\s*(enter|drop|show|land)|no\s*(credit\s*)?alert|una\s*never\s*pay/i.test(t)) {
      return `Money never enter does not mean declined.\n\n1. School charges go to the institution. You may get no SMS even after the school is paid.\n2. Upkeep, if you ticked it, can land later in the bank on your profile.\n3. Check the exact word on ${PORTAL}. I will not invent a pay date.`
    }
    if (/verified\s*(but|and)\s*(no|not|never)\s*(disburse|paid|enter)/i.test(t)) {
      return `Verified means early checks passed. It is not the same as disbursed.\n\n1. Final pay waits on your school uploading / confirming your data.\n2. After that the portal word should move. Watch ${PORTAL}, not rumours.\n3. Long stall after verified: campus desk, then ${ESUPPORT}.`
    }
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

  return playbookHourly110(intent, userText)
}
