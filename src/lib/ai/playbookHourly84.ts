import type { IntentId } from './types'
import { playbookHourly85 } from './playbookHourly85'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const FAQ = 'https://nelf.gov.ng/faq'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-84 wording. Vague help stays a short menu. No invented dates. No long dashes. */
export function playbookHourly84(intent: IntentId, userText?: string): string | null {
  const newer = playbookHourly85(intent, userText)
  if (newer) return newer
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /wetin\s*i\s*go\s*type|wetin\s*person\s*suppose\s*ask|i\s*no\s*know\s*wetin\s*to\s*write|i\s*just\s*land|na\s*so\s*i\s*enter|show\s*me\s*(the\s*)?(things|stuff)|list\s*(am|options)|i\s*need\s*direction|point\s*me|make\s*i\s*ask\s*una|any\s*info|tell\s*me\s*wetin\s*to\s*do\s*first|i\s*dey\s*confused|confused\s*abeg|help\s*me\s*navigate|how\s*una\s*take\s*dey\s*help|break\s*(nelfund|am)\s*down|simplify|wetin\s*this\s*bot|wetin\s*you\s*(fit|can)\s*answer|first\s*timer|i\s*just\s*hear\s*of\s*nelfund|somebody\s*send\s*me/i.test(
        t,
      )
    ) {
      return `No wahala. Pick one thing.\n\n1. How to apply: ${PORTAL}\n2. Last-year email / login: ${SITE}\n3. How far or money never enter: copy the status word on ${PORTAL}\n4. Official FAQ: ${FAQ}\n\nI will not invent a deadline or a pay date.`
    }
  }

  if (intent === 'pending-application') {
    if (/i\s*still\s*dey\s*wait|waiting\s*since|nothing\s*don\s*change|status\s*no\s*move|una\s*forget\s*my|dem\s*forget\s*my|e\s*just\s*dey\s*there/i.test(t)) {
      return `Still waiting is a portal check, not a new apply.\n\n1. Sign in at ${PORTAL} and copy submitted, processing, under review, or approved.\n2. School charges can reach the school while your bank stays quiet.\n3. I will not invent a credit date. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  return null
}
