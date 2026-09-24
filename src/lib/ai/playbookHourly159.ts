const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 159: NIN, rejected, reapply, bank, refund, Pidgin paraphrases. No invented amounts. */
export function playbookHourly159(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/how\s*(i\s*)?take\s*apply|abeg\s*how\s*(i\s*)?(go|fit)\s*apply|apply\s*(for\s*)?(the\s*)?(loan|upkeep).{0,20}(and|&)\s*(loan|upkeep)/i.test(t)) {
    return (
      '**How to apply (loan + optional upkeep)**\n\n' +
      `1. Open ${PORTAL}\n` +
      '2. Create account or sign in.\n' +
      `3. Login: ${LOGIN}\n` +
      '4. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '5. Request the loan when the official window is open.\n' +
      '6. Tick **upkeep** in the same session if you want optional living support (paid to you). Institutional charges still go to the school.\n' +
      `7. Stuck: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (/rejected|decline[d]?|application\s*(no|not)\s*(go|pass)|dem\s*reject/i.test(t) || intent === 'rejected-application') {
    return (
      '**If the portal shows rejected / declined**\n\n' +
      `1. Sign in at ${LOGIN} and copy the exact reason text.\n` +
      '2. Fix school-record issues at the campus NELFUND desk if the reason points there.\n' +
      `3. Official complaint / ticket: ${ESUPPORT} with a screenshot.\n` +
      'I cannot override a decision from this chat.'
    )
  }

  if (/re-?apply|apply\s*again|last\s*year\s*(account|email)|use\s*(the\s*)?same\s*(account|email)/i.test(t) || intent === 'reapplication') {
    return (
      '**Applying again / last-year account**\n\n' +
      `1. Prefer the same email at ${LOGIN} — do not invent a second account.\n` +
      `2. If the password is lost: reset on ${PORTAL} for that same email.\n` +
      '3. Complete a new request only when the official window is open.\n' +
      `4. Email already used or stuck: ${ESUPPORT}.`
    )
  }

  if (/\bnin\b|national\s*identity|nin\s*(no|not|never)\s*(match|link|verify)/i.test(t) || intent === 'nin-verification') {
    return (
      '**NIN on the portal**\n\n' +
      '1. Use the NIN that belongs to you and matches JAMB where the portal asks.\n' +
      '2. If JAMB is not linked to NIN, the portal may prompt you to supply NIN during verify-with-JAMB.\n' +
      `3. Retry ${PORTAL}. Still failing: campus desk + ${ESUPPORT} with a screenshot.\n` +
      'I cannot edit NIMC or JAMB records from this chat.'
    )
  }

  if (/wrong\s*bank|change\s*account|account\s*name\s*(no|not)\s*match|bvn\s*(no|not)\s*match/i.test(t) || intent === 'bank-information') {
    return (
      '**Bank / BVN on the profile**\n\n' +
      'Use an account in **your** name that matches BVN.\n' +
      `Update only on ${PORTAL} after you sign in at ${LOGIN}.\n` +
      `If the portal blocks the change: ${ESUPPORT} with a screenshot.\n` +
      'Never send BVN to an agent.'
    )
  }

  if (/refund|school\s*don\s*collect|double\s*payment|pay\s*back\s*(my\s*)?fees/i.test(t) || intent === 'refund') {
    return (
      '**Refund / school already paid**\n\n' +
      'Institutional charges go to the **school**. Any refund or double-payment issue is between you, the school bursary, and official NELFUND support.\n' +
      `Open ${PORTAL} for the payment status, then ${ESUPPORT} with a screenshot. I will not invent a refund amount.`
    )
  }

  if (/who\s*go\s*stand\s*for\s*me|i\s*need\s*surety|guarantor\s*person/i.test(t)) {
    return (
      '**Guarantor**\n\n' +
      'Official FAQ: the student loan has **no guarantor requirement**.\n' +
      `Apply on ${PORTAL}. Confirm live wording on ${SITE}.`
    )
  }

  if (/wetin\s*be\s*(this|dis)\s*pending|how\s*far\s*my\s*application|money\s*never\s*(enter|drop)/i.test(t)) {
    return (
      '**Pending / check status**\n\n' +
      `1. Sign in at ${LOGIN} and read the exact status text.\n` +
      '2. Institutional charges go to the school after approval; upkeep (if ticked) goes to you.\n' +
      'Official FAQ: disbursement is within **30 days of approval** of a successful application.\n' +
      `3. Still unchanged after that window: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I will not invent your personal pay date.'
    )
  }

  return null
}
