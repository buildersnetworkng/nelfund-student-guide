import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-73 angle-specific lines. No invented deadlines. No long dashes.
 */
export function playbookHourly73(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (/help|assist|confused|confus|explain\s*am|wetin\s*i\s*(go|suppose)\s*do|guide\s*me/i.test(t)) {
      return `I can help with **NELFUND** only.\n\nPick one line:\n1. How to apply\n2. Application still pending / money never enter\n3. School not on the list or missing information\n4. JAMB / login / email already used\n5. Repayment\n\nOfficial pages: ${SITE} and ${PORTAL}. I will not guess live status.`
    }
  }

  if (intent === 'repayment') {
    return `**Pay back / after NYSC:** repayment starts only after the official grace that NELFUND publishes on ${SITE}. I will not invent a date or interest figure.\n\n1. Read the live FAQ on ${SITE}.\n2. Keep the same BVN and bank you used on ${PORTAL}.\n3. Questions the site does not answer: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB / UTME no gree:** type the registration exactly as on the admission letter.\n\n1. No extra space or missing digit.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still needs a real JAMB number.\n4. Still failing: campus desk, then ${ESUPPORT}. Do not open a second account.`
  }

  if (intent === 'portal-login') {
    return `**Email you used last year is still the account.** Sign in at ${SITE}. Use forgot password if you cannot remember it. Do not create a new mail. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School / poly / college no dey the list.** Search the full official name on ${PORTAL}. Ask ICT or Registry if this session record is uploaded. Private schools outside the scheme will not appear. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'pending-application') {
    return `**File still the same / mates don collect:** this chat cannot open your record.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. Class group pay lists are not official.\n3. Fees and upkeep can move on different days.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}. I will not invent when money will enter.`
  }

  return null
}
