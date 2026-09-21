import type { IntentId } from './types'
import { playbookHourly103 } from './playbookHourly103'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Angle-specific replies for hour 104.
 * Pending-status remains the largest named unknown topic after other.
 */
export function playbookHourly104(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/wetin\s*dey\s*hold|what\s*is\s*holding|why\s*(e|it|my\s*file)\s*(no|not)\s*move/i.test(t)) {
      return `I cannot see what is holding the file from this chat.\n\n1. Copy the exact status word on ${PORTAL}.\n2. School line and upkeep line can wait on different desks.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/approved\s*but|has\s*nelfund\s*paid|when\s*will\s*i\s*(see|get)\s*(the\s*)?(money|alert)/i.test(t)) {
      return `Approved on screen is not the same as money in your bank.\n\n1. Check both status words on ${PORTAL}.\n2. School charges go to the school. You may get no personal SMS.\n3. Upkeep only if you ticked it, into the bank on your profile.\n4. I will not invent a credit day. Long wait: ${ESUPPORT}.`
    }
    if (/batch|mates|classmates|everybody\s*(don|have)\s*(collect|get)/i.test(t)) {
      return `Another batch or classmate is not your file.\n\n1. Sign in at ${PORTAL} and copy YOUR status word.\n2. Do not open a second account because others got paid.\n3. Long same word: campus desk, then ${ESUPPORT}.`
    }
    if (/dashboard\s*(0|zero|empty)|nothing\s*don\s*(show|drop)|i\s*never\s*see\s*(my\s*)?(own|alert)/i.test(t)) {
      return `Empty dashboard or no alert is a wait, not a new apply.\n\n1. Stay on the same account at ${PORTAL}.\n2. Copy the word exactly as shown.\n3. I will not invent a pay date. Ticket if it stays: ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    if (/cut\s*(my\s*)?salary|gsi|salary\s*deduct/i.test(t)) {
      return `Salary cut / GSI only follows official NELFUND rules later, not a date I invent.\n\n1. Confirm on ${SITE} and ${PORTAL}.\n2. Still studying or serving: you are not in a repayment window I can invent.\n3. Ignore WhatsApp percentages.`
    }
    if (/when\s*(i|we)\s*(go|will)\s*(start\s*)?(pay|repay)|after\s*(service|nysc)/i.test(t)) {
      return `Repayment starts after the applicable NYSC or study period under the Act, not on a date from this chat.\n\n1. Read the live rule on ${SITE}.\n2. I will not invent a start month or percentage.\n3. Portal copy: ${PORTAL}.`
    }
  }

  return playbookHourly103(intent, userText)
}
