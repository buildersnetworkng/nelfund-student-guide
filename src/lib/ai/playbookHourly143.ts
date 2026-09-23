import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific replies. Same intent, different wording, no invented dates. */
export function playbookHourly143(intent: IntentId, userText: string): string | null {
  const q = (userText || '').trim()
  if (!q) return null

  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    if (/why\s*(dem|they|una|fg|e|was|is)|purpose|aim\s*of|wetin\s*make/i.test(q)) {
      return `**Why NELFUND exists**\n\nThe Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary schools can get interest-free loans.\n\nInstitutional charges go to the school. Optional upkeep goes to you. It is a loan, not a scholarship.\n\n${SITE}`
    }
    if (/wetin\s*be|what\s*is|nelfund\s*na\s*wetin|explain\s*(this|dis)\s*loan/i.test(q)) {
      return `**Wetin be NELFUND**\n\nNELFUND is the official student loan body for eligible students in public tertiary institutions in Nigeria.\n\n- School charges: paid to the institution\n- Upkeep: paid to you only if you ticked it in the same session\n- Not free money. You repay after study / NYSC under official rules.\n\nPortal: ${PORTAL}`
    }
    return null
  }

  if (intent === 'pending-application') {
    if (/money\s*(never|no)\s*(enter|drop|land)|kobo\s*(never|no)|no\s*(credit\s*)?alert|account\s*(empty|zero)/i.test(q)) {
      return `**Money never enter is still a wait on your file.**\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your account from this chat.\n2. School charges go to the **school**. You can get no personal alert even after the school is paid.\n3. Upkeep only if you ticked it in the same session, and it can land later.\n4. I will not invent a pay date. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/how\s*far|any\s*(news|update)|wetin\s*(dey\s*)?happen/i.test(q)) {
      return `**How far my own starts on the portal, not here.**\n\n1. Sign in at ${SITE} then open ${PORTAL}. Copy the exact status word.\n2. Do not create a second account to check faster.\n3. Same word for weeks is common while school record or a batch moves.\n4. Long wait: campus NELFUND desk, then ${ESUPPORT}. I will not invent a batch list.`
    }
    if (/pending|processing|under\s*review|submitted|i\s*apply\s*(finish|since)/i.test(q)) {
      return `**Pending / processing means the file is still waiting, not declined.**\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Ask campus NELFUND desk if your record is uploaded for this session.\n3. School fees and upkeep are separate lines. One can move while the other stays.\n4. No invented SLA. Ticket ${ESUPPORT} if the word has not changed for a long time.`
    }
    return null
  }

  if (
    intent === 'official-sources' &&
    /abeg|help|asist|assist|guide|lost|confused|menu|options|first\s*time|wetin\s*i\s*(suppose|go)\s*do/i.test(q)
  ) {
    return `How far. I can help with NELFUND, not live account status.\n\nPick one:\n1. How to apply / create account\n2. Login, email already used, last year register\n3. School not on the list / missing information\n4. Pending / how far / money never enter\n5. JAMB verification\n6. Repayment (after study / NYSC)\n\nPortal: ${PORTAL}\nSite: ${SITE}\nTicket: ${ESUPPORT}\n\nI will not invent a deadline or a pay date.`
  }

  return null
}
