import type { IntentId } from './types'
import { playbookHourly134 } from './playbookHourly134'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific pending answers so paraphrases do not share one dump. */
export function playbookHourly133(intent: IntentId, userText: string): string | null {
  const newer = playbookHourly134(intent, userText)
  if (newer) return newer
  const t = userText || ''
  if (intent !== 'pending-application') return null

  if (/has\s*(my\s*)?(loan|application|file)\s*been\s*(processed|approved|paid)|processed\s*yet|any\s*movement/i.test(t)) {
    return `I cannot see whether your file has been processed from this chat.\n\n1. Open ${PORTAL} and copy the exact status word (Submitted, Pending, Under review, Approved, Declined).\n2. Processed is not the same as money in your bank. School charges go to the school first.\n3. I will not invent a processed date. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/kobo\s*(never|no)\s*(drop|enter)|zero\s*kobo|e\s*never\s*drop\s*(kobo|one\s*naira)/i.test(t)) {
    return `Kobo never drop is still a wait on your file, not a new apply.\n\n1. Institutional charges go to the school, so your personal account can stay at zero even after the school is paid.\n2. Upkeep only if you ticked it in the same session, and only into the bank on your profile.\n3. Copy the exact status word from ${PORTAL}. I will not invent a pay date.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
  }

  if (/wetin\s*dey\s*delay\s*(my\s*)?(own|loan|file)|why\s*(my\s*)?(payment|payout|upkeep|money)\s*(dey\s*)?delay/i.test(t)) {
    return `I will not invent why your own is delayed.\n\nCommon real checks: school record not uploaded yet, batch still processing, or upkeep ticked later than institutional charges.\n\n1. Copy the exact status word from ${PORTAL}.\n2. Ask the campus NELFUND desk if your record is uploaded for this session.\n3. Same word for a long time: ${ESUPPORT}. Do not pay an agent.`
  }

  if (/have\s*(they|dem|una)\s*remitted\s*(my\s*)?(school\s*)?fees?|remit(ted)?\s*(my\s*)?(school|fees)/i.test(t)) {
    return `Only your school bursary and ${PORTAL} can confirm a remittance. I cannot see it from this chat.\n\n1. Check whether institutional charges show paid or pending on ${PORTAL}.\n2. Ask the campus NELFUND / bursary desk if the school received the remittance.\n3. That is separate from upkeep into your own bank.\n4. I will not invent an amount or date. Still unclear: ${ESUPPORT}.`
  }

  if (/portal\s*still\s*(say|shows?|dey\s*show)\s*(submitted|pending)|never\s*leave\s*submitted|stuck\s*(on|at)\s*submitted/i.test(t)) {
    return `Stuck on Submitted / still showing Pending means the file has not moved to the next official word yet.\n\n1. Stay on the same login at ${SITE}. Do not create a second account to force a move.\n2. Ask the campus desk if your student record is uploaded.\n3. Copy the exact sentence from ${PORTAL}. I will not invent how many days Submitted lasts.\n4. Long same-word wait: ${ESUPPORT}.`
  }

  if (/pending\s*loans?\s*(is\s*)?(0|zero)|i\s*dey\s*see\s*pending\s*loans?\s*0/i.test(t)) {
    return `Pending loans 0 on the dashboard is usually a record or login issue, not a payout date.\n\n1. Sign in at ${SITE} with the same email. Do not open a second account.\n2. Confirm you land on ${PORTAL}.\n3. Ask the campus NELFUND desk if your record is uploaded for this session.\n4. Still 0: ticket ${ESUPPORT} with name, school, and that email.`
  }

  if (/nelfund\s*matter\s*still\s*dey|still\s*dey\s*(one\s*place|the\s*same)|na\s*only\s*pending\s*i\s*dey\s*see|loan\s*still\s*dey\s*(the\s*)?same\s*place/i.test(t)) {
    return `Matter still dey one place is a pending-status wait.\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your file from this chat.\n2. School charges go to the institution. No personal alert does not mean declined.\n3. I will not invent a batch or pay date.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  return null
}
