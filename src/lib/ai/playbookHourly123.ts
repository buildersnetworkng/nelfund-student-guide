import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly123(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/approved\s*(but|yet)|loan\s*approved\s*no\s*cash|disburse|no\s*disbursement/i.test(t)) {
      return `Approved on the dashboard is not the same as money in your bank. I will not invent a pay day.\n\n1. Copy the exact status word on ${PORTAL}.\n2. School charges go to the school first. Upkeep (if approved) goes to the account on your profile.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/mates|everybody|others|class\s*(don|have)\s*collect|una\s*don\s*pay\s*(others|everybody)|i\s*remain/i.test(t)) {
      return `Other students getting paid first does not cancel your file. Batches move at different times.\n\n1. Check ${PORTAL} and copy the exact word you see.\n2. Ask the campus NELFUND desk if your record is complete.\n3. Still the same after that: ${ESUPPORT}. I will not invent a date.`
    }
    if (/when\s*(will|go)\s*(my\s*)?(own|money|upkeep)|wetin\s*happen\s*to\s*my|progress\s*on\s*my|track\s*am|status\s*check|how\s*far\s*una\s*reach/i.test(t)) {
      return `I cannot see your file from this chat, so I will not guess a date.\n\n1. Open ${PORTAL} and read the status line yourself.\n2. If it still says pending or processing, wait on that word. No SMS does not mean declined.\n3. Weeks with no change: campus desk, then ${ESUPPORT}.`
    }
    if (/kobo|zero\s*naira|bank\s*(still\s*)?(empty|blank)|wallet\s*never|cash\s*never|i\s*don\s*see\s*(any\s*)?(credit|alert)/i.test(t)) {
      return `Empty bank does not automatically mean they rejected you.\n\n1. Confirm the status word on ${PORTAL}.\n2. Institutional charges do not land in your pocket. Upkeep only lands if that line was approved.\n3. Same empty result for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/just\s*dey\s*here|i\s*land|wetin\s*una\s*dey\s*help|yarn\s*me\s*small|give\s*me\s*options|brief\s*me|show\s*options/i.test(t)) {
      return `Tell me the one thing you need:\n\n- create account or how to apply\n- pending / how far / money never enter\n- JAMB, email used, or school not on the list\n- upkeep or repayment\n\nOfficial pages only: ${SITE} and ${PORTAL}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email|mail|duplicate|taken|last\s*year|sign\s*up\s*page/i.test(t)) {
      return `That email already has an account. Sign in. Do not create a second one.\n\nLogin: ${SITE}\nForgot the password? Reset it on the same email. Still blocked: ${ESUPPORT}.`
    }
  }

  return null
}
