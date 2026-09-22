import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://esupport.nelf.gov.ng/'

/** Angle-specific replies so the same intent does not paste one block. */
export function playbookHourly118(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/when\s*(will|go)\s*(they|dem|una)\s*(pay|release|credit)|has\s*(my|the)\s*loan\s*(been\s*)?(approved|paid|disbursed)/i.test(t)) {
      return `I cannot see your dashboard, so I cannot say the pay date from here.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school account. Upkeep is separate if it is approved.\n3. Same pending word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/mates|everybody|class\s*(don|have)\s*collect|name\s*(no|not).{0,12}list/i.test(t)) {
      return `Mates collecting does not mean yours failed.\n\n1. Institutions verify in batches, so files move at different times.\n2. Check the exact word on ${PORTAL}.\n3. If it has not moved for a long stretch, ask the campus desk, then ${ESUPPORT}.`
    }
    if (/money\s*(never|no)|alert\s*(never|no)|payment\s*(never|no)\s*(show|enter)|they\s*haven'?t\s*paid/i.test(t)) {
      return `No alert is not the same as declined.\n\n1. Confirm the status word on ${PORTAL}.\n2. Institutional charges go to the school, not your pocket.\n3. Still the same for a long time: campus desk, then ${ESUPPORT}.`
    }
    if (/dashboard\s*(still|same|no\s*change)|no\s*movement|application\s*(never|no)\s*move|na\s*pending/i.test(t)) {
      return `If the dashboard has not moved, the file is still in a queue.\n\n1. Refresh only after a few days. Refreshing daily does not speed it.\n2. Ask campus NELFUND desk whether your enrolment row is uploaded.\n3. Keep one account. Tickets: ${ESUPPORT}.`
    }
    return `Pending means the file is still waiting, usually on school verification.\n\n1. Copy the exact status on ${PORTAL}.\n2. Do not open a second account.\n3. Long wait: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /email|mail|registered last year|already/i.test(t)) {
    return `That email already has an account. Log in. Do not create a new one.\n\n1. Sign in at ${SITE}\n2. Forgot password: use reset on the same email.\n3. Still blocked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `If your school is missing from the list, the institution record is usually not on the portal yet.\n\n1. Confirm it is a public institution on this cycle.\n2. Ask the campus NELFUND desk to upload your data.\n3. Retry ${PORTAL}. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'refund') {
    return `If you or your parents already paid fees, NELFUND school charges still go to the school, not your pocket.\n\nAsk the campus bursary or NELFUND desk about their refund process. I will not invent a refund rule. Confirm the dashboard on ${PORTAL}.`
  }

  if (intent === 'how-to-apply' && /start|steps|take apply|wan(t)?\s*(the\s*)?loan|register/i.test(t)) {
    return `Start here, in this order:\n\n1. Use ${PORTAL}. Same email if you registered before.\n2. Complete NIN, BVN, JAMB, bank in your name.\n3. Request the loan only when the official window is open. I will not invent that date. Check ${SITE}.`
  }

  if (intent === 'official-sources' && /hello|hi|hey|good\s*(day|morning)|how\s*far|what\s*can\s*you\s*do|who\s*are\s*you/i.test(t)) {
    return `How far. I only help with NELFUND.\n\nAsk about apply, pending status, school not on the list, JAMB error, last year email, upkeep, or repayment.\n\nPortal: ${PORTAL}`
  }

  return null
}
