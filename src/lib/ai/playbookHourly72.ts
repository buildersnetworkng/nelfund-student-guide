import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-72 angle-specific lines. Same intent, different wording, different answer.
 */
export function playbookHourly72(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/how\s*far|where\s*.{0,12}reach|any\s*update|wetin\s*(dey\s*)?happen/i.test(t)) {
      return `**How far your own:** this chat cannot open the file.\n\n1. Sign in at ${SITE}, then check ${PORTAL}. Copy the exact word you see (pending, submitted, under review).\n2. That word is the update. Class group lists are not official.\n3. School fees and upkeep can move on different days.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*never|never\s*(enter|drop|reflect|show)|alert\s*never|dem\s*never\s*pay|i\s*never\s*see/i.test(t)) {
      return `**Money never enter / alert never come:** no SMS does not mean declined.\n\n1. Open ${PORTAL} and read the exact status. Do not invent a date from WhatsApp.\n2. Institutional charges go to the school first. Upkeep goes to your bank after that process moves.\n3. Confirm the account on the portal is yours.\n4. Still blank after a long wait: campus desk, then ${ESUPPORT}.`
    }
    if (/still\s*(processing|pending)|status\s*(still|stil)|no\s*change|e\s*never\s*move|my\s*own\s*never\s*move/i.test(t)) {
      return `**Status still processing / no change:** treat the portal sentence as the live record.\n\n1. Write down the exact phrase on ${PORTAL}.\n2. Do not open a second account while it hangs.\n3. Ask the campus NELFUND desk if this session record is uploaded.\n4. Frozen for a long time: ${ESUPPORT}. I will not invent when it will move.`
    }
    if (/approved\s*but|dem\s*approve/i.test(t)) {
      return `**Approved but money no dey:** approval on screen is not the same as cash in bank.\n\n1. Check ${PORTAL} again for disbursement or institutional payment notes.\n2. Ask the bursary / NELFUND desk if the school side has received anything.\n3. Confirm BVN and account on the portal.\n4. Still nothing after the school confirms: ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    return `**This email don dey / you registered before.** Log in at ${SITE}. Do not create a new account with another mail. Forgot password: use reset on ${SITE}. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey the list.** Search the full official name on ${PORTAL}. Ask ICT / Registry if the record is uploaded for this session. Private schools are outside this scheme. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB number no valid / verification failed.**\n\n1. Type it exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still needs a real JAMB registration.\n4. Still failing: campus desk, then ${ESUPPORT}. Do not open a second account.`
  }

  return null
}
