const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 157: digital-bank stall, no matric yet, GSI Pidgin, conventional account. No invented amounts. */
export function playbookHourly157(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/opay|palmpay|kuda|digital[- ]only|fintech\s*bank|wallet\s*account/i.test(t)) {
    return (
      '**Bank account on the profile**\n\n' +
      'Use a bank account **in your own name** that the official portal accepts.\n' +
      'If a digital-only / wallet account stalls verification or payout, update the profile to a conventional bank and retry.\n' +
      `Confirm only on ${PORTAL} · login ${LOGIN}. I will not invent which banks work.`
    )
  }

  if (/no\s*(get|have)\s*matric|matric(ulation)?\s*(number\s*)?(never|not|no)\s*(ready|dey|come|out)|just\s*(got|collect)\s*admission/i.test(t)) {
    return (
      '**No matriculation number yet**\n\n' +
      'Fresh students usually start with the **JAMB registration number** and admission letter.\n' +
      'When the school issues a matric number, the campus desk should upload it.\n' +
      `Retry ${PORTAL}. Still blocked: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (/\bgsi\b|global\s*standing|dem\s*go\s*collect\s*from\s*(my\s*)?account/i.test(t)) {
    return (
      '**GSI mandate**\n\n' +
      'The portal asks you to accept a repayment recovery instruction (GSI) before submit.\n' +
      `Read the official wording on ${PORTAL} and ${SITE}. I will not invent recovery rates.`
    )
  }

  if (intent === 'how-to-apply' && /upkeep|loan\s*and/i.test(t)) {
    return (
      '**Apply for institutional charges and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. Request the loan when the official window is open.\n' +
      '4. Tick **upkeep** in the same session if you want living support (paid to you). Institutional charges still go to the school.\n' +
      `5. Stuck: campus desk, then ${ESUPPORT}.`
    )
  }

  return null
}
