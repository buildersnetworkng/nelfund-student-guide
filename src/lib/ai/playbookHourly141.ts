import type { IntentId } from './types'
import { playbookHourly142 } from './playbookHourly142'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Short menu for residual other / greeting-vague. No invented dates. */
export function playbookHourly141(intent: IntentId, userText: string): string | null {
  const from142 = playbookHourly142(intent, userText)
  if (from142) return from142

  const q = (userText || '').trim()
  if (!q) return null

  if (
    intent === 'official-sources' &&
    /abeg|help|assist|guide|lost|confused|orientate|short\s*(menu|guide)|wetin\s*i\s*(suppose|go)\s*do|direct\s*me|how\s*(this|dis)\s*(thing|matter)/i.test(
      q,
    )
  ) {
    return `How far. I can help with NELFUND, not live account status.\n\nPick one:\n1. How to apply / create account\n2. Login, email already used, last year register\n3. School not on the list / missing information\n4. Pending / how far / money never enter\n5. JAMB verification\n6. Repayment (after study / NYSC)\n\nPortal: ${PORTAL}\nSite: ${SITE}\nTicket: ${ESUPPORT}\n\nI will not invent a deadline or a pay date.`
  }

  return null
}
