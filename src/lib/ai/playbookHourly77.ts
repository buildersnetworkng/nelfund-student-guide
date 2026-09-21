import type { IntentId } from './types'
import { playbookHourly78 } from './playbookHourly78'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-77 wording. Pending angles differ by phrase. No invented dates. No long dashes. */
export function playbookHourly77(intent: IntentId, userText?: string): string | null {
  const chained = playbookHourly78(intent, userText)
  if (chained) return chained
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/approved\s*but\s*(no|never)\s*(money|pay|alert)|school\s*don\s*(collect|receive)/i.test(t)) {
      return `Approved or school-paid is not the same as cash in your bank.\n\nInstitutional charges go to the school first. Your own alert only comes if you ticked upkeep in that same session.\n\n1. Copy the exact sentence on ${PORTAL}. I cannot see the file from this chat.\n\n2. I will not invent a pay day.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/no\s*(credit\s*)?alert|bank\s*never|nothing\s*don\s*(drop|enter)|dashboard\s*(still\s*)?(na\s*)?(0|zero)/i.test(t)) {
      return `No alert and a quiet dashboard do not mean the file died.\n\n1. Sign in at ${PORTAL} and copy submitted / processing / approved exactly.\n2. School money can move with no SMS to you.\n3. Do not open a second account to force a credit. Long wait: campus desk, then ${ESUPPORT}.`
    }
    if (/wetin\s*dey\s*happen|wetin\s*happen\s*to|file\s*dey\s*sleep|loan\s*dey\s*sleep|dem\s*forget|lost\s*for\s*system|application\s*hang|e\s*hang/i.test(t)) {
      return `I cannot see whether the file slept. Only ${PORTAL} has the live word.\n\n1. Copy that word exactly. Do not invent a new status.\n2. Keep the same login.\n3. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}. I will not invent a batch date.`
    }
    if (/e\s*still\s*dey\s*(review|process|pending)|still\s*on\s*(pending|processing|review)|processing\s*since|status\s*no\s*change|e\s*remain\s*pending/i.test(t)) {
      return `Still on pending or review is a wait, not a new apply.\n\n1. Open ${PORTAL} and keep the same account.\n2. School fees and upkeep can move on different days.\n3. I will not invent how many days review takes. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources' && /confused|too\s*(plenty|much)|no\s*sabi\s*where|guide\s*me|yarn|update\s*for\s*nelfund/i.test(t)) {
    return `Pick one so I answer that angle only:\n1. How to apply / create account\n2. Pending file or money never enter\n3. JAMB, school list, or email already used\n4. Repayment later\n\nOfficial pages: ${SITE} and ${PORTAL}. I will not invent a live deadline.`
  }

  return null
}
