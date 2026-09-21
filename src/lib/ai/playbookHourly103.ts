import type { IntentId } from './types'
import { playbookHourly102 } from './playbookHourly102'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Angle-specific replies for hour 103. Pending-status is the largest named unknown topic.
 */
export function playbookHourly103(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/what\s*(should|will|do)\s*i\s*do|what'?s\s*next|wetin\s*i\s*go\s*do|first\s*step|what\s*should\s*i\s*do\s*now/i.test(t)) {
      return `Next step is on your own file, not a new registration.\n\n1. Sign in at ${PORTAL} and write down the exact status word.\n2. Keep that same account. Do not open a second one.\n3. If the word has not moved after you asked campus desk: ${ESUPPORT}.`
    }
    if (/how\s*long|how\s*many\s*(days|weeks|months)|when\s*(will|go)\s*(they|dem|una)\s*(finish|clear)/i.test(t)) {
      return `I will not invent how many days a pending file takes.\n\n1. Check ${PORTAL} for the live status word.\n2. School line and upkeep line can clear on different days.\n3. Official wait help: ${ESUPPORT}.`
    }
    if (/is\s*(something|anything)\s*wrong|did\s*(i|we)\s*(do|make)\s*(mistake|error)|why\s*(e|it)\s*(no|not)\s*move/i.test(t)) {
      return `Pending does not by itself mean you did something wrong.\n\n1. Open ${PORTAL} and confirm the word is still pending or processing.\n2. If the portal shows a red error instead, copy that sentence.\n3. Campus desk first, then ${ESUPPORT} if it stays the same.`
    }
    if (/application\s*(is|na)\s*pending|status\s*still\s*processing|my\s*application\s*is\s*pending/i.test(t)) {
      return `That wording means wait on the same application.\n\n1. Stay signed in at ${PORTAL}.\n2. Copy the status word exactly as shown.\n3. Do not start a fresh account for the same person.\n4. Long same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  return playbookHourly102(intent, userText)
}
