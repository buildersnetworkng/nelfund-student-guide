import { playbookHourly147 } from './playbookHourly147'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 146: pending angles that still sounded like one dump. */
export function playbookHourly146(intent: string, t: string): string | null {
  const from147 = playbookHourly147(intent, t)
  if (from147) return from147

  if (intent !== 'pending-application') return null
  const q = t || ''

  if (/how\s*long|how\s*many\s*days|how\s*many\s*weeks|approval\s*time|processing\s*time|sla/i.test(q)) {
    return `**How long approval takes is not a number I can invent.**\n\n1. Copy the exact status word from ${PORTAL}. That word is the only live signal for your file.\n2. Same word for weeks can happen while the school record or a payment batch moves.\n3. No SMS does not mean declined. School charges go to the institution first.\n4. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/kobo|zero\s*naira|no\s*kobo|bank\s*(still\s*)?(empty|zero)|e\s*never\s*show\s*for\s*(bank|account)/i.test(q)) {
    return `**No kobo in the bank is still a wait on the same file.**\n\n1. Open ${PORTAL} and copy the exact status word. This chat cannot see your account.\n2. Institutional charges go to the school. Your personal balance can stay at zero after that.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent a credit date. Long wait: campus desk, then ${ESUPPORT}.`
  }

  if (/una\s*forget|una\s*skip|dem\s*forget|only\s*me\s*remain|my\s*own\s*dey\s*behind|my\s*file\s*dey\s*sleep|e\s*don\s*tey/i.test(q)) {
    return `**Feeling skipped is still your portal file, not a public list I can invent.**\n\n1. Sign in and copy the exact status word on ${PORTAL}.\n2. Classmates can collect while your line waits. That is not automatic decline.\n3. Do not open a second account.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/stuck\s*(on|for)\s*pending|pending\s*(for\s*)?(months?|weeks?)|nothing\s*since|i\s*apply\s*last\s*(session|year)/i.test(q)) {
    return `**Stuck on pending for a long time is still a wait, not a new apply.**\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Ask the campus NELFUND desk if your student record is uploaded for this session.\n3. I will not invent how many months is too long.\n4. After the school confirms the upload, ticket ${ESUPPORT} with that exact sentence and a screenshot.`
  }

  return null
}
