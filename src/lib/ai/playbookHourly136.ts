import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Pending angles that still shared one dump: same-word, no-alert, batch miss, long wait, stuck file. */
export function playbookHourly136(intent: IntentId, userText: string): string | null {
  const t = userText || ''
  if (intent !== 'pending-application') return null

  if (/tin\s*still\s*dey\s*(submitted|pending|applied)|e\s*still\s*show\s*(submitted|applied)|word\s*never\s*change|nothing\s*(don|has)\s*change|same\s*word/i.test(t)) {
    return `Same word on the portal (Submitted or Pending) is still a wait, not a new apply.\n\n1. Copy the exact sentence from ${PORTAL}. I cannot see your file from this chat.\n2. Do not open a second account because the word did not change.\n3. Ask the campus NELFUND desk if your session record is uploaded.\n4. I will not invent when the word changes. Long same-word wait: ${ESUPPORT}.`
  }

  if (/alert\s*(no|never|not)\s*(drop|enter|show)|no\s*alert|never\s*see\s*alert|bank\s*alert/i.test(t)) {
    return `No bank alert does not mean the file was declined.\n\n1. School charges go to the institution first. Your personal account can stay quiet.\n2. Upkeep only if you ticked it in the same session, and only into the bank on your profile.\n3. Recheck the exact status word on ${PORTAL}.\n4. I will not invent an alert date. Same quiet bank for weeks: campus desk, then ${ESUPPORT}.`
  }

  if (/batch\s*(don\s*)?(pass|pay)|dem\s*pay\s*(my\s*)?(mates?|class)|everybody\s*(don|has)\s*(collect|see)|others\s*(don|have)\s*(collect|receive)|my\s*mates?\s*(don|have)\s*(collect|see)/i.test(t)) {
    return `Mates collecting before you does not prove your file is closed.\n\n1. Batches move school by school and file by file. Copy your own word on ${PORTAL}.\n2. School paid is not the same as money in your pocket.\n3. Do not create another account to chase a batch.\n4. I will not invent your batch date. Long miss after mates collected: campus desk, then ${ESUPPORT}.`
  }

  if (/i\s*don\s*wait|wait(ed|ing)?\s*(for\s*)?(two|2|three|3)|since\s*(june|july|august|september|may)|apply\s*since/i.test(t)) {
    return `A long wait is still the same file. Time passing is not a new application.\n\n1. Stay on the same login at ${SITE} / ${PORTAL}.\n2. Copy the exact status word. I will not invent how many weeks it should take.\n3. Ask the campus desk if upload for this session is done.\n4. Same word for months: ${ESUPPORT}.`
  }

  if (/my\s*file\s*(no|never|not)\s*(move|change)|file\s*no\s*dey\s*move|application\s*stuck|stuck\s*(on|for)\s*(pending|submitted|processing)/i.test(t)) {
    return `A stuck file is a wait on the same record, not a reset.\n\n1. Open ${PORTAL} and copy the exact word. I cannot move the file from this chat.\n2. Ask ICT / Registry / campus NELFUND desk to confirm upload.\n3. Do not create a second account to unstick it.\n4. Still the same word after they confirm: ${ESUPPORT}.`
  }

  if (/dem\s*(don\s*)?pay\s*(the\s*)?school|school\s*(don|has)\s*(collect|receive).{0,28}(i|me)\s*never|institution\s*(don|has)\s*(collect|receive)/i.test(t)) {
    return `School already collected institutional charges. That money does not land in your bank.\n\n1. Upkeep is separate. It only comes if you ticked it in the same session.\n2. Confirm the exact word on ${PORTAL}. School paid is not Disbursed-to-you.\n3. I will not invent an upkeep date.\n4. Still no personal credit after that check: campus desk, then ${ESUPPORT}.`
  }

  if (/how\s*far\s*(na\s*)?(this|dis)\s*(my\s*)?(own|tin|file)|wetin\s*dey\s*happen\s*(to\s*)?(my\s*)?(own|loan)|any\s*movement\s*(for|on)\s*(my\s*)?(own|loan)/i.test(t)) {
    return `How far this your own starts on the portal, not on WhatsApp.\n\n1. Sign in at ${SITE} then open ${PORTAL} and copy the exact status word.\n2. I cannot see your file from this chat.\n3. School charges go to the school first.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  return null
}
