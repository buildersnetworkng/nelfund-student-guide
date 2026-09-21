import type { IntentId } from './types'
import { playbookHourly101 } from './playbookHourly101'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Angle-specific replies for hour 102. Pending is the largest named unknown topic.
 */
export function playbookHourly102(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/how\s*far|wetin\s*dey\s*happen|any\s*update|update\s*on\s*my/i.test(t)) {
      return `How far on your file is only on the portal. I cannot open your dashboard from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. School fees and upkeep can move on different days.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*(never|no)|never\s*(enter|land|drop)|no\s*(alert|credit)|kobo|naira\s*no/i.test(t)) {
      return `No alert does not automatically mean declined.\n\n1. Check ${PORTAL} for the status word, not only your bank SMS.\n2. School charges go to the school account, not always to you.\n3. Upkeep only if you ticked it, into a bank in your name.\n4. I will not invent a pay date. Long wait: ${ESUPPORT}.`
    }
    if (/classmates?|everybody|except\s*me|dem\s*(don|have)\s*(collect|pay)/i.test(t)) {
      return `Other students collecting is not your file.\n\n1. Open YOUR profile on ${PORTAL} and copy YOUR status word.\n2. Do not create a second account because a friend got paid.\n3. Batches can clear school line and upkeep line separately.\n4. Still stuck: campus desk, then ${ESUPPORT}.`
    }
    if (/under\s*review|processing|pending|same\s*(word|status)|e\s*no\s*move|nothing\s*(don|has)\s*change/i.test(t)) {
      return `Pending / under review / processing means wait on that same file.\n\n1. Stay on ${PORTAL}. Copy the word you see.\n2. Do not start a new registration for the same person.\n3. If the word has not moved for a long stretch: campus NELFUND desk, then ${ESUPPORT}.\n4. I will not invent a clearance date.`
    }
    if (/when\s*(go|will)\s*(my\s*)?(money|upkeep)|approved\s*(but|yet)/i.test(t)) {
      return `Approved on screen is not the same as cash in your phone.\n\n1. Re-check ${PORTAL} in case the word changed.\n2. School payment may never SMS you.\n3. Upkeep uses the bank account in your name on the form.\n4. I will not invent when it will drop. Stuck: ${ESUPPORT}.`
    }
  }

  return playbookHourly101(intent, userText)
}
