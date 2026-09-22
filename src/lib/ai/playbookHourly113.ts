import type { IntentId } from './types'
import { playbookHourly112 } from './playbookHourly112'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-113 replies. No invented pay dates or policy. No long dashes.
 */
export function playbookHourly113(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'portal-login') {
    if (
      /email\s*(i\s*)?(use|used)\s*(last\s*year|before)|last\s*year\s*(i\s*)?(register|registered)|mail\s*(don|already)\s*(dey|been)\s*(use|used)|i\s*use\s*(this|dis)\s*(same\s*)?(mail|email)/i.test(
        t,
      )
    ) {
      return `That mail already belongs to an account. Log in. Do not create another one.\n\n1. Sign in at ${SITE} with the same email from last year.\n2. Forgot password is on that page.\n3. A second mail usually gets blocked.`
    }
  }

  if (intent === 'school-not-found') {
    if (/school\s*(no|not|never)\s*(dey|show)|cannot\s*find\s*(my\s*)?(school|institution)|institution\s*(no|not)\s*(on|in)\s*(the\s*)?list|school\s*list/i.test(t)) {
      return `If your school is not on the list, the school must upload your record first.\n\n1. Ask ICT / Registry / NELFUND desk to confirm the upload.\n2. Retry ${PORTAL} after they confirm.\n3. Still missing: ${ESUPPORT}. I will not invent a school list.`
    }
  }

  if (intent === 'pending-application') {
    if (/how\s*far|e\s*never\s*(move|change)|dashboard\s*(still\s*)?(zero|0|empty)|batch\s*(no|not|never)\s*reach|mates\s*don\s*(collect|receive)/i.test(t)) {
      return `How far on your file is only on the portal. I cannot see your batch here.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. Mates collecting does not mean yours is declined.\n3. Same word for weeks: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/jamb\s*(no|not|never)\s*(dey|gree|work|pass|verify)|invalid\s*(jamb|utme)|portal\s*(say|says?)\s*(invalid|wrong)\s*jamb/i.test(t)) {
      return `Type the JAMB / UTME number exactly as on the admission letter.\n\n1. No extra space. Name and date of birth must match JAMB and NIN.\n2. Direct Entry still needs a real JAMB registration.\n3. Still failing: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'repayment') {
    if (/how\s*(i|we)\s*(go|fit)\s*pay|when\s*(i|we)\s*(go|will)\s*(start\s*)?repay|after\s*nysc|wetin\s*be\s*(the\s*)?repay/i.test(t)) {
      return `Repayment is not while you are still in school on this chat.\n\n1. Official rules live on ${SITE} and the FAQ. I will not invent a start date.\n2. After NYSC is the usual public line. Confirm on the official pages.\n3. GSI / salary questions: same official pages, then ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/abeg\s*(help|assist)|i\s*just\s*(dey|come)|wetin\s*una\s*(fit|can)|i\s*no\s*know\s*wetin\s*to\s*(type|ask)|help\s*me\s*(with\s*)?(this|dis)|i\s*dey\s*stranded|brief\s*me/i.test(t)) {
      return `How far, welcome.\n\nI can help with apply steps, portal login, JAMB / NIN issues, pending status, school not on the list, upkeep, and repayment.\n\nSay the one that matches your screen. I will not dump a live open/close status here.\n\n${PORTAL}`
    }
  }

  return playbookHourly112(intent, userText)
}
