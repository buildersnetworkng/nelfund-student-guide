import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly124(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/dashboard\s*(still\s*)?(zero|0|empty)|total\s*(loan|amount)\s*(still\s*)?(0|zero)|balance\s*(still\s*)?(0|zero)/i.test(t)) {
      return `Zero on the dashboard is a status you can read, not a pay date I can invent.\n\n1. Open ${PORTAL} and copy the exact word next to your application (pending, processing, approved).\n2. Institutional charges go to the school first. Upkeep only hits your bank if that line was approved.\n3. Same zero for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/batch|hostel|room\s*(people|mates)|class\s*(people|mates)|name\s*(no|not)\s*dey\s*(the\s*)?(list|batch)|una\s*forget|una\s*no\s*remember/i.test(t)) {
      return `Another hostel or batch getting paid first does not close your file.\n\n1. Check the exact status word on ${PORTAL}.\n2. Ask the campus NELFUND desk if your record is in the current upload.\n3. Still the same after that: ${ESUPPORT}. I will not invent which batch you are in.`
    }
    if (/upkeep\s*(no|not|never)\s*(show|enter|drop)|no\s*credit\s*alert\s*since|nothing\s*for\s*(my\s*)?(account|bank)/i.test(t)) {
      return `No credit alert does not automatically mean they declined you.\n\n1. Read the status line on ${PORTAL}.\n2. Upkeep lands only if that line was approved, and only into the account on your profile.\n3. Weeks with no change: campus desk, then ${ESUPPORT}.`
    }
    if (/submitted\s*(only|since)|processing\s*since|i\s*submit(ted)?\s*since|stuck\s*(for|on)|file\s*(no|not|never)\s*(move|change)|e\s*never\s*leave\s*pending/i.test(t)) {
      return `Submitted or processing for a long time is still a waiting status. Refreshing every hour does not jump the queue.\n\n1. Copy the exact word on ${PORTAL}.\n2. If it has sat on the same word for weeks, ask the campus NELFUND desk to confirm your enrollment record.\n3. After that, open a ticket at ${ESUPPORT}. I will not invent a clearance date.`
    }
  }

  if (intent === 'official-sources') {
    if (/help\s*(me)?\s*(abeg|pls)?$|i\s*need\s*help|wetin\s*una\s*fit\s*do|yarn\s*me\s*how\s*this\s*chat|i\s*dey\s*confused|make\s*we\s*start|what\s*can\s*you\s*help/i.test(t)) {
      return `I can help with NELFUND only. Pick one:\n\n- how to apply or create account\n- pending / how far / money never enter\n- JAMB invalid, email already used, school not on the list\n- upkeep or repayment\n\nOfficial pages: ${SITE} and ${PORTAL}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid\s*jamb|jamb\s*(no|not|never)\s*(valid|gree)|verify\s*(my\s*)?jamb|jamb\s*wahala|utme/i.test(t)) {
      return `Invalid JAMB usually means the number or the name does not match what JAMB has.\n\n1. Type the registration number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not open a second account.`
    }
  }

  return null
}
