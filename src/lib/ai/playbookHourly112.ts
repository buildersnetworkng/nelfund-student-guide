import type { IntentId } from './types'
import { playbookHourly111 } from './playbookHourly111'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-112 replies. Same pending intent, different angles from 111.
 * No invented pay dates. No long dashes.
 */
export function playbookHourly112(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'portal-login') {
    if (
      /email\s*(already|don|has\s*been)\s*(used|exist|taken|register)|registered\s*(last\s*year|before)|cannot\s*create\s*(an?\s*)?account|account\s*(already|don)\s*exist/i.test(
        t,
      )
    ) {
      return `That email already has an account. Do not start a new one.\n\n1. Sign in at ${PORTAL} with the same email from last year.\n2. Use Forgot password on that same page if you cannot remember it.\n3. A second account with another mail usually gets blocked.`
    }
  }

  if (intent === 'pending-application') {
    if (/when\s*(will|go)\s*i\s*(receive|collect|see)\s*(my\s*)?(upkeep|money|loan|stipend)|how\s*long\s*(before|till|until)\s*(they|dem|nelfund)\s*pay/i.test(t)) {
      return `I will not invent a pay date. Nobody here can see your batch from this chat.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school first. Upkeep, if you ticked it, can land later.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/approved\s*(but|and)\s*(no|not|never)\s*(money|pay|disburse|alert)|is\s*my\s*(loan|application)\s*(approved|done|ready)/i.test(t)) {
      return `Approved on a screen is not the same as money in your bank.\n\n1. Confirm the exact word on ${PORTAL}. Screenshot rumours do not count.\n2. After approval the school still has to finish its side.\n3. No alert yet is common. Desk, then ${ESUPPORT} if it stays frozen.`
    }
    if (/upkeep\s*(dey\s*)?(delay|late|slow)|upkeep\s*(never|no)\s*(enter|drop|show)|disbursement\s*(never|no|not)\s*(come|enter)/i.test(t)) {
      return `Upkeep delay is not automatic decline.\n\n1. Charges and upkeep are two different payments.\n2. Upkeep only applies if you ticked it for that session on ${PORTAL}.\n3. I will not invent the amount. Campus desk if the word stays the same for weeks.`
    }
    if (/they\s*have\s*not\s*paid\s*me|dem\s*never\s*pay|nelfund\s*(never|no)\s*(credit|pay)\s*me|why\s*(my\s*)?(money|upkeep|loan)\s*(no|never|not)\s*(enter|drop)|my\s*own\s*(never|no)\s*(enter|pay)/i.test(t)) {
      return `Dem never pay you does not mean they rejected you.\n\n1. Check the exact word on ${PORTAL}. I cannot open your file here.\n2. School fees go to the school. You may get no SMS.\n3. Long wait on the same word: campus desk, then ${ESUPPORT}.`
    }
    if (/i\s*applied\s*(last\s*year|last\s*session)|i\s*don\s*wait\s*since|submitted\s*since|under\s*review\s*(for|since)/i.test(t)) {
      return `Waiting since last session is a school-side or batch issue more often than a broken form.\n\n1. Sign in at ${PORTAL} and copy the status word as it is today.\n2. Ask the campus NELFUND desk if your record is uploaded for this cycle.\n3. Then ${ESUPPORT}. Do not open a second account.`
    }
    if (/awaiting\s*disbursement|(bank\s*)?account\s*(still\s*)?(empty|zero)|i\s*never\s*see\s*(alert|credit|money)|payment\s*(no|never|not)\s*(show|enter)/i.test(t)) {
      return `Empty bank plus awaiting disbursement still means wait on the portal word, not a new form.\n\n1. Confirm the account on ${PORTAL} is yours and active.\n2. No alert can still mean the school already got charges.\n3. Weeks with no change: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb\s*(dey\s*)?(reject|fail|bounce)|my\s*jamb\s*(no|never)\s*(gree|work)|cannot\s*verify|jamb\s*mismatch|utme\s*(number|reg)/i.test(t)) {
      return `JAMB reject / mismatch: type the number exactly as on the admission letter.\n\n1. No extra space. Name and date of birth must match JAMB and NIN.\n2. Direct Entry still uses a real JAMB registration.\n3. Still failing: campus desk, then ${ESUPPORT}. Do not create a second account.`
    }
  }

  return playbookHourly111(intent, userText)
}
