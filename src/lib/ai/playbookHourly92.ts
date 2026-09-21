import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-92 wording. Short menu for vague help. No invented dates. */
export function playbookHourly92(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /abeg\s*make\s*(you\s*)?(show|yarn)\s*me|i\s*no\s*sabi\s*where\s*to|help\s*me\s*arrange|una\s*fit\s*yarn|just\s*point\s*me|need\s*(small\s*)?direction|show\s*me\s*how\s*e\s*dey|i\s*wan\s*enter\s*but|make\s*una\s*direct|orientation|where\s*i\s*go\s*start|find\s*my\s*bearing|i\s*dey\s*lost|yarn\s*me\s*the\s*first|^(help|help\s*me|pls\s*help|please\s*help|abeg\s*help|i\s*need\s*help|assist\s*me|guide\s*me)/i.test(
        t,
      )
    ) {
      return `I fit help. Pick one thing, no long story.\n\n1. New apply: ${PORTAL}\n2. Mail you use last year: sign in at ${SITE}, no second account\n3. Pending or money never drop: paste the exact status word from ${PORTAL}\n4. JAMB fail or school no dey list: say that one.\n\nOfficial pages: ${SITE} ${PORTAL} ${ESUPPORT}`
    }
  }

  if (intent === 'pending-application') {
    if (/batch\s*(don\s*)?pass|dem\s*skip\s*my\s*name|i\s*no\s*see\s*my\s*name|how\s*far\s*my\s*(own|file)|una\s*forget\s*my|e\s*never\s*shift|my\s*tin\s*still\s*dey\s*pending|apply\s*long\s*time/i.test(t)) {
      return `A batch that looks like it passed you is still a portal status question. I cannot invent a pay date.\n\n1. Sign in at ${PORTAL} and copy the exact word.\n2. Ask campus NELFUND desk if your record is uploaded.\n3. Same word after they confirm: ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/last\s*year|old\s*nelfund|don\s*register\s*before|same\s*mail\s*from/i.test(t)) {
      return `If you registered last year with that email, do not start a new signup.\n\n1. Sign in at ${SITE}.\n2. ${PORTAL} new account is only if you never registered.\n3. Forgot password: reset on ${SITE}.\n4. Still locked: ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb|utme|caps/i.test(t)) {
      return `JAMB must match what JAMB holds. I cannot override it here.\n\n1. Re-type the full number with no extra space.\n2. Use the same number on your admission papers.\n3. Still failing after a correct number: campus desk, then ${ESUPPORT}. Portal: ${PORTAL}`
    }
  }

  if (intent === 'school-not-found') {
    if (/poly|college|dropdown|school\s*name|search\s*(no|not)\s*bring/i.test(t)) {
      return `If the school name does not appear, the portal cannot attach your record yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded students this cycle.\n3. Still missing after they confirm: ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    if (/repay|pay\s*back|cut\s*my\s*salary/i.test(t)) {
      return `Repayment rules live on the official site. I will not invent a start date or a salary-cut formula.\n\n1. Read repayment on ${SITE} and ${PORTAL}.\n2. After NYSC / employment, follow only what the portal shows.\n3. Account or deduction issues: ${ESUPPORT}.`
    }
  }

  return null
}
