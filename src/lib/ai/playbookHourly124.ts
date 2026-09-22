import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly124(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /help\s*me\s*na|guide\s*me\s*joor|kindly\s*assist|i\s*need\s*assistance|i\s*no\s*sabi\s*anything|help\s*a\s*student|talk\s*to\s*me|make\s*una\s*help|how\s*(this|dis)\s*chat\s*work|what\s*can\s*you\s*do|assist\s*abeg|i\s*come\s*for\s*help|una\s*dey|wetin\s*i\s*suppose\s*do\s*first|short\s*menu|wetin\s*dey\s*for\s*here|what\s*do\s*i\s*ask|how\s*do\s*i\s*use\s*this/i.test(
        t,
      )
    ) {
      return `I can only guide from official NELFUND pages. Pick one:\n\n- how to apply or create account\n- pending / how far / money never enter\n- JAMB, email already used, or school not on the list\n- upkeep or repayment\n\nOfficial: ${SITE} and ${PORTAL}. I will not invent dates or live status.`
    }
  }

  if (intent === 'pending-application') {
    if (/my\s*(own|loan|file)\s*(still|stil)\s*(pending|stand)|dem\s*never\s*pay\s*me|i\s*still\s*dey\s*wait|nothing\s*don\s*show|status\s*(still|stil)\s*(same|pending)|how\s*far\s*my\s*(money|loan)/i.test(t)) {
      return `I cannot see your file here, so I will not guess a pay date.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. No SMS does not mean declined.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*(has\s*been|is)\s*(used|taken)|mail\s*already|last\s*year|last\s*session|cannot\s*sign\s*up|old\s*email|forgot\s*(the\s*)?(login|password)/i.test(t)) {
      return `If that email was used before, log in. Do not open a new account.\n\n1. Sign in at ${SITE}.\n2. Reset password on the same email if you forgot it.\n3. Still blocked: ${ESUPPORT}.`
    }
  }

  return null
}
