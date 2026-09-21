import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-94 wording. Angle-specific pending answers. No invented dates or amounts. */
export function playbookHourly94(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/mates?\s*(don|have)|people\s*don\s*collect|una\s*don\s*pay\s*my\s*mates/i.test(t)) {
      return `Mates collecting does not move your file. Batches are not the same for every student.\n\n1. Sign in at ${PORTAL} and copy YOUR status word, not your friend's.\n2. School charges go to the school. Upkeep is separate.\n3. Same word for weeks after campus desk confirms your record: ${ESUPPORT}.`
    }
    if (/dem\s*never\s*pay|una\s*never\s*(pay|credit)|when\s*(will|go).{0,20}pay|when\s*(will|go)\s*i\s*(get|collect|see)/i.test(t)) {
      return `I cannot give a pay date. Only the portal status is real.\n\n1. Open ${PORTAL} and read pending, processing, submitted, or approved.\n2. No SMS does not mean declined.\n3. Still the same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/nothing\s*(don|has)\s*drop|no\s*(credit\s*)?alert|dashboard\s*(still\s*)?(zero|0|blank)|account\s*(still\s*)?(empty|zero)|batch\s*(never|no)/i.test(t)) {
      return `Blank dashboard or no alert is not a decline by itself.\n\n1. Refresh ${PORTAL} on a clean browser and copy the exact word.\n2. Ask campus desk if your record is on this cycle list.\n3. After they confirm and nothing changes: ${ESUPPORT}.`
    }
    if (/approved\s*but/i.test(t)) {
      return `Approved on screen is not the same as money in your bank.\n\n1. Keep a screenshot of the approved word on ${PORTAL}.\n2. Ask bursary / NELFUND desk whether the school charge already landed.\n3. Upkeep still empty after that: ${ESUPPORT}. Official site: ${SITE}`
    }
    if (/check\s*(my\s*)?(application|status|loan)|wetin\s*dey\s*happen\s*to\s*my/i.test(t)) {
      return `I cannot open your file from this chat.\n\n1. Sign in at ${PORTAL} yourself and read the status word.\n2. Paste that word here if you want the next step for that exact word.\n3. I will not guess a batch or a date.`
    }
    if (/i\s*apply\s*(last\s*year|since)/i.test(t)) {
      return `Last cycle and this cycle are different files.\n\n1. Sign in at ${PORTAL} with the same email. Do not create a new account.\n2. Check whether a new application is even open this cycle.\n3. Old pending that never moved: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification' && /jamb|utme|verification\s*fail/i.test(t)) {
    return `Invalid JAMB means the number did not match, not that the loan is closed.\n\n1. Type the full number with no extra space on ${PORTAL}.\n2. Use the same number JAMB and your admission papers use.\n3. Still fail: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /(email|mail|register|last\s*year)/i.test(t)) {
    return `If you registered last year, that email already has an account. Log in. Do not create a new one.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /school|institution|list|showing/i.test(t)) {
    return `If the school is not on the list, the application cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing after they confirm: ${ESUPPORT}.`
  }

  return null
}
