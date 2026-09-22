import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly128(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'pending-application') {
    if (/how\s*far\s*(my|dis|this)\s*(own|app|application)|wetin\s*(dey\s*)?happen\s*to\s*my/i.test(t)) {
      return `How far on your own is still your portal file. I cannot open it from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. School charges go to the school first. No SMS does not mean declined.\n3. Upkeep is a separate line if you ticked it.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/money\s*never\s*enter|alert\s*never\s*come|no\s*credit\s*alert|they\s*never\s*credit\s*me|nothing\s*(don|has)\s*(drop|enter)/i.test(t)) {
      return `Money never enter is still a wait, not a new apply.\n\n1. Check ${PORTAL} for the exact word on institutional charges and on upkeep.\n2. Those two can land on different days.\n3. Confirm the bank on your profile is yours.\n4. I will not invent a pay date. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
    if (/status\s*still\s*(processing|pending)|e\s*still\s*dey\s*process|under\s*review\s*(still|since)|status\s*no\s*change|application\s*hang\s*for\s*pending|my\s*file\s*(no|not|never)\s*(move|update)/i.test(t)) {
      return `Status still processing is not a new application.\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Ask the campus NELFUND desk if your student record is uploaded for this session.\n3. Do not open a second email to retry.\n4. Still the same word: ${ESUPPORT}.`
    }
    if (/mates?\s*(don|have)\s*(collect|receive)|batch\s*(never|no)\s*(reach|come)|una\s*never\s*pay\s*me/i.test(t)) {
      return `Your mate collecting first does not mean your file is dead.\n\n1. Open ${PORTAL} and compare the exact word on your own dashboard, not WhatsApp talk.\n2. Batches can move school by school.\n3. I will not invent a batch date.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(already|has\s*been|don)\s*(used|taken|exist)|registered\s*(last\s*year|before|already)|cannot\s*create\s*account\s*with\s*this\s*email/i.test(t)) {
      return `That email is already on the portal. Log in. Do not create a new account.\n\n1. Sign in at ${SITE} with the same email.\n2. Forgot password: use reset on ${SITE}. Check spam for OTP.\n3. Sign up only if you never created an account: ${PORTAL}\n4. Still locked out: ${ESUPPORT} with the exact error. Do not open a second email.`
    }
  }

  if (intent === 'school-not-found') {
    if (/school\s*(not|no)\s*(showing|show|dey)|my\s*school\s*no\s*dey|institution\s*(missing|not\s*showing)|cannot\s*find\s*my\s*(school|institution)/i.test(t)) {
      return `School not showing is usually a school-upload issue, not a new account.\n\n1. Confirm you attend a public institution that NELFUND covers.\n2. Ask the campus NELFUND desk if your record is uploaded for this session.\n3. Retry ${PORTAL} after they confirm.\n4. Still missing: ${ESUPPORT} with the school name as it appears on your admission letter.`
    }
  }

  return null
}
