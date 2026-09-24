const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 155: disbursement, returning students, bank, Pidgin. No invented amounts. */
export function playbookHourly155(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/when.{0,24}(money|pay|paid|disburse)|disbursement|dem\s+don\s+pay|when\s+i\s+go\s+see\s+money/i.test(t)) {
    return (
      '**When money is paid**\n\n' +
      'Official FAQ: disbursement is within **30 days of approval** of a successful application.\n\n' +
      '- Institutional charges go to the **school**.\n' +
      '- Upkeep (if ticked and approved) goes to **you**.\n' +
      `- Check the exact status after login: ${LOGIN}\n` +
      'I will not invent your personal payment date.'
    )
  }

  if (/return(ing)?\s+student|apply\s+again|i\s+apply\s+last\s+year|new\s+cycle|re-?enter\s+bvn/i.test(t)) {
    return (
      '**Returning students — 2026/2027**\n\n' +
      `1. Same email: ${LOGIN}\n` +
      '2. Re-enter **BVN and bank details** when asked.\n' +
      '3. Request the loan again; tick upkeep if you still need it.\n' +
      '4. Window: **23 Sep 2026 – 31 Dec 2026**.\n' +
      `Portal: ${PORTAL}`
    )
  }

  if (/bank\s+account|account\s+(number|name|wrong)|account\s+for\s+upkeep/i.test(t)) {
    return (
      '**Bank account**\n\n' +
      'Use an account **in your own name** that matches NIN/BVN.\n' +
      'Returning applicants re-enter BVN and bank details this cycle.\n' +
      `Login: ${LOGIN} · Support: ${ESUPPORT}`
    )
  }

  if (intent === 'what-is-nelfund' && /wetin|abeg|dey work|na wetin/i.test(t)) {
    return (
      '**How NELFUND works**\n\n' +
      'Nigeria Education Loan Fund. Institutional charges → school. Upkeep (optional) → you.\n' +
      `Window 23 Sep 2026 – 31 Dec 2026. Official: ${SITE} · ${PORTAL}`
    )
  }

  return null
}
