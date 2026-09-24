const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific answers for pending / jamb / email / open. No invented dates. */
export function playbookHourly153(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/stipend|allowance|two\s*months|2\s*months|glitch|upkeep\s*(no|never|not)\s*(enter|drop)/i.test(t)) {
      return `**Allowance / stipend no drop** is still your same portal file.\n\n1. Sign in at ${PORTAL} and copy the exact status word. This chat cannot see your bank.\n2. School charges go to the school. Upkeep only lands if that line is approved on the same file.\n3. I will not invent a pay date or blame a glitch I cannot see.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/mates|classmates|pay\s*list|tinubu|name\s*(no|not)\s*dey|dem\s*don\s*pay\s*(people|others)/i.test(t)) {
      return `**Mates don collect / name no dey list** is not a class sheet I can invent.\n\n1. Open ${PORTAL} and copy YOUR status word.\n2. Files move in batches. Classmates can clear first.\n3. Do not open a second email to jump the queue.\n4. Long wait: campus desk, then ${ESUPPORT}.`
    }
    if (/school\s*(say|said)|fees\s*never\s*reach|bursary/i.test(t)) {
      return `**School not seeing the fees** is a campus record check.\n\n1. Keep the same account on ${PORTAL}.\n2. Ask bursary / campus NELFUND desk if an institutional line arrived.\n3. Still blank after they check: ${ESUPPORT}.`
    }
    if (/how\s*far|any\s*(update|word|news|gist)|track|check\s*(my\s*)?(loan|status)|has\s*(nelfund|they)\s*paid/i.test(t)) {
      return `**How far my own** starts on the portal, not in this chat.\n\n1. Sign in at ${SITE}, then ${PORTAL}. Copy the exact status word.\n2. I cannot see your file from here.\n3. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/verification\s*failed|not\s*valid|invalid|no\s*gree|cannot\s*verify/i.test(t)) {
      return `**JAMB verification failed** is a match problem, not a new account.\n\n1. Type the JAMB / UTME number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not create a second email.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(already|used|taken|exist)|registered\s*(last\s*year|before)|cannot\s*create\s*(an?\s*)?account/i.test(t)) {
      return `**That email is already on an account.** Log in. Do not create a new one.\n\n1. Sign in at ${SITE} with the same email.\n2. Forgot password: reset on ${SITE}.\n3. First-time create is only at ${PORTAL} if you never registered.\n4. Still blocked: ${ESUPPORT}.`
    }
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/account\s*creation|sign\s*up/i.test(t)) {
      return `**Account creation and the loan window are not the same thing.**\n\nYou can start registration on ${PORTAL} when account creation is open. Loan and upkeep for this cycle may still be unconfirmed.\nI will not invent a closing date. Confirm only on ${PORTAL} and ${SITE}.`
    }
    if (/deadline|as\s*of\s+today|still\s*(open|accept|dey)|closing/i.test(t)) {
      return `**Open or not as of today** comes from official pages only.\n\n- Sign up / profile: ${PORTAL}\n- Already registered: sign in at ${SITE}\n\nI will not invent a deadline. Loan / upkeep can stay unconfirmed even when account creation is open.`
    }
  }

  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose') {
    if (/wetin\s*be|explain\s*(this|dis)|stand\s*for|meaning/i.test(t)) {
      return `**Wetin be NELFUND:** Nigeria Education Loan Fund. Interest-free government student loan for eligible students in public tertiary schools.\n\nSchool charges go to the school. Optional upkeep goes to your bank if you ticked it.\nOfficial: ${SITE} and ${PORTAL}.`
    }
    if (/why\s*(dem|they|una|fg|government)\s*(create|bring|form|start)|purpose/i.test(t)) {
      return `**Why dem create am:** the Students Loans Act set up NELFUND so eligible public-school students can borrow interest-free money for school charges and living costs.\n\nIt is a loan, not a scholarship. Confirm on ${SITE}. I will not dump a live open-or-closed card here.`
    }
  }

  return null
}
