const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

/** Hourly 148/149: angle-specific replies so leftover "other" does not share one dump. */
export function playbookHourly148(intent: string, t: string): string | null {
  const q = t || ''

  if (intent === 'eligibility') {
    if (/part\s*time|postgraduate|pg|masters|nysc/i.test(q)) {
      return `**Who can apply depends on the live portal rules, not a chat rumour.**\n\n1. Open ${PORTAL} and start account creation. The form itself is the filter.\n2. I will not invent a yes or no for part time, NYSC, or postgraduate.\n3. Official wording: ${SITE} FAQ. If the portal blocks a category, that is the answer for this cycle.`
    }
    if (/am\s*i|do\s*i\s*qualify|who\s*(fit|can)|cover\s*me/i.test(q)) {
      return `**Eligibility is checked on the portal, not here.**\n\n1. You need to be a student in a participating Nigerian public tertiary school.\n2. Account creation still needs NIN, BVN, and JAMB details the form asks for.\n3. Confirm on ${PORTAL}. I will not invent extra conditions.`
    }
  }

  if (intent === 'missing-information') {
    if (/nin|bvn/i.test(q)) {
      return `**NIN or BVN must match the name on your account.**\n\n1. Finish the fields on ${PORTAL}. You cannot skip them.\n2. If verify fails, correct the number with NIMC / your bank, then retry the same account.\n3. Do not open a second email. Still stuck: campus desk, then ${ESUPPORT}.`
    }
    return `**Incomplete profile is a missing-record issue, not a new apply.**\n\n1. Sign in on ${PORTAL} and finish every required field.\n2. If school data is blank, ICT / Registry must upload your record.\n3. Long same error: ${ESUPPORT}.`
  }

  if (intent === 'how-to-apply') {
    if (/one\s*by\s*one|step\s*by\s*step|walk\s*me|from\s*scratch|teach/i.test(q)) {
      return `**Apply path, one beat at a time.**\n\n1. Create or sign in on ${PORTAL} with one email.\n2. Fill NIN, BVN, JAMB, school, course, and bank as the form asks.\n3. Loan / upkeep submit is only when the portal confirms that window. I will not invent a date.`
    }
    return `**Start on the official portal only.**\n\n1. ${PORTAL}\n2. One email. Do not register again if you used the same mail last cycle. Log in instead.\n3. Ask me next about open window, pending file, or a specific error.`
  }

  if (intent === 'pending-application') {
    if (/kobo|wallet|alert\s*no\s*dey|nothing\s*don\s*drop|bank\s*never|transfer\s*never|upkeep\s*never\s*drop/i.test(q)) {
      return `**No alert yet is still a wait on the same file.**\n\n1. Copy the exact dashboard word on ${PORTAL}. This chat cannot see your bank.\n2. School charges go to the school. Upkeep goes to you only if that line is approved.\n3. I will not invent a pay date. Long same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/school\s*say\s*dem\s*never\s*see|fees\s*never\s*reach/i.test(q)) {
      return `**School not seeing fees is a campus record check, not a second application.**\n\n1. Keep the same portal account on ${PORTAL}.\n2. Ask the campus NELFUND / bursary desk to confirm they received an institutional line.\n3. Still blank after they confirm: ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    if (/gsi|salary|nysc|service\s*year|who\s*go\s*pay|till\s*when/i.test(q)) {
      return `**Repayment is after study, on official terms only.**\n\n1. Read the live wording on ${SITE}. I will not invent months, rates, or salary-cut figures.\n2. NYSC or first job timing is set by NELFUND, not this chat.\n3. If you already have a portal account, the same login on ${PORTAL} is where any repayment screen will appear.`
    }
  }

  if (intent === 'official-sources') {
    if (/headings|topics\s*una|which\s*question|pick\s*topic|student\s*guide\s*menu|wetin\s*i\s*fit\s*yarn/i.test(q)) {
      return `**Pick one heading.**\n\n1. What NELFUND is\n2. Is account or loan open today\n3. How to apply on ${PORTAL}\n4. Pending / money never enter\n5. JAMB, email already used, or school missing\n\nOfficial pages: ${SITE}`
    }
  }

  return null
}
