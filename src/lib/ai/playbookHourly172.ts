const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 172: duplicate apply, private school, session closed, status check, interest Pidgin, wetin-carry docs. */
export function playbookHourly172(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /already\s*(apply|applied|submit)|I\s*(don|have)\s*(already\s*)?(apply|applied)|duplicate\s*(loan|application)|apply\s*two\s*times|second\s*application/i.test(
      t,
    )
  ) {
    return (
      '**Already applied / second request**\n\n' +
      'Do not open a second email to force another form. One student account should hold the request.\n\n' +
      `1. Sign in at ${LOGIN} and open **Loans**.\n` +
      '2. Read Institutional and Upkeep tabs — pending is still a live request.\n' +
      '3. Only start a new request if the official window is open **and** the portal offers one for this cycle.\n' +
      `4. Stuck: campus NELFUND desk, then ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (/private\s*(uni|university|poly|school|institution)|can\s*private/i.test(t)) {
    return (
      '**Private institution**\n\n' +
      'NELFUND coverage on this cycle is for eligible students in **public** tertiary institutions on the official list.\n\n' +
      `1. Search the exact school name on ${PORTAL}.\n` +
      '2. If the school does not appear, the portal — not a WhatsApp list — is the source of truth.\n' +
      `3. Confirm live rules on ${SITE}. Tickets: ${ESUPPORT}.`
    )
  }

  if (
    /institution.{0,40}(not\s*)?(open|opened|close)|session\s*(not\s*)?(open|opened)|school\s*(never|no|not)\s*(open|start).{0,20}session|home\s*say.{0,30}session/i.test(
      t,
    )
  ) {
    return (
      '**Institution session not open**\n\n' +
      'The national window can be open while **your school session** on the portal is still closed.\n\n' +
      '1. That is a campus upload / session issue, not a broken password.\n' +
      '2. Ask the campus NELFUND / ICT / Registry desk to open or upload this cycle.\n' +
      `3. Retry ${PORTAL} after they confirm.\n` +
      `4. Still the same banner: ${ESUPPORT} with a screenshot.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (
    /how\s*(do\s*i|to|i\s*go|i\s*take)\s*(check|see|view)\s*(my\s*)?(status|application)|wetin\s*be\s*(my\s*)?status|check\s*(loan\s*)?status/i.test(
      t,
    ) ||
    (intent === 'pending-application' && /status|check/i.test(t))
  ) {
    return (
      '**Check application status**\n\n' +
      `1. Sign in only at ${LOGIN}.\n` +
      '2. Open **Loans** → Institutional charges and Upkeep tabs.\n' +
      '3. **Pending** means submitted and still processing — not declined.\n' +
      'Official FAQ: disbursement is within **30 days of approval** of a successful application.\n' +
      `4. Unchanged after that window: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I will not invent your personal pay date.'
    )
  }

  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|which\s*paper|documents?\s*(i\s*)?(need|dey)/i.test(t) ||
    (intent === 'documents-needed' && /wetin|pidgin|carry|bring/i.test(t))
  ) {
    return (
      '**Documents (wetin you go carry)**\n\n' +
      'Have these ready before you start the form:\n' +
      '• JAMB number and admission letter (fresh students)\n' +
      '• NIN and BVN\n' +
      '• Bank account in **your** name\n' +
      '• Matriculation number when the school has issued it\n' +
      '• School ID if the form asks\n\n' +
      `Upload only on ${PORTAL}. Never send papers to a WhatsApp agent.\n` +
      `Login: ${LOGIN}. Tickets: ${ESUPPORT}.`
    )
  }

  if (
    /interest\s*(dey|free)|does\s*e\s*get\s*interest|zero\s*interest|dem\s*dey\s*charge\s*interest|na\s*interest/i.test(
      t,
    )
  ) {
    return (
      '**Interest**\n\n' +
      'Official wording describes the student loan as **interest-free**.\n' +
      'It is still a **loan** you repay later — not a scholarship and not free money.\n' +
      `Confirm the live wording on ${SITE} and ${PORTAL}. I will not invent a rate.`
    )
  }

  if (/na\s*(scholarship|grant)|wetin\s*be\s*(the\s*)?difference|loan\s*(or|vs)\s*scholarship|free\s*money/i.test(t)) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant, scholarship, or free money.\n' +
      `Repayment follows official study / NYSC timing — confirm on ${SITE}.\n` +
      `Apply only on ${PORTAL}. Tickets: ${ESUPPORT}.`
    )
  }

  return null
}
