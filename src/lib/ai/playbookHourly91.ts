import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-91 wording. Different angle per phrasing. No invented dates or amounts. */
export function playbookHourly91(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/una\s*don\s*pay\s*(others|everybody|class)|they\s*have\s*not\s*paid|has\s*not\s*been\s*paid|i\s*never\s*see\s*(my\s*)?(upkeep|alert)/i.test(t)) {
      return `Mates collecting first does not mean your file was cancelled. I cannot see your bank from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. School charges go to the school. Upkeep is a later separate step.\n3. Same word after school confirms: campus desk, then ${ESUPPORT}.`
    }
    if (/my\s*file\s*(no|not|never)\s*(move|change)|application\s*has\s*not\s*moved|status\s*word\s*(no|not|never)|processing\s*since|submitted\s*(last|last\s*year)/i.test(t)) {
      return `A file that does not move is still a portal status problem, not a new deadline I can invent.\n\n1. Open ${PORTAL} and write down the exact word (Pending, Processing, Approved).\n2. Ask ICT or Registry if your record is uploaded for this cycle.\n3. After they confirm and the word is still the same, open ${ESUPPORT}.`
    }
    if (/no\s*credit\s*alert|nothing\s*show\s*for\s*(my\s*)?(bank|account)|dashboard\s*(still\s*)?(zero|0|empty)|still\s*waiting\s*for\s*(the\s*)?(money|upkeep)/i.test(t)) {
      return `No alert and an empty dashboard line do not prove they declined you. I cannot invent a pay day.\n\n1. Check ${PORTAL} yourself. Copy status, not rumours.\n2. Fees hit the school first. Upkeep is not the same payment.\n3. Long wait after school confirms: ${ESUPPORT}.`
    }
    if (/wetin\s*happen\s*to\s*my\s*own|check\s*(my\s*)?(application\s*)?status|i\s*dey\s*wait\s*since|loan\s*still\s*(dey|is)\s*(processing|pending)/i.test(t)) {
      return `I no fit open your own file from here. Status na for the portal.\n\n1. Login ${PORTAL} and copy the exact word you see.\n2. If e still dey the same, ask school NELFUND desk whether dem don upload you.\n3. After that, ticket ${ESUPPORT}. Official site: ${SITE}`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(is\s*)?(already\s*)?(in\s*use|taken)|registered\s*with\s*(this\s*)?(same\s*)?email|cannot\s*create\s*(an?\s*)?account\s*with/i.test(t)) {
      return `That email already has an account. Do not start a second signup.\n\n1. Sign in at ${SITE}.\n2. ${PORTAL} new account is only if you never registered.\n3. Forgot password: reset on ${SITE}.\n4. Still locked: ${ESUPPORT}.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid\s*jamb|jamb\s*(number\s*)?(is\s*)?(saying|say|shows?)|jamb\s*verification\s*(fail|failed)|utme\s*no\s*gree/i.test(t)) {
      return `Invalid JAMB means the number the portal checked did not match what JAMB holds. I cannot override it here.\n\n1. Re-type the full JAMB / UTME number with no extra space.\n2. Use the same number on your admission papers.\n3. If it still fails after a correct number, campus desk then ${ESUPPORT}. Portal: ${PORTAL}`
    }
  }

  if (intent === 'school-not-found') {
    if (/school\s*(no|not)\s*dey|institution\s*missing|cannot\s*find\s*(my\s*)?school|my\s*uni\s*(no|not)/i.test(t)) {
      return `If the school name is missing from the list, the portal cannot attach your record yet.\n\n1. Search another official spelling of the same school on ${PORTAL}.\n2. Ask ICT / Registry to confirm they uploaded students to NELFUND.\n3. Still missing after they confirm: ${ESUPPORT}.`
    }
  }

  return null
}
