import type { IntentId } from './types'
import { playbookHourly101 } from './playbookHourly101'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour 102: more vague Pidgin help, then hour-101 leftovers. */
export function playbookHourly102(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (
    intent === 'official-sources' &&
    /help|confused|lost|stranded|where\s*(to|i\s*go)\s*(start|begin)|point\s*me|direct\s*me|wetin\s*(you|i|una)\s*(fit|suppose|dey)|menu|orientate|i\s*no\s*(sabi|know)|how\s*(i\s*take\s*enter|this\s*(chat|bot|page))|i\s*dey\s*blank|nothing\s*dey\s*my\s*head|navigate|direction|i\s*come\s*here/i.test(
      t,
    )
  ) {
    return `Short menu only. Pick one:\n\n1. Create or finish an account: ${PORTAL}\n2. Email from last year: sign in at ${SITE}\n3. Pending file or money never enter: copy the status word on ${PORTAL}\n4. JAMB fail or school missing: campus desk, then ${ESUPPORT}\n\nFAQ: ${FAQ}. I will not invent a deadline.`
  }

  if (intent === 'pending-application') {
    if (/mates|class|disbursement|settle|dashboard\s*still|status\s*word|processing\s*pass|forget\s*this\s*file/i.test(t)) {
      return `Classmates collect is not your file. I cannot see either dashboard.\n\n1. Sign in at ${PORTAL} and copy YOUR status word.\n2. Do not open a second account because others got paid.\n3. School line and upkeep line can clear on different days.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification' && /jamb|utme|caps|reg\s*no|wahala|direct\s*entry/i.test(t)) {
    return `JAMB / UTME must match their record exactly.\n\n1. Retype the number on ${PORTAL} with no extra space.\n2. Names and date of birth must match NIN.\n3. I will not invent a workaround code.\n4. Still fail: campus desk, then ${ESUPPORT}. Do not open a second profile.`
  }

  if (intent === 'portal-login' && /mail|email|gmail|last\s*(year|session)|already|create\s*(again|another)/i.test(t)) {
    return `That email already has a NELFUND profile. Log in. Do not create another.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /school|institution|search|list|uni|oou|unilag|lasu|yabatech/i.test(t)) {
    return `If search does not bring your school, the file cannot attach yet.\n\n1. Try the full official name on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'repayment' && /pay|repay|salary|graduate|interest|loan\s*back/i.test(t)) {
    return `Repayment terms come from NELFUND, not this chat.\n\n1. Read the official FAQ: ${FAQ}.\n2. After service year questions: check ${SITE} and your portal profile.\n3. I will not invent an interest figure or start date.\n4. Account or GSI issues: ${ESUPPORT}.`
  }

  return playbookHourly101(intent, userText)
}
