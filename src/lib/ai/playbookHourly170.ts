import { playbookHourly171 } from './playbookHourly171'
import { playbookHourly172 } from './playbookHourly172'
import { playbookHourly174 } from './playbookHourly174'
import { playbookHourly175 } from './playbookHourly175'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 170: email already used, apply for loan+upkeep, login Pidgin, name mismatch. */
export function playbookHourly170(intent: string, userText: string): string | null {
  const h175 = playbookHourly175(intent, userText)
  if (h175) return h175
  const h174 = playbookHourly174(intent, userText)
  if (h174) return h174
  const chained172 = playbookHourly172(intent, userText)
  if (chained172) return chained172
  const chained = playbookHourly171(intent, userText)
  if (chained) return chained
  const t = userText || ''

  if (
    /email\s*(already|has\s*already|is\s*already)\s*(in\s*use|used|taken|exist)|this\s*email\s*(is\s*)?(already|don)\s*(used|dey)|mail\s*don\s*dey|account\s*(already\s*)?exist/i.test(
      t,
    ) ||
    intent === 'email-already-used'
  ) {
    return (
      '**Email already used**\n\n' +
      'That message means an account may already exist for that address.\n\n' +
      `1. Sign in at ${LOGIN} with the same email.\n` +
      '2. If you forgot the password, use **Forgot / Reset password** for that same email.\n' +
      '3. Do not open a second email just to force a new form.\n' +
      `4. Still blocked: ${ESUPPORT} with a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /how\s*(to|do\s*i|i\s*go|i\s*take)\s*apply.{0,40}(loan|upkeep)|apply.{0,20}(for\s+)?(the\s+)?loan\s+(and|&)\s+upkeep|i\s*meant.{0,20}(loan|upkeep)|loan\s+and\s+upkeep/i.test(
      t,
    )
  ) {
    return (
      '**Apply for the loan and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in at ${LOGIN}.\n` +
      '2. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. Request the student loan when the official window is open.\n' +
      '4. In the same session tick **institutional charges** (school fees → paid to the school) and **upkeep** (optional living support → paid to you) if you want both.\n' +
      '5. Submit and track status on the same portal.\n' +
      `I will not invent amounts. Official site: ${SITE}. Tickets: ${ESUPPORT}.`
    )
  }

  if (
    /how\s*(do\s*i|to|i\s*go|i\s*take)\s*(log\s*in|login)|abeg\s*(help\s*)?(me\s*)?(log\s*in|login)|i\s*no\s*fit\s*(log\s*in|login)|sign\s*in/i.test(
      t,
    ) ||
    intent === 'portal-login'
  ) {
    return (
      '**How to log in**\n\n' +
      `1. Open ${LOGIN} only — not a copycat site.\n` +
      '2. Enter the email and password you used to register.\n' +
      '3. Read the exact error if it fails (wrong password vs email already used vs verify email).\n' +
      `4. New account: ${PORTAL}.\n` +
      `5. Forgot password or still stuck: reset on the same page, then ${ESUPPORT}.`
    )
  }

  if (/name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch|different\s*name/i.test(t)) {
    return (
      '**Name mismatch**\n\n' +
      'JAMB, NIN, BVN and bank name should match the same person.\n\n' +
      '1. Compare the exact spelling on each document.\n' +
      `2. Update only what the portal allows at ${LOGIN}.\n` +
      '3. If JAMB / NIN is the mismatch, fix it at those official services first.\n' +
      `4. Still blocked: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I cannot change JAMB or NIMC records from this chat.'
    )
  }

  return null
}
