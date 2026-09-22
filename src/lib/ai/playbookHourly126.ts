import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly126(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/cash\s*(never|no)\s*(drop|enter|land)|no\s*kobo|e\s*never\s*land|my\s*account\s*(still\s*)?(empty|blank)|payment\s*(no|never)\s*(show|enter)/i.test(t)) {
      return `No cash in the account yet is still a wait on your file. I cannot see the file from here.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school first. You can wait with no personal alert.\n3. Upkeep only if you ticked it in the same session, and it can land later.\n4. I will not invent a pay date. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/when\s*(will|go)\s*i\s*(receive|collect|see)|when\s*my\s*(own|money)\s*go\s*drop|any\s*credit\s*yet|stipend\s*(never|no)\s*(land|enter)|upkeep\s*still\s*(coming|pending)/i.test(t)) {
      return `I will not invent when the money will drop.\n\n1. Check ${PORTAL} for the exact word on institutional charges and on upkeep.\n2. Those two lines can move on different days.\n3. Confirm the bank on your profile is a regular Nigerian bank in your name.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/been\s*(processing|pending)|awaiting\s*(disbursement|payment)|status\s*na\s*(awaiting|processing|pending)|processing\s*for\s*(weeks?|months?)|e\s*no\s*move\s*since/i.test(t)) {
      return `Processing or awaiting for weeks is still a wait, not a new apply.\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Ask the campus NELFUND desk if your student record is uploaded for this session.\n3. No SMS does not mean declined.\n4. I will not invent a batch date. Still the same word: ${ESUPPORT}.`
    }
    if (/loan\s*(balance|total)\s*(still\s*)?(is\s*)?(0|zero)|i\s*never\s*see\s*(my\s*)?(own|share)/i.test(t)) {
      return `Zero on the dashboard or you never see your own is still your portal file.\n\n1. Sign in at ${SITE} with the same email. Do not open a second account.\n2. Open ${PORTAL} and copy the exact status word.\n3. School paid is not the same as upkeep paid.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid\s*jamb|jamb\s*(number|reg).{0,12}(not|no)\s*(valid|correct)|verification\s*failed\s*(on\s*)?jamb|jamb\s*verification\s*(fail|failed)|portal\s*say\s*jamb/i.test(t)) {
      return `Invalid JAMB on the portal is a data check, not a new account.\n\n1. Type the JAMB / UTME number exactly as it is on the admission letter.\n2. Stay on the same login at ${SITE}. Do not create another email to retry.\n3. If CAPS or the school record is not up yet, ask the campus NELFUND desk.\n4. Still failing: ticket ${ESUPPORT} with a screenshot of the exact error. I will not invent a JAMB fix code.`
    }
  }

  return null
}
