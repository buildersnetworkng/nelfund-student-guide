import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-114 replies. Different angle, different wording. No invented pay dates.
 */
export function playbookHourly114(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/how\s*far\s*(my\s*)?(own|one|side|matter)|how\s*far\s*(na\s*)?(with\s*)?(my\s*)?(nelfund|loan|application)/i.test(t)) {
      return `How far your own is only on the portal. This chat cannot open your file.\n\n1. Log in at ${PORTAL} and copy the exact status word.\n2. School charges go to the school. No SMS does not mean declined.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*(never|no|not)\s*(enter|drop|show|land)|e\s*never\s*(enter|drop|land)|i\s*never\s*see\s*(alert|money|credit)|no\s*(alert|credit)\s*(don|has)/i.test(t)) {
      return `If money never enter, first confirm the word on your dashboard. I cannot see your bank from here.\n\n1. Open ${PORTAL}. School fees go to the school, not always to your phone as SMS.\n2. Upkeep, if approved, goes to the account you saved. Confirm the account is yours and conventional.\n3. Still nothing after weeks on the same status: campus desk, then ${ESUPPORT}.`
    }
    if (/status\s*(still\s*)?(processing|pending)|application\s*(is\s*)?(still\s*)?(pending|processing)|e\s*still\s*dey\s*(pending|process)|stuck\s*(on|at)\s*(pending|processing)/i.test(t)) {
      return `Pending or processing is a waiting status. It is not an automatic decline.\n\n1. Stay on the same account at ${PORTAL}. Do not open a second one.\n2. Copy the exact word you see. That is what campus desk and eSupport need.\n3. Weeks on the same word with no change: ${ESUPPORT}.`
    }
    if (/approved\s*(but|sha)\s*(no|never)|successful\s*(but|sha)\s*(no|never)|they\s*have\s*not\s*(paid|credited)|una\s*never\s*(pay|credit)|dem\s*never\s*(pay|credit)/i.test(t)) {
      return `Approved on screen is not the same as money in your account.\n\n1. Check ${PORTAL} again. Institutional charges go to the school first.\n2. Upkeep uses the bank details you saved. Wrong account delays the alert.\n3. Still no movement: campus desk, then ${ESUPPORT}. I will not invent a pay date.`
    }
    if (/when\s*(will|go)\s*(i|una|dem)\s*(see|get|collect)\s*(my\s*)?(money|upkeep|alert)|wetin\s*(dey\s*)?happen\s*(to|with)\s*my/i.test(t)) {
      return `I cannot give a personal pay date from this chat.\n\n1. The only live word for your file is on ${PORTAL}.\n2. Official notices stay on ${SITE}, not WhatsApp rumours.\n3. File not moving after weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/file\s*(no|not|never)\s*(dey\s*)?(move|change)|no\s*movement|nothing\s*(don|has)\s*(drop|happen)|my\s*own\s*(never|no)\s*(enter|move)/i.test(t)) {
      return `If the file no dey move, treat the portal word as the source of truth.\n\n1. Screenshot or copy the status at ${PORTAL}.\n2. Ask the campus desk whether your record is complete.\n3. Still stuck: ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/cannot\s*create\s*(an?\s*)?account|email\s*(already\s*)?(used|taken)|i\s*registered\s*last\s*year/i.test(t)) {
      return `That email already has an account. Log in. Do not start a new one.\n\n1. Sign in at ${SITE} with the same mail.\n2. Use forgot password if you cannot remember it.\n3. A second account usually fails verification.`
    }
  }

  return null
}
