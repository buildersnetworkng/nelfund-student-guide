const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-54 playbook extras for leftover other / pending phrasing. */
export function playbookHourly54(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    intent === 'pending-application' &&
    /started\s*(pay|paying|disburse)|dey\s*pay\s*(now|already)|pay\s*list|batch\s*(don|has)|no\s*credit\s*alert|e\s*no\s*(show|reflect)\s*(for|on)\s*(my\s*)?(account|bank)/i.test(
      t,
    )
  ) {
    return `**I cannot confirm that NELFUND has paid you from this chat.** "They have started paying" on social media is not your file.\n\n1. Open ${PORTAL} and copy the exact status word on your own dashboard.\n2. School charges go to the school. Upkeep, if you ticked it, goes to your bank later. No SMS does not mean declined.\n3. I will not invent a batch or pay date. Confirm only on the portal.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'institution-verification') {
    return `**Institution verification pending means the school record is the blocker, not a second account.**\n\n1. Ask ICT / Registry / the campus NELFUND desk whether your data is uploaded.\n2. Name, date of birth, and JAMB number must match what the school sent.\n3. Retry ${PORTAL} after the school confirms.\n4. Still pending after they confirm: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /direct\s*entry|old\s*jamb|de\s*jamb/i.test(t)) {
    return `**Use the JAMB / Direct Entry number the portal asks for, in your own name.**\n\n1. Old year numbers often fail if they are not the record tied to this admission.\n2. Do not invent a workaround or pay anyone to "fix JAMB".\n3. Retry ${PORTAL}. If it still says invalid, campus desk then ${ESUPPORT}.\n4. Do not open a second account.`
  }

  return null
}
