import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly120(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'what-is-nelfund') {
    if (/why|create|purpose|wetin\s*be|explain|origin|how\s*come/i.test(t)) {
      return `NELFUND is the Federal Government student loan scheme. It exists so eligible students in public tertiary schools can get help with tuition and, when the window is open, upkeep.\n\nThat is the purpose. It is not a grant. Check rules on ${SITE}. Portal: ${PORTAL}`
    }
  }

  if (intent === 'pending-application') {
    if (/money\s*(never|no)|alert|enter|drop|pay/i.test(t)) {
      return `No alert does not mean they declined you. I cannot see your account from here.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school first.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/how\s*far\s*my\s*own|status\s*no\s*dey\s*change|still\s*(pending|processing)/i.test(t)) {
      return `Your file is still with the process. I cannot move it from this chat.\n\n1. Check the exact word on ${PORTAL}.\n2. Ask the campus desk if the school side is complete.\n3. Then ${ESUPPORT} if nothing changes for weeks.`
    }
  }

  if (intent === 'jamb-verification') {
    if (/invalid|not\s*valid|no\s*valid/i.test(t)) {
      return `Invalid JAMB almost always means a typing mismatch, not that you have no admission.\n\n1. Copy the registration number with no extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Still failing: campus desk, then ${ESUPPORT}. Do not open a second account.`
    }
    if (/verification\s*fail|no\s*gree|reject/i.test(t)) {
      return `Verification failed on JAMB means the portal cannot match that number to your profile.\n\nFix the number and names on ${PORTAL}. If the school letter uses a different number, take both to the campus NELFUND desk.`
    }
  }

  if (intent === 'portal-login') {
    if (/last\s*year|already|registered|don\s*(dey|use)|cannot\s*create/i.test(t)) {
      return `That email is already on the system. Log in. Do not start a fresh signup.\n\n1. Sign in at ${SITE}\n2. Forgot password: reset on that same email.\n3. Still blocked: ${ESUPPORT}.`
    }
  }

  if (intent === 'school-not-found') {
    if (/no\s*dey\s*list|not\s*showing|dropdown|missing/i.test(t)) {
      return `If the school name is not in the list, the institution record is usually not loaded yet.\n\n1. Confirm it is a public institution for this cycle.\n2. Ask the campus NELFUND desk to upload students.\n3. Search again on ${PORTAL}. Still missing: ${ESUPPORT}.`
    }
  }

  if (intent === 'documents-needed') {
    return `Typical portal asks: NIN, BVN, JAMB number, admission letter, passport photo, and a bank account in your name. Do not invent extra papers.\n\nUpload only what ${PORTAL} shows. If a field is locked, the school record is not ready.`
  }

  if (intent === 'missing-information') {
    return `Missing information usually means the school has not pushed your name yet.\n\n1. Take your admission details to the campus NELFUND desk.\n2. Wait for them to confirm the upload.\n3. Retry ${PORTAL}. Still empty: ${ESUPPORT}.`
  }

  if (intent === 'official-sources' && /help|ask|anybody|yarn|what\s*can\s*you/i.test(t)) {
    return `I can help with NELFUND only.\n\nSay which one: what NELFUND is, whether the window is open, how to apply, pending file, JAMB error, email already used, or school not on the list.\n\n${PORTAL}`
  }

  return null
}
