import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-87 wording. Same pending intent, different angles. No invented pay dates. */
export function playbookHourly87(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/money|alert|credit|reflect|account\s*(no|not|never)|never\s*enter|no\s*pay|not\s*paid|upkeep/i.test(t)) {
      return `I cannot see your bank from this chat, so I will not invent a pay date.\n\n1. Open ${PORTAL} and copy the exact status word (Pending, Processing, Approved, and so on).\n2. School charges go to the school first. Upkeep, if approved, goes to the account you saved.\n3. No SMS does not mean they declined you.\n4. Same word for many weeks after school confirms the record: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/how\s*far|my\s*own|my\s*matter|wetin\s*(dey\s*)?happen|have\s*you|una\s*don\s*see/i.test(t)) {
      return `How far na: I no fit open your file from here.\n\n1. Login for ${PORTAL} and yarn the exact status word you see.\n2. If e still dey Pending or Processing, that na wait. E no mean reject.\n3. If school charges don show for school but your own never enter, ask the campus NELFUND desk first.\n4. Still the same after weeks: ${ESUPPORT}. I no go invent when money go drop.`
    }
    if (/processing|still\s*pending|status\s*still|file\s*(no|not|never)\s*move|weeks|months|batch|payment\s*list/i.test(t)) {
      return `Status still processing means the portal has the file. It does not give a calendar date.\n\n1. Recheck the same word on ${PORTAL}. Screenshot it if you will write support.\n2. Ask whether your school has uploaded / confirmed the session record.\n3. Batch lists on WhatsApp are not official. Use ${SITE} or ${PORTAL} only.\n4. Weeks with no change after school confirms: ${ESUPPORT}.`
    }
    if (/what\s*(should|will|can)\s*i|what'?s\s*(next|the\s*next)|wetin\s*i\s*go\s*do|first\s*step|so\s*what/i.test(t)) {
      return `Next step on a pending file:\n\n1. Copy the exact status word from ${PORTAL}.\n2. Confirm with ICT / Registry that your record is uploaded.\n3. Do not open a second account while you wait.\n4. Still stuck after school confirms: ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid|not\s*valid|failed|fail|no\s*gree|reject|wrong/i.test(t)) {
      return `Invalid JAMB on the portal usually means the number does not match what JAMB / the school sent, not that NELFUND banned you.\n\n1. Type the JAMB / UTME number exactly as on your slip. No extra space.\n2. If the name or year is different from school records, fix it with JAMB and the school first.\n3. Try again on ${PORTAL}.\n4. Still failed after the school confirms the same number: ${ESUPPORT}. I will not invent a bypass.`
    }
  }

  return null
}
