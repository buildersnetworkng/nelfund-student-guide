import type { IntentId } from './types'
import { playbookHourly83 } from './playbookHourly83'
import { playbookHourly86 } from './playbookHourly86'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-82 wording. Chains hour-86 then hour-83. No invented dates. No long dashes. */
export function playbookHourly82(intent: IntentId, userText?: string): string | null {
  const extra86 = playbookHourly86(intent, userText)
  if (extra86) return extra86
  const chained = playbookHourly83(intent, userText)
  if (chained) return chained
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /^(abeg|pls|please|kindly)?\s*(help|assist|guide|orientate)\s*(me)?|una\s*fit\s*help|i\s*(just\s*)?(need|wan|want)\s*(ya|your)?\s*help|i\s*dey\s*(lost|confused)|i\s*no\s*sabi|make\s*una\s*guide|how\s*e\s*take\s*be|give\s*me\s*(brief|short)\s*(guide|menu)|how\s*i\s*(go|fit)\s*(take\s*)?start|una\s*fit\s*show\s*me|i\s*need\s*assistance|can\s*you\s*help\s*me|kindly\s*assist|orientate\s*me|brief\s*me|show\s*me\s*wetin\s*una|wetin\s*una\s*fit\s*help|i\s*just\s*wan\s*ask|any\s*help\s*on|guide\s*me\s*small|abeg\s*yarn\s*me/i.test(
        t,
      )
    ) {
      return `How far. I can help with NELFUND, not live dashboard status.\n\nPick one:\n1. How to apply: ${PORTAL}\n2. Login or last-year email: ${SITE}\n3. Pending or money never enter: copy the exact status word on ${PORTAL}\n4. Official FAQ: ${FAQ}\n\nI will not invent a deadline or a pay date.`
    }
  }

  if (intent === 'pending-application') {
    if (/how\s*far\s*(with\s*)?(my\s*)?(loan|application|file|own)|acct\s*(still\s*)?(empty|quiet)|account\s*still\s*(empty|quiet|zero)|still\s*no\s*(alert|credit|money)/i.test(t)) {
      return `How far on your file is a portal check, not a new apply.\n\n1. Sign in at ${PORTAL} and copy submitted, processing, or approved.\n2. School charges can land at the school while your bank stays quiet.\n3. I will not invent a credit date. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  return null
}
