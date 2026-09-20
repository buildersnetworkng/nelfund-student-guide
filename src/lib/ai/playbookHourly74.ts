import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-74 angle-specific lines. Different wording from 73. No invented dates.
 */
export function playbookHourly74(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/approved|disburse|alert|sms|credit|money|pay\s*(the\s*)?school|upkeep/i.test(t)) {
      return `**Approved / school paid / alert never come** is still a waiting file from this chat. I cannot see your bank.\n\n1. Sign in at ${PORTAL} and copy the exact status word (submitted, processing, approved).\n2. School charges go to the school first. Your own alert can come later, or not in the same week.\n3. Group chat pay lists are not official.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}. I will not invent when money will enter.`
    }
    if (/how\s*far|never\s*move|stuck|still\s*on|status/i.test(t)) {
      return `**How far / status no dey move:** only ${PORTAL} shows your real word.\n\n1. Open the dashboard and write down submitted vs processing vs approved.\n2. Do not open a second account while you wait.\n3. Long wait with the same word: campus desk, then ${ESUPPORT}.`
    }
    return `**Pending file:** this chat cannot open your record.\n\n1. Check ${PORTAL} for the exact status.\n2. Fees and upkeep can move on different days.\n3. Still the same: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login') {
    return `**That email already exists.** Sign in at ${SITE}. Use forgot password. Do not register a new mail. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB no gree:** type the number exactly as on the admission letter. Match name and date of birth with NIN. Direct Entry still needs a real JAMB number. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no dey the list.** Search the full official name on ${PORTAL}. Ask ICT if this session is uploaded. Private schools outside the scheme will not show. Still missing: ${ESUPPORT}.`
  }

  if (intent === 'official-sources') {
    if (/direction|begin|start\s*from|wetin\s*now|what\s*next|point\s*me/i.test(t)) {
      return `Start here, then pick one problem:\n1. Account: sign in at ${SITE} or sign up at ${PORTAL}\n2. File stuck / money never enter\n3. School missing or JAMB invalid\n4. Repayment later\n\nI will not guess live loan dates.`
    }
  }

  return null
}
