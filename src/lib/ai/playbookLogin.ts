const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Adaptive login / email-already-used answers (natural, question-matched). */
export function playbookPortalLogin(userText: string): string {
  const t = (userText || '').toLowerCase()
  if (/email\s*(already\s*)?(used|taken|exist)|used\s*email|already\s*(used|taken|registered|register)|registered\s*last\s*year|account\s*already/i.test(t)) {
    return `You are on the **create account** path, not login. The portal is telling you that email is already tied to an account (for example from last year), so it will not let you register again with the same email.\n\nWhat to do:\n1. Stop trying to **sign up** with that email.\n2. **Sign in** with the same email and password you used before: ${SITE}\n3. If you forgot the password, use **Forgot password** on the official page only. Do not create a second account.\n4. After you are in, update profile if needed, then continue the loan steps on ${PORTAL}.\n\nNever send OTP, password, BVN, or NIN to anyone on WhatsApp. If sign-in keeps failing after a reset, open a ticket: ${ESUPPORT}`
  }
  if (/forgot|reset\s*password|cannot\s*login|can't\s*login|password\s*(no|not|wrong)/i.test(t)) {
    return `Use **Forgot password** on the official sign-in page: ${SITE}.\n\nDo not open a second account with another email. That splits your history and usually makes support harder.\n\nAfter reset, sign in, then continue on ${PORTAL}. OTP stays on the official site only. Still stuck? ${ESUPPORT}`
  }
  return `Sign **in** (existing account): ${SITE}\nCreate account / first-time register: ${PORTAL}\n\nThose are different steps. If the portal says the email is already used, you already have an account, so sign in instead of registering again.\n\nForgot password, use the official reset only. Never send OTP to private numbers. Ticket: ${ESUPPORT}`
}
