import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-89 wording. Different angle per phrasing. No invented dates or amounts. */
export function playbookHourly89(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/upkeep\s*never|never\s*(drop|enter|credit)|no\s*credit|wallet\s*never|alert\s*never/i.test(t)) {
      return `If money or upkeep never entered, I cannot see your bank from this chat.\n\n1. Open ${PORTAL} and copy the exact status word (pending, approved, institutional verification).\n2. School fees go to the school first. Upkeep is separate. No SMS does not mean they declined you.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/batch|mates\s*don\s*collect|they\s*never\s*approve|under\s*consideration|institutional\s*verif|processing\s*since/i.test(t)) {
      return `Batch talk and "mates don collect" do not change your file. Only the word on your dashboard counts.\n\n1. Copy that exact status from ${PORTAL}.\n2. If it says institutional / school verification, push ICT or Registry to upload your record.\n3. Still frozen after they confirm: ${ESUPPORT}.`
    }
    if (/how\s*far|my\s*own|status\s*still|never\s*leave\s*pending/i.test(t)) {
      return `How far your own: I cannot open your file here.\n\n1. Sign in at ${PORTAL} and read the status line, not WhatsApp rumours.\n2. Pending or processing can sit for weeks. That is not a new deadline.\n3. If the word never changes after school confirms the record, use ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/just\s*wan(t)?\s*(to\s*)?ask|anybody\s*here|where\s*i\s*go\s*start|no\s*know\s*wetin\s*to\s*type|kindly\s*assist/i.test(t)) {
      return `I dey here. Say the problem in one line.\n\n1. Start or apply: ${PORTAL}\n2. Already registered last year: sign in at ${SITE}\n3. Pending / money never enter: paste the status word from ${PORTAL}\n4. JAMB, school missing, or repayment: type that plainly.\n\nOfficial: ${SITE} ${PORTAL} ${ESUPPORT}`
    }
  }

  if (intent === 'portal-login') {
    if (/cannot\s*create|already\s*(in\s*use|taken)|last\s*year|last\s*session/i.test(t)) {
      return `That mail already has an account. Do not sign up again.\n\n1. Sign in at ${SITE}.\n2. Only brand new students create an account on ${PORTAL}.\n3. Forgot password: reset on ${SITE}.\n4. Still locked: ${ESUPPORT}.`
    }
  }

  return null
}
