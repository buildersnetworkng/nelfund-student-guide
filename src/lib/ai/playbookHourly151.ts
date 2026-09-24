const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific answers so the same intent does not dump one block. */
export function playbookHourly151(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    if (/why\s*(dem|they|una)\s*create|why\s*this\s*scheme|purpose/i.test(t)) {
      return `**Why they created NELFUND**\n\nThe Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary institutions can borrow interest-free money for school charges and optional living costs.\n\nIt is a loan, not a scholarship. Confirm on ${SITE}. I will not invent a deadline here.`
    }
    if (/wetin\s*be|explain\s*(this|dis)\s*loan|define|stand\s*for|meaning/i.test(t)) {
      return `**Wetin be NELFUND:** Nigeria Education Loan Fund. Government interest-free student loan for eligible students in public tertiary schools.\n\n- School charges go to the school.\n- Optional upkeep goes to your bank if you ticked it.\n\nOfficial: ${SITE} and ${PORTAL}.`
    }
    if (/who\s*(own|owns|built|founded|created)/i.test(t)) {
      return `**Who set up NELFUND**\n\nIt comes from the Students Loans Act of the National Assembly. It is not a private agent scheme.\n\nApply only on ${PORTAL}. I will not invent founder names or WhatsApp agents.`
    }
  }

  if (intent === 'pending-application') {
    if (/mates|classmates|everybody|others\s*don|tinubu\s*list|pay\s*list|name\s*no\s*dey/i.test(t)) {
      return `**Mates don collect / name no dey list** is still *your* portal file, not a public class sheet I can invent.\n\n1. Open ${PORTAL} and copy the exact status word.\n\n2. School fees go to the institution. Classmates can get upkeep earlier if their record cleared first.\n3. Do not open a second account.\n4. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*never|never\s*(enter|drop)|loan\s*(no|not|never)\s*(drop|enter)|nothing\s*don\s*drop|stipend|allowance|glitch/i.test(t)) {
      return `**Money never enter / stipend no drop** is a wait on the file, not a new apply.\n\n1. Copy the exact status word on ${PORTAL}. I cannot see your account from this chat.\n2. Institutional charges go to the **school**. You can have zero personal alert even after the school is paid.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent a pay date. Long wait: ${ESUPPORT}.`
    }
    if (/how\s*far|check\s*(my\s*)?(loan|status)|any\s*update|track/i.test(t)) {
      return `**How far my own** starts on the portal.\n\n1. Sign in at ${SITE}, then ${PORTAL}. Copy the exact status word.\n2. Do not create another account to check faster.\n3. I cannot see your file from this chat.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(already|used|exist|taken)|registered\s*last|mail\s*don/i.test(t)) {
      return `**That email is already on an account.** Do not create a new one.\n\n1. Sign in at ${SITE} with the same email.\n2. Forgot password: use reset on ${SITE}.\n3. First-time create is only at ${PORTAL} if you truly never registered.\n4. Still blocked: ${ESUPPORT}.`
    }
    if (/otp|reset|forget\s*(the\s*)?(mail|password)/i.test(t)) {
      return `**OTP / reset wahala**\n\n1. Stay on the same email. Check spam.\n2. Reset from ${SITE}, not a WhatsApp link.\n3. Still nothing: ${ESUPPORT} with that email. Do not open a second account.`
    }
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/account\s*creation|sign\s*up\s*(open|close)/i.test(t)) {
      return `**Account creation vs loan window are not the same.**\n\nAccount creation can be open while loan / upkeep for this cycle is not confirmed.\nCreate or sign in on ${PORTAL} / ${SITE}. I will not invent a closing date. Confirm only on those official pages.`
    }
    if (/deadline|closing|as\s*of\s+today|still\s*open|still\s*dey\s*accept/i.test(t)) {
      return `**Open or not as of today** must come from official pages, not social media.\n\n- Sign up / profile: ${PORTAL}\n- Already registered: sign in at ${SITE}\n\nI will not invent a deadline. Loan and upkeep can stay unconfirmed even when account creation is open.`
    }
  }

  return null
}
