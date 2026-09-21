import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

/** Hour-85 wording. Pending angles differ by phrase. No invented dates. No long dashes. */
export function playbookHourly85(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/how\s*far\s*(my\s*)?(own|one|application|loan|file)|my\s*(own|one)\s*how\s*far|wetin\s*(dey\s*)?happen\s*(to\s*)?(my\s*)?(own|loan)/i.test(t)) {
      return `How far your own is a portal check, not a new apply.\n\n1. Sign in at ${PORTAL} and copy the exact word: submitted, processing, under review, or approved.\n2. I cannot see your file from this chat.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}. I will not invent a pay date.`
    }
    if (/money\s*(never|no|not)\s*(enter|drop|show|come|land)|nothing\s*don\s*(drop|enter)|no\s*(money|alert|credit)|account\s*(still\s*)?(quiet|empty|zero)|mates?\s*(don|have)\s*(collect|receive)/i.test(t)) {
      return `Money never enter is not the same as declined.\n\n1. School charges go to the institution first. Your bank can stay quiet while that happens.\n2. Upkeep only if you ticked it for that session, and only into the bank on your profile.\n3. Copy the portal word at ${PORTAL}. I will not invent a credit date. Long wait on the same word: ${ESUPPORT}.`
    }
    if (/pending|processing|under\s*review|status\s*(is\s*)?(still|dey)/i.test(t)) {
      return `Pending or processing means your file is still on the queue, not that you should apply again.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. Do not open a second account to force movement.\n3. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}. I will not invent how many days it lasts.`
    }
    if (/batch|dashboard\s*(0|zero|blank)|total\s*loans?\s*(na\s*)?(0|zero)|dem\s*(skip|forget|leave)/i.test(t)) {
      return `Batch miss or dashboard zero is still a portal and school-record check.\n\n1. Confirm you are in the same account at ${PORTAL}.\n2. Ask the campus NELFUND desk if your record and session were uploaded.\n3. I will not invent a batch date. Still blank after school confirms: ${ESUPPORT}.`
    }
    if (/submitted|i\s*don\s*submit|apply\s*(finish|done)/i.test(t)) {
      return `Submitted with no news is common while school confirmation or a batch moves.\n\n1. Keep the same account. Check ${PORTAL} for the live word.\n2. No SMS is not a decline.\n3. Same quiet stretch for weeks: campus desk, then ${ESUPPORT}. I will not invent a pay week.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid|not\s*valid|verification\s*(failed|fail)|jamb/i.test(t)) {
      return `Invalid JAMB on the portal is a number or CAPS mismatch, not a new scheme.\n\n1. Type the JAMB / UTME number exactly as on your admission slip.\n2. Direct Entry still uses the number JAMB issued you.\n3. Still failing after a careful retry: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email|registered\s*last|cannot\s*create/i.test(t)) {
      return `That email already exists. Do not create another account.\n\n1. Sign in at ${SITE} with the same mail from last year or last session.\n2. Forgot password: use official reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
    }
  }

  if (intent === 'school-not-found') {
    if (/school|institution|no\s*dey\s*list/i.test(t)) {
      return `School not showing is usually a school-upload issue, not a typing trick.\n\n1. Ask ICT / Registry / NELFUND desk to confirm your institution and your record are on the NELFUND list.\n2. Then retry ${PORTAL}.\n3. Still missing after they confirm: ${ESUPPORT}.`
    }
  }

  return null
}
