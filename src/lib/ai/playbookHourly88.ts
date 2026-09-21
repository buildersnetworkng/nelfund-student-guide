import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-88 wording for residual other / vague help. No invented dates. */
export function playbookHourly88(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /stranded|lost|confused|blank|yarn|no\s*get\s*(idea|clue)|just\s*enter|wetin\s*dey\s*(this|dis)\s*place|attend\s*to\s*me|orientation|direction|help\s*desk|who\s*.*ask|find\s*(direction|help)|orient|guidance|who\s*go\s*help|i\s*wan\s*ask/i.test(
        t,
      )
    ) {
      return `How far. I can walk you through NELFUND, not guess your file.\n\nPick one:\n1. How to apply / start: ${PORTAL}\n2. Login if you registered before: ${SITE}\n3. Pending or money never enter: copy the exact status word on ${PORTAL}\n4. School not on the list, JAMB, or repayment: say that in one short sentence.\n\nOfficial only: ${SITE} ${PORTAL} ${ESUPPORT}`
    }
  }

  if (intent === 'portal-login') {
    if (/last\s*year|already|don\s*(register|sign)|email\s*(used|use)/i.test(t)) {
      return `If that email was used last year, sign in. Do not create a second account.\n\n1. Sign in at ${SITE}.\n2. New students only sign up on ${PORTAL}.\n3. Forgot password: reset on ${SITE}.\n4. Still locked: ${ESUPPORT}.`
    }
  }

  return null
}
