/**
 * Clarification + refined apply answers (loan + upkeep).
 * Imported by conversation so follow-ups never reset to welcome.
 */
import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function isClarificationFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!?.]+$/g, '').trim()
  if (!t || t.length > 140) return false
  if (/^(i\s*)?(meant|mean|was\s*asking|am\s*asking)\b/i.test(t)) return true
  if (/^(i\s*)?(mean|meant)\s*(for|about|the|on)\b/i.test(t)) return true
  if (/^(no,?\s*)?(for\s+)?(the\s+)?(loan|upkeep|fees?|stipend|both)\b/i.test(t) && t.length < 80) return true
  if (/\b(loan\s+and\s+upkeep|upkeep\s+and\s+(the\s+)?loan|both\s+(loan|upkeep)|fees?\s+and\s+upkeep)\b/i.test(t))
    return true
  if (/^(actually|rather|instead)\b/i.test(t) && t.length < 90) return true
  return false
}

export function loanAndUpkeepApplyAnswer(): string {
  return (
    `**How to apply for the loan (school charges) and upkeep**\n\n` +
    `1. Confirm your school is listed and your record is uploaded.\n` +
    `2. Sign in at ${PORTAL} with the same email (do not open a second account).\n` +
    `3. Complete profile: JAMB, NIN, BVN, and a bank account **in your name**.\n` +
    `4. When the official loan window is open, use **Request for Student Loan**.\n` +
    `5. **Institutional charges** (school fees) go to the school. Tick **upkeep** in the same session if you want living support — it goes to your bank account.\n` +
    `6. I will not invent open dates or amounts. Confirm the window on ${SITE}.\n\n` +
    `${PORTAL}`
  )
}

export function refineClarificationAnswer(priorIntent: IntentId | null | undefined, userText: string): string | null {
  if (!isClarificationFollowUp(userText)) return null
  if (priorIntent === 'how-to-apply' || /loan|upkeep|apply/i.test(userText)) {
    return loanAndUpkeepApplyAnswer()
  }
  return null
}
