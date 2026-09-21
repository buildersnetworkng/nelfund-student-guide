import type { IntentId } from './types'
import { playbookHourly100 } from './playbookHourly100'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour 101: vague Pidgin help first, then hour-100 leftovers. */
export function playbookHourly101(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (
    intent === 'official-sources' &&
    /help|confused|lost|stranded|where\s*to\s*start|point\s*me|direct\s*me|wetin\s*(you|i)\s*(fit|suppose)|menu|orientate|i\s*no\s*sabi|how\s*i\s*take\s*enter/i.test(
      t,
    )
  ) {
    return `Short menu only. Pick one:\n\n1. Create or finish an account: ${PORTAL}\n2. Email from last year: sign in at ${SITE}\n3. Pending file or money never enter: copy the status word on ${PORTAL}\n4. JAMB fail or school missing: campus desk, then ${ESUPPORT}\n\nFAQ: ${FAQ}. I will not invent a deadline.`
  }

  if (intent === 'pending-application') {
    if (/everybody|except\s*me|forget\s*my|batch\s*(never|no)\s*reach|dem\s*pay\s*all/i.test(t)) {
      return `Classmates collect is not your file. I cannot see either dashboard.\n\n1. Sign in at ${PORTAL} and copy YOUR status word.\n2. Do not open a second account because others got paid.\n3. School line and upkeep line can clear on different days.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
    if (/kobo|naira|empty|blank|never\s*see|never\s*(move|change)|dey\s*same\s*(place|spot)|submit.{0,20}(week|month)/i.test(t)) {
      return `Empty account or same status word is a wait on the file, not a new apply.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School fees often leave no personal alert.\n3. Upkeep only if you ticked it, into a bank in your name.\n4. I will not invent a credit date. Long wait: ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification' && /gree|bounce|reject|cannot\s*pass|field|slip|utme\s*error|registration\s*number/i.test(t)) {
    return `JAMB / UTME must match their record exactly.\n\n1. Retype the number on ${PORTAL} with no extra space.\n2. Names and date of birth must match NIN.\n3. I will not invent a workaround code.\n4. Still fail: campus desk, then ${ESUPPORT}. Do not open a second profile.`
  }

  if (intent === 'portal-login' && /email|mail|last\s*(year|session)|already|don\s*dey|cannot\s*open\s*(new|another)/i.test(t)) {
    return `That email already has a NELFUND profile. Log in. Do not create another.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /dropdown|drop\s*down|search|campus\s*no\s*dey|institution\s*list|uni|poly|college/i.test(t)) {
    return `If search does not bring your school, the file cannot attach yet.\n\n1. Try the full official name on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'repayment' && /pay\s*(back|am)|after\s*(school|nysc)|interest|collect\s*(the\s*)?money|gsi|payback|repayment/i.test(t)) {
    return `Repayment terms come from NELFUND, not this chat.\n\n1. Read the official FAQ: ${FAQ}.\n2. After service year questions: check ${SITE} and your portal profile.\n3. I will not invent an interest figure or start date.\n4. Account or GSI issues: ${ESUPPORT}.`
  }

  return playbookHourly100(intent, userText)
}
