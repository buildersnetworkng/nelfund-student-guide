const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-66 playbook. Different angle, different wording. No invented dates. No long dashes. */
export function playbookHourly66(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/money\s*(never|no)\s*(enter|drop|land|reflect)|e\s*never\s*(enter|drop|reflect)|account\s*never/i.test(t)) {
      return `**Money never enter is a wait on your file, not a new apply.**\n\nSchool charges go to the school first, so your bank can stay quiet even after the school is paid. Upkeep only lands if you ticked it in the same session.\n\n1. Sign in on ${PORTAL} and copy the exact status word. I cannot see your account from this chat.\n2. I will not invent a pay date.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/how\s*far(\s*my\s*own)?|wetin\s*sup|check\s*(am|my\s*own)/i.test(t)) {
      return `**How far my own starts on the portal.** I cannot open your dashboard from this chat.\n\n1. Sign in at ${SITE}, then ${PORTAL}. Copy the exact word you see (pending, under review, approved, processing).\n2. Do not create another account just to check faster.\n3. Long same word: campus desk, then ${ESUPPORT}.`
    }
    if (/status\s*(still|dey|is)\s*(processing|pending)|still\s*processing|application\s*(is|dey)\s*pending/i.test(t)) {
      return `**Status still processing means the file has not finished, not that it died.**\n\n1. Keep the same login. Copy the exact sentence on ${PORTAL}.\n2. School fees and upkeep can move on different days.\n3. I will not invent how many days processing takes. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
    return `**Pending / how far:** only ${PORTAL} shows your file.\n\n1. Copy the exact status word.\n2. No SMS does not mean declined.\n3. Same word for a long time: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'current-information') {
    if (/deadline|closing/i.test(t)) {
      return `**I will not invent a deadline.** Account creation can be open while the 2026/2027 loan and upkeep window is not confirmed.\n\nCheck ${PORTAL} and ${SITE} only. Ignore WhatsApp dates.`
    }
    if (/as\s*of\s*today|still\s*dey\s*accept|still\s*open/i.test(t)) {
      return `**As of today:** sign up can be open. Loan and upkeep for 2026/2027 is not confirmed open on official pages.\n\n- New account: ${PORTAL}\n- Old email: sign in on ${SITE}. Do not create another account.`
    }
    return `**Open or not is two different things.** Account creation can run while the loan window is still waiting for official dates. Confirm on ${PORTAL}.`
  }

  if (intent === 'what-is-nelfund') {
    if (/why\s*dem\s*create|purpose|why\s*(they|una)/i.test(t)) {
      return `**Why they created NELFUND:** so eligible students in public tertiary schools can borrow school charges and optional upkeep without interest, then repay later. It is a loan, not a gift. ${SITE}`
    }
    if (/wetin\s*be|explain\s*this\s*loan/i.test(t)) {
      return `**Wetin be NELFUND:** Nigeria Education Loan Fund. Government student loan for public tertiary students. School money goes to the school. Optional upkeep can go to your bank if you tick it. ${SITE}`
    }
    return `**NELFUND** is the Nigeria Education Loan Fund. Interest-free loan for eligible public tertiary students. ${SITE}`
  }

  if (intent === 'jamb-verification') {
    return `**Invalid JAMB / verification failed** usually means the number, name, or date of birth does not match CAPS or the school upload.\n\n1. Type it exactly as on the admission letter.\n2. Direct Entry still needs a real JAMB registration number.\n3. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    return `**Email already used / I registered last year means log in, do not create a new account.**\n\n1. Sign in on ${SITE} with that same email.\n2. Password no gree: official reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey list** usually means the school has not finished the upload, or the search name is too short.\n\n1. Search the full official name on ${PORTAL}.\n2. Ask ICT / Registry / campus NELFUND desk.\n3. Still missing: ${ESUPPORT}.`
  }

  return null
}
