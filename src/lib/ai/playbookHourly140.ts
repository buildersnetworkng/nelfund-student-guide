import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Distinct JAMB answers by angle so paraphrases do not share one dump. */
export function playbookHourly140(intent: IntentId, userText: string): string | null {
  const t = userText || ''
  if (intent !== 'jamb-verification') return null

  if (/verification\s*failed\s*(on|for)\s*jamb|cannot\s*verify|jamb\s*(verification|verify)\s*(failed|fail|no\s*gree)/i.test(t)) {
    return `Verification failed on JAMB means the portal could not match the number you typed to JAMB records.\n\n1. Type the JAMB registration number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Retry on ${PORTAL}. Still fail: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/jamb\s*(number\s*)?(not|no)\s*(valid|correct|working)|invalid\s*jamb|e\s*say\s*jamb\s*(invalid|wrong)|portal\s*reject\s*(my\s*)?jamb|jamb\s*reg\s*(no|number)\s*(wrong|invalid)/i.test(t)) {
    return `Invalid JAMB number is usually a typing or record mismatch, not a new account.\n\n1. Copy the number from the admission letter, not from memory.\n2. Check that surname and date of birth match JAMB.\n3. Stay on the same login at ${PORTAL}. Do not open a second email.\n4. Still rejected: campus desk, then ${ESUPPORT}.`
  }

  if (/jamb\s*no\s*dey\s*(work|gree)|my\s*jamb\s*(no|not)\s*(dey|work|valid)|jamb\s*wahala|dem\s*say\s*my\s*jamb\s*(no|not)\s*correct/i.test(t)) {
    return `JAMB wahala for NELFUND is a match check, not a new JAMB exam.\n\n1. Use the same JAMB number your school uploaded.\n2. If school used a different number, the campus NELFUND desk must fix the record first.\n3. Then retry ${PORTAL}.\n4. I will not invent a bypass. Still blocked: ${ESUPPORT}.`
  }

  if (/jamb\s*and\s*nin\s*(no|not)\s*match|jamb\s*details\s*(no|not)\s*match|admission\s*letter\s*jamb/i.test(t)) {
    return `JAMB and NIN must describe the same person.\n\n1. Compare name order and date of birth on JAMB, NIN, and the portal profile.\n2. Fix the profile only if the portal lets you edit.\n3. School-side mismatch: campus NELFUND desk.\n4. Confirm only on ${PORTAL} / ${SITE}. Ticket: ${ESUPPORT}.`
  }

  if (/utme\s*(number|reg)\s*(invalid|fail)/i.test(t)) {
    return `UTME / JAMB registration is the same check on the NELFUND form.\n\n1. Enter the full registration number from the admission letter.\n2. Direct Entry students still use the number the school uploaded.\n3. Retry ${PORTAL}. Still failing: campus desk, then ${ESUPPORT}.`
  }

  return `JAMB must match what your school uploaded for this session.\n\n1. Type it exactly as on the admission letter.\n2. Name and date of birth must match NIN.\n3. Retry ${PORTAL}. Still failing: campus NELFUND desk, then ${ESUPPORT}.`
}
