import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-78 wording. Pending angles differ by phrase. No invented dates. No long dashes. */
export function playbookHourly78(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/when\s*(will|go)\s*(i|una)\s*(get|see)\s*(paid|pay|money|upkeep)|una\s*go\s*pay\s*when|when\s*una\s*go\s*pay|how\s*long\s*(will|go)\s*(this|am|e)\s*(take|dey)|e\s*don\s*take\s*(too\s*)?(long|time)|batch\s*(never|no)\s*(come|drop)|awaiting\s*(disbursement|payment)/i.test(t)) {
      return `I will not invent a pay day or batch date.\n\n1. Sign in at ${PORTAL} and copy the exact word: submitted, processing, or approved.\n2. School charges and upkeep can move on different days.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*never\s*(enter|show|drop|reflect)|payment\s*(no|never|not)\s*(show|enter|reflect)|upkeep\s*never|loan\s*never\s*(enter|reflect)|i\s*never\s*see\s*(alert|credit|money)|they\s*never\s*(credit|pay)\s*me|dem\s*never\s*pay/i.test(t)) {
      return `Money not in your bank is not the same as a dead file.\n\n1. Open ${PORTAL} and read the live status. I cannot see your account from this chat.\n2. Institutional fees go to the school first. Upkeep only if you ticked it for that session.\n3. Do not open a second account. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/how\s*far\s*(my|with)\s*(own|application|loan|file)|no\s*update\s*(on|for)|i\s*don\s*apply\s*since|submitted\s*(last\s*)?(year|month|week)|my\s*(own|file)\s*still\s*(pending|processing)|status\s*(still|dey)\s*(processing|pending|review)/i.test(t)) {
      return `How far your own is only on the portal, not in this chat.\n\n1. Log in at ${PORTAL} with the same email.\n2. Copy submitted / processing / approved exactly.\n3. I will not invent how many days that word lasts. Weeks unchanged: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/so\s*what\s*(will|should)\s*i\s*do|what'?s\s*next|wetin\s*i\s*go\s*do|first\s*step|what\s*should\s*i\s*do\s*now/i.test(t)) {
      return `Next step for a pending file is check, not a new apply.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. Keep one account. Do not register again.\n3. If that word has not moved for a long time, take the copy to your campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid\s*jamb|jamb\s*(number|no|reg)\s*(not|no)\s*(valid|correct)|verification\s*failed/i.test(t)) {
      return `Invalid JAMB on the portal means CAPS and the number must match what JAMB has.\n\n1. Check the JAMB registration number character by character.\n2. Confirm admission shows on JAMB CAPS for that same number.\n3. Retry on ${PORTAL}. I cannot override JAMB from this chat.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(already|don)\s*(used|exist|register)|registered\s*last\s*year|cannot\s*create/i.test(t)) {
      return `That email already has an account. Do not create a new one.\n\n1. Use Sign in on ${PORTAL}.\n2. If you forgot the password, use the portal reset only.\n3. Last year registration still uses the same login.`
    }
  }

  if (intent === 'school-not-found') {
    if (/school\s*(not|no)\s*(showing|show|dey)|institution\s*missing|no\s*dey\s*list/i.test(t)) {
      return `If your school is missing on the list, do not invent a nearby name.\n\n1. Search the official name and abbreviation on ${PORTAL}.\n2. Confirm the school is on the NELFUND participating list.\n3. Still missing: campus NELFUND desk, then ${ESUPPORT}. I will not add a school from this chat.`
    }
  }

  return null
}
