import type { IntentId } from './types'
import { playbookHourly109 } from './playbookHourly109'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/**
 * Hour-110 replies for residual other (vague Pidgin help) plus leftover pending.
 * No invented deadlines. No long dashes.
 */
export function playbookHourly110(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /how\s*(this|dis)\s*(thing|matter)\s*(dey\s*)?work|gimme\s*(the\s*)?(short\s*)?(list|menu)|orientate\s*me|make\s*una\s*(yarn|explain)\s*(am\s*)?small|na\s*how\s*(e|this|dis)\s*take\s*be|i\s*dey\s*(lost|confused|blank)|i\s*just\s*wan(t)?\s*(una|you)\s*(to\s*)?(help|guide)/i.test(
        t,
      )
    ) {
      return `Short menu (not live status):\n\n1. What NELFUND is / how to apply: ${SITE}\n2. Sign in or old email: ${PORTAL}\n3. Ticket if the portal blocks you: ${ESUPPORT}\n\nReply with one line: apply, pending, JAMB, school list, login, or repayment.`
    }
  }

  if (intent === 'pending-application') {
    if (/track\s*(my\s*)?(application|loan)|follow\s*up|batch\s*(never|no)\s*(reach|include)|name\s*no\s*dey\s*(any\s*)?(list|batch)/i.test(t)) {
      return `I cannot track your file from this chat.\n\n1. Sign in at ${SITE} then open ${PORTAL} and copy the exact status word.\n2. School charges go to the institution. No personal alert can still be normal.\n3. I will not invent a batch list or pay date. Long same-word wait: campus desk, then ${ESUPPORT}.`
    }
  }

  return playbookHourly109(intent, userText)
}
