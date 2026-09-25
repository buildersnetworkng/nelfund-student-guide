const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 181: loan vs scholarship, interest, eligibility variants, window, email. */
export function playbookHourly181(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(it|nelfund|am)\s*(a\s*)?(scholarship|grant)|scholarship\s*or\s*loan/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not a scholarship**\n\n' +
      'NELFUND is an **interest-free student loan**, not a grant and not free money.\n' +
      'Institutional charges go to the **school**. Optional upkeep (if selected) goes to **you**.\n' +
      'Official FAQ: repayment is expected **after NYSC** (commonly described as two years after NYSC). Confirm live wording on the official site — I will not invent rates or jail terms.\n\n' +
      `Portal: ${PORTAL}\nSite / FAQ: ${SITE} · ${FAQ}`
    )
  }

  if (
    /interest\s*(dey|free|rate)|zero\s*interest|does\s*(e|it|am)\s*get\s*interest|interest[- ]?free|any\s*interest/i.test(
      t,
    )
  ) {
    return (
      '**Interest**\n\n' +
      'The official student portal describes the loan as **interest-free** (no hidden charges on that page).\n' +
      'It is still a **loan** you repay later — not a scholarship.\n' +
      'I will not invent a percentage, penalty, or personal repayment calendar.\n\n' +
      `Confirm on ${SITE} and ${PORTAL}. FAQ: ${FAQ}`
    )
  }

  if (
    /part[-\s]*time|sandwich|distance\s*learning/i.test(t) &&
    /eligib|apply|can\s*i|fit\s*i/i.test(t)
  ) {
    return (
      '**Part-time / sandwich / distance**\n\n' +
      'Eligibility follows what **your public institution** has uploaded and what the **current official cycle** allows.\n' +
      'This chat cannot mark a part-time or sandwich programme as approved.\n' +
      'Check the portal list and your campus NELFUND desk. Private institutions are generally outside this scheme.\n\n' +
      `Portal: ${PORTAL}\nSupport: ${ESUPPORT}`
    )
  }

  if (/private\s*(uni|university|poly|school|institution)/i.test(t) && /eligib|apply|can\s*i|fit\s*i/i.test(t)) {
    return (
      '**Private school**\n\n' +
      'The student loan is for eligible students in **public** tertiary institutions listed on the official portal for the cycle.\n' +
      'If the school does not appear, do not use a look-alike website.\n\n' +
      `Check the list only on ${PORTAL}.`
    )
  }

  if (
    /mail\s*don\s*(dey|exist)|email\s*already|account\s*already\s*(dey|exist)|this\s*mail\s*(don|already)/i.test(
      t,
    )
  ) {
    return (
      '**Email already used**\n\n' +
      'That address already has a portal account.\n' +
      `1. Log in at ${LOGIN} with the same email.\n` +
      '2. Use **Forgot password** if you cannot remember it.\n' +
      '3. Do not register a second email — that splits your record.\n' +
      `4. Still blocked: ${ESUPPORT} with a screenshot.`
    )
  }

  return null
}
