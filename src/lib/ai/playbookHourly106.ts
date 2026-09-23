import type { IntentId } from './types'
import { playbookHourly104 } from './playbookHourly104'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-106 replies. Cycle with 111 broken — do not call playbookHourly111 from here.
 */
export function playbookHourly106(intent: IntentId, userText?: string): string | null {
  // Cycle broken: do not call playbookHourly111 from 106

  const t = userText || ''

  if (intent === 'pending-application') {
    if (/why.{0,20}(pending|no\s*money|never\s*enter|still\s*wait)|wetin\s*(make|cause).{0,16}(pending|no\s*enter)/i.test(t)) {
      return `Why it can stay pending: the portal is waiting on a school record or a batch, not on this chat.\n\n1. Copy the exact status word from ${PORTAL}. I cannot see your file.\n2. School charges go to the institution first. No personal alert is normal.\n3. I will not invent a pay date. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/what\s*(should|will|can)\s*i\s*do|wetin\s*i\s*go\s*do|what'?s\s*next|first\s*step|so\s*what\s*now/i.test(t)) {
      return `Next step for a pending file:\n\n1. Sign in at ${SITE} and open ${PORTAL}. Write down the exact status word.\n2. Ask the campus NELFUND desk if your student record is uploaded for this session.\n3. Do not create a second account. Ticket ${ESUPPORT} only after that check.`
    }
    if (/how\s*(do\s*i|to)\s*(check|track|confirm)|abeg\s*(check|look)|please\s*(confirm|check)\s*(my\s*)?status/i.test(t)) {
      return `How to check (I cannot open your dashboard from here):\n\n1. Sign in with the same email at ${SITE}, then ${PORTAL}.\n2. Copy the exact word: Pending, Under review, Approved, or Declined.\n3. School paid is not the same as upkeep paid. Long same-word wait: ${ESUPPORT}.`
    }
    if (/money\s*(never|no)|no\s*(kobo|naira|alert)|account\s*(empty|zero)|e\s*never\s*(enter|drop|land)/i.test(t)) {
      return `Money never enter is still your portal status, not a new apply.\n\n1. Institutional charges go to the **school**. You can wait with no personal credit alert.\n2. Upkeep only if you ticked it in the same session, and it can land later into the bank on your profile.\n3. Copy the exact word on ${PORTAL}. I will not invent a pay date. Long wait: ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/i\s*just\s*(dey\s*)?(find|look\s*for)\s*(sense|direction)|point\s*me\s*(small|abeg)|which\s*(one|matter)\s*(i\s*)?(fit|should)\s*(ask|start)/i.test(t)) {
      return `Short menu (not live status):\n\n1. What NELFUND is: ${SITE}\n2. Sign in or apply: ${PORTAL}\n3. Ticket if the portal blocks you: ${ESUPPORT}\n\nReply with one line: apply, pending, JAMB, school list, login, or repayment.`
    }
  }

  return playbookHourly104(intent, userText)
}
