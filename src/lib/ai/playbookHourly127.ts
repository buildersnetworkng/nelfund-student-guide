import type { IntentId } from './types'
import { playbookHourly128 } from './playbookHourly128'
import { playbookHourly129 } from './playbookHourly129'
import { playbookHourly130 } from './playbookHourly130'
import { playbookHourly133 } from './playbookHourly133'
import { playbookHourly134 } from './playbookHourly134'
import { playbookHourly136 } from './playbookHourly136'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly127(intent: IntentId, userText: string): string | null {
  const newer =
    playbookHourly136(intent, userText) ||
    playbookHourly134(intent, userText) ||
    playbookHourly133(intent, userText) ||
    playbookHourly130(intent, userText) ||
    playbookHourly129(intent, userText) ||
    playbookHourly128(intent, userText)
  if (newer) return newer
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /abeg\s*help\s*me|help\s*me\s*abeg|i\s*need\s*(una\s*)?help|una\s*fit\s*help\s*me|pls\s*help|i\s*no\s*sabi|how\s*una\s*take\s*dey\s*help|gimme\s*(small\s*)?guide|i\s*wan\s*ask|una\s*dey|make\s*una\s*guide|i\s*dey\s*confused|wetin\s*una\s*fit\s*assist|assist\s*me|kindly\s*assist|i\s*just\s*wan\s*yarn|talk\s*to\s*me\s*abeg|where\s*i\s*go\s*start|i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*i\s*suppose\s*ask|i\s*dey\s*lost\s*here|show\s*me\s*wetin\s*you\s*cover|list\s*topics|i\s*need\s*direction|point\s*me\s*abeg|how\s*this\s*chat\s*work|wetin\s*this\s*bot\s*dey\s*do|who\s*you\s*be\s*abeg|just\s*help\s*me\s*navigate|i\s*just\s*dey\s*find\s*(my\s*)?way|una\s*fit\s*brief\s*me|how\s*(this|dis)\s*chat\s*take\s*work|wetin\s*(you|una)\s*cover\s*(here|for\s*here)|i\s*no\s*get\s*(any\s*)?(specific|clear)\s*question|make\s*we\s*start\s*small|any\s*gist\s*(for|about)\s*students|pls\s*orientate\s*me|gimme\s*(small\s*)?(gist|brief)|hlp\s*me|abeg\s*hlp|gude\s*me|assistt\s*me|^help\?+$|^guide\s*(jo|jare|abeg)?|^info\s*(pls|abeg|please)|i\s*dey\s*here\s*abeg|wetin\s*una\s*sabi|make\s*una\s*yarn\s*small|who\s*fit\s*help\s*me\s*here|any\s*help\s*here|nelfund\s*help/i.test(
        t,
      )
    ) {
      return `I can only guide from official NELFUND pages. Pick one:\n\n- how to apply or create account\n- pending / how far / money never enter\n- JAMB, email already used, or school not on the list\n- upkeep or repayment\n\nOfficial: ${SITE} and ${PORTAL}. I will not invent dates or live status.`
    }
  }

  if (intent === 'pending-application') {
    if (/money\s*never\s*show|dem\s*never\s*pay\s*me|how\s*far\s*my\s*(loan|file|matter)|i\s*don\s*wait|nothing\s*don\s*enter|my\s*own\s*never\s*drop|alert\s*no\s*dey|zero\s*for\s*dashboard|status\s*still\s*the\s*same/i.test(t)) {
      return `I cannot see your file from this chat, so I will not guess a pay date.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. No SMS does not mean declined.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/email\s*don\s*dey\s*use|mail\s*already\s*register|last\s*year|cannot\s*sign\s*up\s*again|create\s*account\s*say\s*used|old\s*nelfund\s*mail/i.test(t)) {
      return `If that email was used before, log in. Do not open a new account.\n\n1. Sign in at ${SITE}.\n2. Reset password on the same email if you forgot it.\n3. Still blocked: ${ESUPPORT}.`
    }
  }

  return null
}
