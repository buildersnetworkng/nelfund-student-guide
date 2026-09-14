const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookPortalLogin(t: string): string {
  if (/already\s*used\s*by\s*another|used\s*by\s*another\s*student|email\s*(already|don)\s*(exist|dey|register)|two\s*accounts?|second\s*account|duplicate\s*account|account\s*already\s*(exist|dey)/i.test(t)) {
    return `**Email / account already exists**\n\n1. Do **not** open a second account. Sign **in** at ${SITE} with the first email.\n2. Use **Forgot password** on that same page if you cannot remember it.\n3. If the portal says the JAMB or email is already used by another student, ticket ${ESUPPORT} with a screenshot of that exact sentence. Do not invent a workaround here.\n\nNew sign-up is only ${PORTAL} when you truly have no account.`
  }
  if (/password|forgot|reset|session\s*expired/i.test(t)) {
    return `**Login / password**\n\n1. Sign **in** at ${SITE} (not a WhatsApp link).\n2. Session expired = sign in again. Do not create another account.\n3. Forgot password: use the reset link on ${SITE}.\n4. Still blocked? Ticket ${ESUPPORT} with the exact error sentence.\n\nNew account only: ${PORTAL}`
  }
  return `**Log in / sign in**\n\nUse: ${SITE}\n\n**Sign up** (create account / apply): ${PORTAL}\n\nReport portal problems: ${ESUPPORT}\n\nAvoid random social-media links. Never share OTP or password.`
}
