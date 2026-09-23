import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Short menu for residual other / greeting-vague. No invented dates. No long dashes. */
export function playbookHourly142(intent: IntentId, userText: string): string | null {
  const q = (userText || '').trim()
  if (!q) return null

  if (
    intent === 'official-sources' &&
    /abeg|help|asist|assist|guide|lost|confused|orientate|short\s*(menu|guide)|wetin\s*i\s*(suppose|go)\s*do|direct\s*me|how\s*(this|dis)\s*(tin|thing|matter)|menu|options|first\s*time|how\s*i\s*go\s*take\s*use|gimme|kindly/i.test(
      q,
    )
  ) {
    return `How far. I can help with NELFUND, not live account status.\n\nPick one:\n1. How to apply / create account\n2. Login, email already used, last year register\n3. School not on the list / missing information\n4. Pending / how far / money never enter\n5. JAMB verification\n6. Repayment (after study / NYSC)\n\nPortal: ${PORTAL}\nSite: ${SITE}\nTicket: ${ESUPPORT}\n\nI will not invent a deadline or a pay date.`
  }

  return null
}
