import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour 99: pending answers that follow the student's angle, plus short menu. */
export function playbookHourly99(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources' && /help|confused|where\s*to\s*start|point\s*me|direct\s*me|what\s*can\s*you\s*do|wetin\s*you\s*fit\s*do|menu|capabilities/i.test(t)) {
    return `Short menu only. Pick one:\n\n1. Create or finish an account: ${PORTAL}\n2. Already have email from last year: sign in at ${SITE}\n3. Pending file or money never enter: copy the status word on ${PORTAL}\n4. JAMB fail or school missing: campus desk, then ${ESUPPORT}\n\nFAQ: ${FAQ}. I will not invent a deadline.`
  }

  if (intent === 'pending-application') {
    if (/school.{0,40}(collect|paid|receive).{0,40}(upkeep|alert|i\s*never|me)|paid\s*(the\s*)?school\s*but|institutional.{0,20}(paid|approved).{0,30}(upkeep|alert)/i.test(t)) {
      return `School collect and you no see upkeep are two different lines.\n\n1. Institutional charges go to the school. That line can show paid while your bank stays empty.\n2. Upkeep only if you ticked it in the same session, and it can land later into the bank on your profile.\n3. Copy both status words from ${PORTAL}. I will not invent a pay date.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/everybody|mates|class|only\s*me|dem\s*forget|una\s*forget/i.test(t)) {
      return `Classmates collect is not your file. I cannot see either dashboard.\n\n1. Sign in at ${PORTAL} and copy YOUR status word.\n2. Do not open a second account because others got paid.\n3. School line and upkeep line can clear on different days.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
    if (/processing|still\s*processing|status\s*(still\s*)?(na|is)?\s*processing|file\s*(dey|is)\s*processing/i.test(t)) {
      return `Processing means the file is still moving. It is not a pay date and not a decline.\n\n1. Copy the exact sentence from ${PORTAL}. I cannot see the dashboard.\n2. School charges go to the institution first.\n3. No invented number of days.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/kobo|empty|zero|account\s*still|money\s*no\s*dey|never\s*(drop|enter|land)|no\s*credit/i.test(t)) {
      return `Empty account is a wait on the file, not a new apply.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School fees often leave no personal alert.\n3. Upkeep only if you ticked it, into a real bank in your name.\n4. I will not invent a credit date. Long wait: ${ESUPPORT}.`
    }
    if (/how\s*far\s*my\s*(own|matter|case)|my\s*application\s*(is\s*)?pending|pending\s*abeg|i\s*check\s*am/i.test(t)) {
      return `How far your own starts on the portal, not in this chat.\n\n1. Sign in at ${SITE}, then open ${PORTAL}.\n2. Copy the exact status word. Do not create a second account to check faster.\n3. I will not invent a batch list.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
    return null
  }

  if (intent === 'jamb-verification' && /verification\s*failed|not\s*valid|invalid|caps|old\s*jamb/i.test(t)) {
    return `Verification failed on JAMB means the number or bio data did not match.\n\n1. Retype the JAMB / UTME number on ${PORTAL} with no extra space.\n2. Name and date of birth must match NIN.\n3. Old-year JAMB can fail if CAPS or school record is not aligned.\n4. Still fail: campus desk, then ${ESUPPORT}. Do not open a second account.`
  }

  if (intent === 'portal-login' && /email|last\s*year|already\s*(used|in\s*use)|cannot\s*create/i.test(t)) {
    return `That email already has an account. Log in. Do not create another one.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /no\s*dey|not\s*showing|missing|cannot\s*find|dropdown/i.test(t)) {
    return `If the school is missing from the list, the loan file cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  return null
}
