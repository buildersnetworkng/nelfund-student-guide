import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-90 wording. Different angle per phrasing. No invented dates or amounts. */
export function playbookHourly90(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/approved\s*but|i\s*see\s*approved|dem\s*pay\s*my\s*padi|school\s*don\s*confirm/i.test(t)) {
      return `Approved on screen is not the same as money in your bank. I cannot see your account from here.\n\n1. Sign in at ${PORTAL} and copy the exact status plus any payment or disbursement line.\n2. School fees go to the school first. Upkeep is a separate later step.\n3. If the word stays Approved and nothing hits the bank after school confirms, use ${ESUPPORT}.`
    }
    if (/how\s*long|when\s*(will|go)\s*(they|dem)\s*pay|pending\s*for\s*(weeks|months)|nothing\s*don\s*enter|bank\s*(never|no)\s*(alert|credit)/i.test(t)) {
      return `Nobody in this chat can give a personal pay date. NELFUND does not publish a private countdown for your file.\n\n1. Check ${PORTAL} for the current status word only.\n2. Weeks on pending is common. It is not a new deadline and it is not proof they declined you.\n3. Same word for a long stretch after school confirms: campus desk, then ${ESUPPORT}.`
    }
    if (/e\s*still\s*dey|status\s*(no|never)\s*(change|move)|dashboard\s*still|i\s*don\s*apply\s*but\s*nothing|dem\s*never\s*pay\s*me|account\s*never/i.test(t)) {
      return `E still dey pending? I cannot open your dashboard here.\n\n1. Open ${PORTAL} yourself and copy the exact word you see.\n2. If it never moves, ask ICT or Registry whether they have uploaded your record.\n3. After they confirm and the word still no change, ticket ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/wetin\s*una\s*fit\s*help|just\s*dey\s*here|abeg\s*guide|help\s*me\s*abeg|where\s*to\s*start/i.test(t)) {
      return `I fit help. Type the one thing wey dey worry you.\n\n1. Create account or apply: ${PORTAL}\n2. Mail wey you use last year: sign in at ${SITE}, no new signup\n3. Pending or money never enter: paste the status word from ${PORTAL}\n4. JAMB fail or school no dey list: say that plainly.\n\nOfficial: ${SITE} ${PORTAL} ${ESUPPORT}`
    }
  }

  if (intent === 'portal-login') {
    if (/mail\s*(don|has)|email\s*don|same\s*(mail|email)\s*last|cannot\s*sign\s*up|account\s*already\s*exist/i.test(t)) {
      return `That email already belongs to an account. Do not create another one.\n\n1. Sign in at ${SITE}.\n2. New signup on ${PORTAL} is only for people who never registered.\n3. Forgot password: reset on ${SITE}.\n4. Still locked after reset: ${ESUPPORT}.`
    }
  }

  return null
}
