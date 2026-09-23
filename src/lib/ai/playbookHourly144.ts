import { playbookHourly145 } from './playbookHourly145'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific school-not-found and pending replies. */
export function playbookHourly144(intent: string, t: string): string | null {
  const from145 = playbookHourly145(intent, t)
  if (from145) return from145

  if (intent === 'school-not-found') {
    if (/no\s*dey\s*list|not\s*(on|in)\s*(the\s*)?list|dropdown/i.test(t)) {
      return `**Your school no dey the list / dropdown**\n\nThe portal only lists schools that have uploaded student records for this cycle.\n\n1. Confirm you attend a public tertiary institution.\n2. Ask ICT / Registry / the campus NELFUND desk to upload your record.\n3. Search again on ${PORTAL} after they confirm. Still missing: ${ESUPPORT}`
    }
    if (/institution\s*missing|cannot\s*find|cannot\s*see/i.test(t)) {
      return `**Institution missing on the portal**\n\nThat is a school-record problem, not a reason to open a second account.\n\n1. Check spelling and the official school name on ${PORTAL}.\n2. Ask the campus NELFUND desk if your institution file is live.\n3. After they confirm, retry. Still missing: ${ESUPPORT}`
    }
    return `**School not showing on the portal**\n\nUsually the school has not finished uploading the student list.\n\n1. Confirm public institution.\n2. Ask the campus NELFUND desk to upload your record.\n3. Retry ${PORTAL}. Still not there: ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    if (/money\s*never|never\s*enter|no\s*alert|never\s*(credit|drop)/i.test(t)) {
      return `**Money never enter is still a wait on the same file.** Do not open a second account.\n\n1. Open ${PORTAL} and copy the exact status word. This chat cannot see your bank.\n2. School charges go to the institution first. You can have no personal SMS even after the school is paid.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent a pay date. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/still\s*processing|status\s*still|under\s*review|application\s*(is\s*)?pending/i.test(t)) {
      return `**Pending / still processing is a status word, not a pay date.**\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Same word for weeks can happen while the school record or a batch moves.\n3. No SMS does not mean declined.\n4. I will not invent how many days it takes. Long wait: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/how\s*far|wetin\s*dey\s*(happen|hold|sup)/i.test(t)) {
      return `**How far my own starts on the portal, not in this chat.**\n\n1. Sign in and open ${PORTAL}. Copy the exact status word.\n2. School fees go to the school. Upkeep (if ticked) can land later.\n3. Do not create another account to check faster.\n4. I will not invent a pay date. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }
  return null
}
