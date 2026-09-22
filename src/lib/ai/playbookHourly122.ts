import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly122(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /abeg\s*(una\s*)?(help|guide)|una\s*fit\s*(help|guide)|i\s*(dey\s*)?(lost|confused)|i\s*no\s*sabi|gimme\s*(short\s*)?(menu|list)|orientate|wetin\s*una\s*(fit|dey)\s*do|how\s*i\s*go\s*take\s*use|wetin\s*this\s*(bot|ai)/i.test(
        t,
      )
    ) {
      return `I can help with NELFUND only. Pick one line:\n\n- apply / create account\n- pending or how far on my file\n- JAMB / NIN / school not on the list\n- upkeep or repayment\n\nI will not dump live portal status here. Official pages: ${SITE} and ${PORTAL}.`
    }
  }

  if (intent === 'pending-application') {
    if (/waiting\s*tire|mates\s*don\s*collect|class\s*don\s*collect|any\s*news|update\s*abeg|same\s*status|still\s*the\s*same\s*word/i.test(t)) {
      return `Mates collecting first does not mean your file is cancelled. I will not invent a pay date.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb|utme|caps/i.test(t)) {
      return `Type the JAMB number exactly as on the admission letter. Name and date of birth must match JAMB and NIN.\n\nStill failing: campus NELFUND desk, then ${ESUPPORT}. Do not open a second account.`
    }
  }

  if (intent === 'portal-login') {
    if (/email|mail|last\s*(year|session)|account\s*dey\s*already|sign\s*up\s*(no|not)\s*gree/i.test(t)) {
      return `If that email was used before, sign in. Do not create another account.\n\nLogin: ${SITE}\nReset password on the same email if you forgot it. Still blocked: ${ESUPPORT}.`
    }
  }

  if (intent === 'school-not-found') {
    if (/school|institution|poly|college|dropdown|drop\s*down/i.test(t)) {
      return `If the school name is missing, the institution may not have finished uploading records for this cycle.\n\nConfirm it is a public school, ask the campus NELFUND desk, then search again on ${PORTAL}. Still missing: ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    if (/pay\s*back|repay|salary|nysc|deduct|payback/i.test(t)) {
      return `Repayment follows official NELFUND rules after the applicable NYSC or study period.\n\nConfirm on ${SITE} and ${PORTAL}. I will not invent a start date, percentage, or penalty.`
    }
  }

  return null
}
