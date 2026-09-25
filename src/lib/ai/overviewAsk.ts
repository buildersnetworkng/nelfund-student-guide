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
  return /how\s+(does\s+)?(nelfund|it|this|the\s+loan|dis)\s+work|how\s+nelfund\s+works|how\s+does\s+this\s+nelfund|how\s+(does\s+|e\s+)?(this|dis)\s+nelfund\s+(thing|stuff|matter|loan)?.{0,20}(dey\s+)?work|nelfund\s+(thing|stuff).{0,20}(dey\s+)?work|how\s+(dis|this)\s+nelfund.{0,30}(dey\s+)?work|how.{0,50}nelfund.{0,40}(dey\s+)?work|nelfund.{0,25}dey\s+work|go\s*through\s+(of\s+)?(the\s+)?(whole\s+)?nelfund|whole\s+nelfund\s+(stuff|thing|process|system)|everything\s+(on|about|on\s+how)\s+(how\s+)?nelfund|know\s+everything\s+(on|about)\s+(how\s+)?nelfund|full\s+(guide|overview|explanation|walk\s*through|walkthrough)|explain\s+(how\s+)?nelfund|tell\s+me\s+(how\s+)?nelfund|overview\s+(of\s+)?nelfund|walk\s*me\s+through\s+(nelfund|the\s+loan)|brief\s+(on|about)\s+nelfund|how\s+the\s+(scheme|loan)\s+works|abeg\s+(yarn|explain)\s+(nelfund|am)\s*(small)?|wetin\s+be\s+(this|dis)\s+nelfund\s+(thing|stuff)|how\s+e\s+take\s+be\s+(for\s+)?nelfund|give\s+me\s+(the\s+)?(full|whole)\s+(gist|picture)\s+(of\s+)?nelfund|nelfund\s+from\s+start\s+to\s+(finish|end)|how\s+does\s+this\s+nelfund\s+thing\s+work|ok\s+give\s+me\s+a\s+go\s+through|nelfund\s+gist\s+from\s+top\s+to\s+bottom|break\s+nelfund\s+down\s+for\s+me|yarn\s+nelfund\s+for\s+me|how\s+dis\s+nelfund\s+matter\s+take\s+work|abeg\s+explain\s+the\s+whole\s+loan\s+thing|how\s+this\s+nelfund\s+thing\s+work|gist\s+of\s+(this\s+|dis\s+)?nelfund|explain\s+the\s+whole\s+nelfund|nelfund\s+full\s+gist|abeg\s+yarn\s+how\s+nelfund\s+take\s+work|break\s+am\s+down\s+for\s+me\s+nelfund|wetin\s+be\s+nelfund\s+from\s+start|how\s+this\s+nelfund\s+thing\s+dey\s+work|explain\s+everything\s+about\s+nelfund|full\s+gist\s+of\s+(the\s+)?nelfund|yarn\s+the\s+whole\s+nelfund\s+matter/i.test(
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
    `5. **After you apply:** Check status on the same portal. School charges go to the institution; upkeep (if any) goes to your profile bank. Official FAQ: disbursement within **30 days of approval**. I will not invent your personal pay date.\n` +
    `6. **Repayment:** Official FAQ: due **2 years after NYSC**. Confirm on ${SITE}. I will not invent rates or jail terms.\n` +
    `7. **Safety:** Never pay an agent. Only ${PORTAL} and ${SITE}. Tickets: ${ESUPPORT}.\n\n` +
    `Ask next about **eligibility**, **how to apply**, **upkeep**, **portal errors**, or **repayment** if you want one topic in detail.`
  )
}
