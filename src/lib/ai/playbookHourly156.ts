const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 156: OTP/scam Pidgin, documents, school not listed. No invented amounts. */
export function playbookHourly156(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/otp|one[- ]time|share\s*(my\s*)?(pin|password|nin|bvn)|agent|whatsapp\s*(man|guy)|make\s*i\s*pay/i.test(t)) {
    return (
      '**Stay safe — OTP and agents**\n\n' +
      '- Never share OTP, password, PIN, NIN or BVN with anyone who messages you.\n' +
      '- Never pay anyone to “process” NELFUND.\n' +
      `- Apply only on ${PORTAL} · login ${LOGIN}\n` +
      `- Official tickets: ${ESUPPORT}`
    )
  }

  if (/wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|which\s*(paper|doc)/i.test(t)) {
    return (
      '**What to have ready**\n\n' +
      '• JAMB number / admission letter\n' +
      '• NIN and BVN\n' +
      '• Bank account in **your** name\n' +
      '• Matriculation number when the school has issued it\n\n' +
      `Upload only on ${PORTAL}. Never send papers to an agent.`
    )
  }

  if (/school\s*(no|not|never)\s*(dey|show)|not\s*listed/i.test(t)) {
    return (
      '**School not on the list**\n\n' +
      'Usually the school has not finished uploading your record.\n' +
      '1. Confirm it is a public institution.\n' +
      '2. Ask the campus NELFUND desk about the upload.\n' +
      `3. Retry ${PORTAL}. Still failing: ${ESUPPORT}.`
    )
  }

  if (intent === 'loan-or-scholarship' && /wetin|abeg|na\s*(scholarship|grant)/i.test(t)) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND na **interest-free loan**, not a grant or free money.\n' +
      `Repayment starts after the official study / NYSC period — confirm on ${SITE}.`
    )
  }

  return null
}
