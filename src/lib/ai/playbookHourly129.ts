import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly129(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'jamb-verification') {
    if (/verification\s*(failed|fail|error)|cannot\s*verify|unable\s*to\s*verify|jamb\s*verification\s*(no|not)/i.test(t)) {
      return `JAMB verification failed means the portal cannot match the number you typed to JAMB records.\n\n1. Type the JAMB / UTME number exactly as on your slip. No extra space.\n2. Direct Entry uses the DE number, not a random UTME guess.\n3. If JAMB CAPS and the portal still clash, your school desk must confirm the record they uploaded.\n4. Still blocked: ${ESUPPORT} with a photo of the exact error. Do not invent a new JAMB number.`
    }
    if (/jamb\s*(number|reg|details?)?\s*(is\s*)?(not|no|never|invalid|wrong)|invalid\s*jamb|jamb\s*(no|not)\s*(valid|gree)|they\s*say\s*(my\s*)?jamb|portal\s*(say|says).*jamb/i.test(t)) {
      return `Invalid JAMB is a data match problem, not a new NELFUND account.\n\n1. Recheck the digits on ${PORTAL} against your original JAMB slip.\n2. Wait a few hours after any JAMB correction before you retry.\n3. Ask the campus NELFUND desk if they uploaded a different number.\n4. Exact screenshot to ${ESUPPORT} if it still fails.`
    }
    if (/jamb\s*dey\s*reject|my\s*jamb\s*(no|not)\s*(dey\s*)?(gree|work)|utme\s*(not|no)\s*(accepted|valid)/i.test(t)) {
      return `If JAMB no gree on the portal, stop creating another email.\n\n1. Use one account on ${PORTAL}.\n2. Confirm UTME vs Direct Entry number.\n3. School must have you on the session list they sent to NELFUND.\n4. Still reject: ${ESUPPORT} with the exact line on the screen.`
    }
  }

  if (intent === 'pending-application') {
    if (/approved\s*but\s*(no|never)\s*(money|alert)|kobo\s*(never|no)|wallet\s*(still\s*)?(empty|blank)|nothing\s*show\s*for\s*(account|bank)/i.test(t)) {
      return `Approved on screen is not the same as money in the bank.\n\n1. Open ${PORTAL} and read institutional charges and upkeep as two lines.\n2. School charges go to the school first.\n3. Confirm the account number on your profile.\n4. I will not invent a credit date. Long wait with the same word: campus desk, then ${ESUPPORT}.`
    }
    if (/when\s*una\s*go\s*pay\s*me|i\s*don\s*apply\s*(since|long)|track\s*am|status\s*check\s*(abeg|pls)/i.test(t)) {
      return `I cannot see your file from this chat, so I cannot give a pay date.\n\n1. Sign in at ${PORTAL} and copy the exact status sentence.\n2. If it still says pending or processing, that is a wait, not a new apply.\n3. Mates collecting first is common across schools.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/this\s*mail\s*(don|already)|email\s*don\s*dey|last\s*year\s*email|cannot\s*register\s*with\s*(this|dis)\s*(mail|email)|sign\s*up\s*(no|not)\s*gree/i.test(t)) {
      return `That mail already belongs to a portal profile. Log in. Do not open a second one.\n\n1. Sign in at ${SITE} with the same email.\n2. Use forgot password on ${SITE} if you lost the password. Check spam for OTP.\n3. Sign up only if you never created any account: ${PORTAL}\n4. Locked out: ${ESUPPORT} with the exact error.`
    }
  }

  if (intent === 'school-not-found') {
    if (/my\s*(uni|poly|college|school)\s*(no|not)\s*(dey|show)|cannot\s*select\s*(my\s*)?(school|institution)|institution\s*drop\s*down|list\s*of\s*schools?/i.test(t)) {
      return `If your school is missing from the list, the usual fix is the school upload, not a new student account.\n\n1. Confirm it is a public institution NELFUND covers.\n2. Take your admission name to the campus NELFUND desk and ask if they uploaded this session.\n3. Retry ${PORTAL} after they confirm.\n4. Still missing: ${ESUPPORT} with the school name on your admission letter.`
    }
  }

  return null
}
