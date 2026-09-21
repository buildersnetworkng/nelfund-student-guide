import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-93 wording. Angle-specific pending answers. No invented dates. */
export function playbookHourly93(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'pending-application') {
    if (/money\s*never|alert\s*never|e\s*never\s*enter|account.{0,16}(no|never)/i.test(t)) {
      return `Money not in your account yet does not tell me the portal word. I cannot invent a pay date.\n\n1. Sign in at ${PORTAL} and copy the exact status (pending, processing, submitted, approved).\n2. School charges go to the school first. Upkeep is separate.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/status\s*(still|dey).{0,12}(processing|pending)|still\s*(dey\s*)?process|stuck\s*(on|for)\s*(processing|pending)|dashboard\s*still/i.test(t)) {
      return `Processing or pending on the dashboard means the file is still with NELFUND or your school. I cannot move it from this chat.\n\n1. Refresh ${PORTAL} and keep the exact word.\n2. Ask campus desk if your record is uploaded this cycle.\n3. Still the same word after they confirm: ${ESUPPORT}.`
    }
    if (/why\s*(my\s*)?(own|application)\s*(no|not|never)\s*move|my\s*(own|tin|file)\s*(no|never|not)\s*move|una\s*don\s*see\s*my/i.test(t)) {
      return `I cannot see your file from here, so I cannot say why your own has not moved.\n\n1. Open ${PORTAL} and copy the status word, not a guess.\n2. Take that word to campus NELFUND desk.\n3. If they say the record is already uploaded: ${ESUPPORT}.`
    }
    if (/school\s*fees?.{0,40}(school|campus).{0,40}(upkeep|me)|upkeep\s*(for\s*)?me/i.test(t)) {
      return `School fee and upkeep are not the same payment.\n\n1. Check ${PORTAL} for two different status lines if they show.\n2. Ask bursary / NELFUND desk whether the school charge already landed.\n3. Upkeep still blank after that: ${ESUPPORT}. Official site: ${SITE}`
    }
    if (/how\s*far\s*my\s*(own|tin)|^(how\s*far\s*my\s*own)/i.test(t)) {
      return `How far your own is only what ${PORTAL} shows.\n\n1. Sign in and read the status word.\n2. Paste that word here if you want the next step for that exact word.\n3. I will not guess a batch or a date.`
    }
  }

  if (intent === 'jamb-verification' && /jamb/i.test(t)) {
    return `Invalid JAMB is a match problem, not a loan-open question.\n\n1. Type the full number with no extra space on ${PORTAL}.\n2. It must be the same number JAMB and your admission papers use.\n3. Still fail after a correct number: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /(email|mail|register)/i.test(t)) {
    return `If that email already exists, log in. Do not create a second account.\n\n1. Sign in at ${SITE}.\n2. Forgot password: reset on ${SITE}.\n3. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found' && /school|institution|list|portal/i.test(t)) {
    return `If your school is missing on the portal list, the record cannot attach yet.\n\n1. Try another official spelling on ${PORTAL}.\n2. Ask ICT / Registry if they uploaded this cycle.\n3. Still missing after they confirm: ${ESUPPORT}.`
  }

  return null
}
