import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly121(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/when\s*(una|dem|they)\s*go\s*pay|no\s*credit\s*alert|upkeep\s*never|school\s*fee\s*never|dem\s*never\s*disburse|i\s*never\s*collect/i.test(t)) {
      return `No credit yet does not mean the file is dead. I will not invent a pay date.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school, not your phone first.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/e\s*never\s*(move|change)|file\s*still\s*dey|processing\s*for|i\s*check\s*(am|it)\s*(everyday|every\s*day)|application\s*dey\s*sleep|e\s*no\s*dey\s*move/i.test(t)) {
      return `If the word on the portal has not changed, waiting is normal until school and NELFUND both finish their side.\n\nCheck ${PORTAL} once, write down the exact word, then ask the campus desk if your record is uploaded. I cannot push the file from this chat.`
    }
    if (/how\s*far|dashboard\s*still\s*(zero|0)|nothing\s*for\s*my\s*account|status\s*write\s*pending/i.test(t)) {
      return `How far on your own file: I cannot see the account from here.\n\nOpen ${PORTAL}, copy the status, and keep that one account. No SMS is not a decline.`
    }
  }

  if (intent === 'school-not-found') {
    if (/dropdown|cannot\s*find|no\s*dey\s*list|not\s*showing|missing/i.test(t)) {
      return `The school name missing from the list usually means the institution has not finished loading students for this cycle.\n\nConfirm it is a public school, ask the campus NELFUND desk to upload your record, then search again on ${PORTAL}. Still missing: ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/last\s*year|already|cannot\s*create|email/i.test(t)) {
      return `If that email worked last year, sign in. Do not create another account.\n\n${SITE} for login. Reset the password on the same email if you forgot it. Still blocked: ${ESUPPORT}.`
    }
  }

  if (intent === 'what-is-nelfund') {
    if (/wetin\s*be|na\s*wetin|explain\s*this|purpose/i.test(t)) {
      return `NELFUND na Federal Government student loan for public tertiary students. School charges go to the school. Upkeep, when the window is confirmed open, go to you. E no be scholarship.\n\n${SITE}`
    }
  }

  return null
}
