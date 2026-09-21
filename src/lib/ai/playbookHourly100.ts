import type { IntentId } from './types'
import { playbookHourly99 } from './playbookHourly99'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour 100: JAMB angles first, then hour-99 pending/menu. */
export function playbookHourly100(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'jamb-verification') {
    if (/caps|old\s*jamb|202[0-5]|direct\s*entry|last\s*year\s*jamb/i.test(t)) {
      return `Old year JAMB or CAPS mismatch is a record issue, not a new account.\n\n1. Retype the exact UTME / DE number on ${PORTAL}. No extra space.\n2. Name and date of birth must match NIN.\n3. Ask campus records if CAPS or the school list still holds that year.\n4. Still fail: ${ESUPPORT}. Do not open a second profile.`
    }
    if (/invalid|not\s*valid|no\s*valid|wrong\s*jamb|e\s*say\s*invalid|portal\s*(say|says)/i.test(t)) {
      return `Invalid JAMB on the portal means the number did not match their check.\n\n1. Open ${PORTAL} and type the number again slowly.\n2. Use the same names as NIN. Nickname will fail.\n3. I will not invent a workaround code.\n4. Still invalid: campus desk, then ${ESUPPORT}.`
    }
    if (/verification\s*failed|verify\s*(fail|no\s*gree)|cannot\s*verify|nelfund\s*no\s*gree\s*(my\s*)?jamb/i.test(t)) {
      return `Verification failed on JAMB is a match fail, not a closed loan window.\n\n1. Recheck UTME digits on ${PORTAL}.\n2. Align NIN names and date of birth.\n3. Do not create another email to retry.\n4. Still failed: ${ESUPPORT}. FAQ: ${FAQ}.`
    }
    if (/utme|jamb\s*(no|number|reg)/i.test(t)) {
      return `The JAMB / UTME field must match JAMB records exactly.\n\n1. Copy the number from your slip, then paste once on ${PORTAL}.\n2. Clear extra spaces before submit.\n3. Still bounce: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'pending-application') {
    if (/bank\s*app|alert\s*never|stipend\s*never|upkeep\s*never\s*show/i.test(t)) {
      return `Bank app still empty is a wait on the file, not a new apply.\n\n1. Copy the exact status word from ${PORTAL}.\n2. School line can clear with no personal SMS.\n3. Upkeep only if you ticked it, into a bank in your name.\n4. I will not invent a credit day. Long same word: ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login' && /email|already\s*exist|register(ed)?\s*(before|last)|cannot\s*(sign\s*up|create)/i.test(t)) {
    return `That email already has a NELFUND profile. Log in. Do not create another.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /uni\s*no\s*dey|poly\s*no\s*dey|institution\s*(no|not)|search\s*(no|not)\s*(bring|show)|school\s*name\s*no\s*dey/i.test(t)) {
    return `If search does not bring your school, the file cannot attach yet.\n\n1. Try the full official name on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  return playbookHourly99(intent, userText)
}
