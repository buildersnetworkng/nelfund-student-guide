/**
 * Detect full-overview / "how does NELFUND work" asks so they never become
 * repayment-only or off-topic menus.
 */
const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function isOverviewAsk(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  return /how\s+(does\s+)?(nelfund|it|this|the\s+loan|dis)\s+work|how\s+nelfund\s+works|how\s+does\s+this\s+nelfund|how\s+(does\s+|e\s+)?(this|dis)\s+nelfund\s+(thing|stuff|matter|loan)?.{0,12}work|nelfund\s+(thing|stuff).{0,12}work|how\s+(dis|this)\s+nelfund.{0,20}(dey\s+)?work|go\s*through\s+(of\s+)?(the\s+)?(whole\s+)?nelfund|whole\s+nelfund\s+(stuff|thing|process|system)|everything\s+(on|about|on\s+how)\s+(how\s+)?nelfund|know\s+everything\s+(on|about)\s+(how\s+)?nelfund|full\s+(guide|overview|explanation|walk\s*through|walkthrough)|explain\s+(how\s+)?nelfund|tell\s+me\s+(how\s+)?nelfund|overview\s+(of\s+)?nelfund|walk\s*me\s+through\s+(nelfund|the\s+loan)|brief\s+(on|about)\s+nelfund|how\s+the\s+(scheme|loan)\s+works/i.test(
    t,
  )
}

/** Full student-facing walkthrough — not repayment-only. */
export function fullNelfundOverview(): string {
  return (
    `**How NELFUND works (full go-through)**\n\n` +
    `1. **What it is:** Nigeria Education Loan Fund — **interest-free** student loans under the Students Loans (Access to Higher Education) Act. It is a **loan**, not a scholarship or free money.\n` +
    `2. **Who it is for:** Eligible students in **public** tertiary institutions (not private schools), with admission and required records (JAMB, NIN, BVN, bank).\n` +
    `3. **Two money parts:**\n` +
    `   - **Institutional charges** (school fees) → paid **to the school**\n` +
    `   - **Upkeep** (optional living support) → paid **to you** if you tick it in the same session\n` +
    `4. **How to use it:** Open ${PORTAL} → create account or sign in → complete profile → request the loan only when the official window is open.\n` +
    `5. **After you apply:** Check status on the same portal. School charges go to the institution; upkeep (if any) goes to your profile bank. I will not invent pay dates.\n` +
    `6. **Repayment:** Starts after the applicable study or NYSC period under official rules — confirm on ${SITE}. I will not invent rates or jail terms.\n` +
    `7. **Safety:** Never pay an agent. Only ${PORTAL} and ${SITE}. Tickets: ${ESUPPORT}.\n\n` +
    `Ask next about **eligibility**, **how to apply**, **upkeep**, **portal errors**, or **repayment** if you want one topic in detail.`
  )
}
