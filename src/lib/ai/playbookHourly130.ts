import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly130(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/dem\s*never\s*credit|never\s*credit\s*(my\s*)?(account|bank|wallet)|they\s*have\s*not\s*(paid|credited)|has\s*not\s*been\s*disbursed/i.test(t)) {
      return `No credit in your bank is not the same as a declined file.\n\n1. Open ${PORTAL} and read institutional charges and upkeep as two separate lines.\n2. School charges go to the school first, not your pocket.\n3. Confirm the account number on your profile is yours.\n4. I will not invent a pay date. Same blank line for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/una\s*pay\s*(my\s*)?(course\s*)?mates|course\s*mates?|mates?\s*(don|have)\s*(collect|receive)/i.test(t)) {
      return `Mates collecting first is common. It does not prove your file failed.\n\n1. Sign in at ${PORTAL} and copy the exact status sentence for your own dashboard.\n2. Ask the campus NELFUND desk if your record is in this batch.\n3. Do not open a second account while you wait.\n4. Long same word: ${ESUPPORT} with a screenshot of that status.`
    }
    if (/no\s*movement|application\s*no\s*update|e\s*never\s*move\s*since|processing\s*(for|since)|status\s*dey\s*(review|process)|file\s*(still\s*)?(dey|is)\s*(under\s*)?review|loan\s*still\s*on\s*pending/i.test(t)) {
      return `If the status word has not changed, treat it as a wait, not a new apply.\n\n1. Copy the exact word on ${PORTAL}. Pending, processing, and under review are all wait states.\n2. School charges wait on the institution upload and confirmation.\n3. I cannot see your file from this chat, so I will not guess a date.\n4. Weeks on the same word: campus desk, then ${ESUPPORT}.`
    }
    if (/institutional\s*charges?|upkeep\s*(approved|ok)\s*but/i.test(t)) {
      return `Institutional charges and upkeep do not land the same way.\n\n1. Charges go to the school. Upkeep goes to the bank account on your profile if you ticked it in that session.\n2. Check both lines on ${PORTAL}.\n3. Approved on screen is not a bank alert.\n4. I will not invent amounts. Stuck: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'how-to-apply') {
    if (/how\s*i\s*go\s*start|first\s*thing|where\s*i\s*go\s*begin|i\s*wan\s*start|walk\s*me\s*through|guide\s*me\s*(make\s*i|to)\s*apply/i.test(t)) {
      return `Start with one account, not rumours.\n\n1. Confirm your public school can appear on the portal list.\n2. Create or sign in at ${PORTAL}. If the email was used last year, log in at ${SITE} instead.\n3. Finish JAMB, NIN, and BVN on the profile.\n4. Use Request for Student Loan only when the official loan window is confirmed. I will not invent that date.`
    }
  }

  return null
}
