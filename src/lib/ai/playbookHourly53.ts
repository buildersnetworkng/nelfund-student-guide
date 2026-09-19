const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-53 playbook extras for leftover other phrasing. */
export function playbookHourly53(intent: string, userText: string): string | null {
  const t = userText || ''
  if (intent === 'upkeep' && /how\s*much|amount|figure|wetin\s*(dem|una)\s*go\s*(pay|give)/i.test(t)) {
    return `**How much upkeep / loan is not a number I will invent.**\n\n1. The live form on ${PORTAL} is the only amount that counts for your school and session.\n2. Institutional charges go to the **school**. Upkeep (only if you ticked it in the same session) goes to your bank later.\n3. Do not use WhatsApp figures. Check ${SITE} and the portal.\n4. Waiting on money already applied: copy the exact status word on the portal, then campus desk or ${ESUPPORT}.`
  }
  if (intent === 'how-to-apply' && /apply\s*(for\s*)?(me|am)|help\s*me\s*(apply|fill)|fill\s*(the\s*)?(form|portal)\s*for\s*me/i.test(t)) {
    return `**I cannot apply or fill the form for you.** That would be unsafe.\n\n1. Create or sign in on ${SITE}, then finish on ${PORTAL} with your own NIN, BVN, and JAMB.\n2. Do not give your password or OTP to anyone, including people in this chat.\n3. Need the steps: account first (open now), loan/upkeep only when the official window is confirmed on the portal.\n4. Stuck on an error word: paste that exact sentence here.`
  }
  if (intent === 'eligibility' && /(no|never|not|without)\s*(admission|offer)|awaiting\s*(admission|result)/i.test(t)) {
    return `**Applying without admission is usually not possible on the live form.**\n\n1. The portal commonly asks for a JAMB admission letter and a school that has uploaded your record.\n2. If you are still awaiting admission, wait until the school can see you, then try ${PORTAL}.\n3. I will not invent a workaround. Confirm the live fields, do not pay anyone to skip admission.\n4. Account creation can still be open while loan/upkeep is not confirmed. Check ${SITE}.`
  }
  return null
}
