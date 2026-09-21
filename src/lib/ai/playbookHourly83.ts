import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-83 wording. Pending angles differ by phrase. No invented dates. No long dashes. */
export function playbookHourly83(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/processing\s*since|still\s*dey\s*process|e\s*dey\s*process|una\s*process\s*am\s*since|dem\s*dey\s*process\s*am/i.test(t)) {
      return `Processing since last week is still a wait on YOUR file.\n\n1. Open ${PORTAL} and copy the exact word. Processing is not a pay date.\n2. School charges can clear at the school while your bank stays quiet.\n3. I will not invent how many days processing lasts. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/wallet\s*(still\s*)?(empty|quiet|zero)|no\s*salary\s*(enter|drop|show)|salary\s*never\s*(enter|drop)|nothing\s*show\s*for\s*(my\s*)?(bank|wallet|acct)|bank\s*(app|alert)\s*(quiet|empty|nothing)/i.test(t)) {
      return `Empty wallet or no salary alert is not a new apply.\n\n1. School charges go to the institution, not your wallet app.\n2. Upkeep only if you ticked it in that same session, and only into the bank on your profile.\n3. Copy the portal word at ${PORTAL}. I will not invent a credit date. Long same-word wait: ${ESUPPORT}.`
    }
    if (/file\s*(still\s*)?(dey|is)\s*(the\s*)?same|status\s*page\s*(no|not|never)\s*(change|move)|loan\s*page\s*(still\s*)?(pending|same)|my\s*own\s*(never|no)\s*(show|appear|reflect)/i.test(t)) {
      return `File dey the same is still a portal check.\n\n1. Sign in at ${PORTAL} and copy submitted, processing, under review, or approved.\n2. Same word for weeks is common while the school record or a batch moves.\n3. Do not open a second account to force a change. Then campus desk, then ${ESUPPORT}.`
    }
    if (/check\s*(my\s*)?dashboard|look\s*(my\s*)?dashboard/i.test(t)) {
      return `I cannot open your dashboard from this chat.\n\n1. You open ${PORTAL} and read the status line yourself.\n2. Total loans 0 or blank usually means record or login, not a secret batch list.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}. I will not invent a pay date.`
    }
  }

  if (intent === 'official-sources') {
    if (/i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*person\s*go\s*ask|just\s*dey\s*here|i\s*just\s*enter|show\s*options|give\s*options|list\s*wetin\s*you\s*fit\s*do|menu\s*abeg|point\s*me\s*small|i\s*no\s*get\s*question\s*yet/i.test(t)) {
      return `No wahala. Pick one thing.\n\n1. How to apply: ${PORTAL}\n2. How far / money never enter: copy the exact status word on ${PORTAL}\n3. Email already used: sign in, do not create another account\n4. School no dey list: campus NELFUND desk first\n\nI will not invent a deadline.`
    }
  }

  return null
}
