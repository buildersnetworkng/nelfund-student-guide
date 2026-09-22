import type { IntentId } from './types'
import { playbookHourly104 } from './playbookHourly104'
import { playbookHourly110 } from './playbookHourly110'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-106 replies plus hour-110 on the live playbook path.
 */
export function playbookHourly106(intent: IntentId, userText?: string): string | null {
  const from110 = playbookHourly110(intent, userText)
  if (from110) return from110

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
    if (/has\s*(my\s*)?(loan|application)\s*(been\s*)?(approved|paid)|any\s*(hope|movement|update)/i.test(t)) {
      return `Hope / approved-or-not lives on the portal, not in this chat.\n\n1. Open ${PORTAL} and copy the exact status sentence.\n2. Approved is not the same as money in your bank.\n3. I will not invent a batch list. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (
      /help|halp|helep|asist|assist|guide|gide|menu|confused|confuzed|lost|stranded|where\s*to\s*start|orientate|direct\s*me|wetin\s*i\s*(suppose|go)\s*do|una\s*fit\s*help|i\s*wan\s*ask|how\s*e\s*take\s*work|show\s*me\s*road|gimme\s*(menu|options)|i\s*no\s*get\s*direction|una\s*dey\s*there|i\s*dey\s*new|first\s*timer|brief\s*me|talk\s*to\s*me\s*small|how\s*(this|dis)\s*(thing|matter)\s*(dey\s*)?work|na\s*how\s*(e|this|dis)\s*take\s*be/i.test(
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
    if (/email|last\s*year|register|password|old\s*account|mail\s*(don|already)/i.test(t)) {
      return `Last year register usually means reuse the same portal account.\n\n1. Try forgot password at ${PORTAL}.\n2. Do not open a second email unless official support says so.\n3. Stuck: ${ESUPPORT}.`
    }
  }

  return playbookHourly104(intent, userText)
}
