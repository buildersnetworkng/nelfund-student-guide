import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-86 wording. Vague other -> short menu. No invented dates. No long dashes. */
export function playbookHourly86(intent: IntentId, userText?: string): string | null {
  const t = (userText || '').trim()
  if (!t) return null

  if (intent === 'official-sources') {
    if (
      /abeg\s*(help|assist|guide|yarn)|help\s*me\s*(small|abeg)|i\s*no\s*sabi|i\s*dey\s*(lost|confused)|yarn\s*me|wetin\s*i\s*(suppose|go|fit)\s*do|how\s*e\s*take|kindly\s*assist|orient|brief\s*me|show\s*me\s*(the\s*)?(way|menu)|any\s*(small\s*)?help|guide\s*me\s*small|una\s*fit\s*help|i\s*need\s*help|pls\s*help|please\s*just\s*(help|guide)|^help\b|^confused|^lost/i.test(
        t,
      )
    ) {
      return `Pick one line so I can help. I will not dump live status here.\n\n1. How to apply / create account: ${PORTAL}\n2. Last year email / login: ${SITE}\n3. Pending file or money never enter: check the exact word on ${PORTAL}\n4. FAQ: ${FAQ}\n\nI will not invent a deadline or a pay date.`
    }
  }

  if (intent === 'how-to-apply') {
    if (/how\s*(do\s*i|to)\s*(start|begin)|where\s*(do\s*i|i\s*go)\s*begin|first\s*thing|i\s*wan\s*start/i.test(t)) {
      return `Start on the official pages only.\n\n1. New account: ${PORTAL}\n2. Already registered last year: sign in at ${SITE}. Do not create another account.\n3. Confirm your school record is uploaded before you request a loan.\n4. I will not invent whether the loan window is open today. Check ${SITE} / ${PORTAL}.`
    }
  }

  return null
}
