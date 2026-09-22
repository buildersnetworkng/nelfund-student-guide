import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookHourly125(intent: IntentId, userText: string): string | null {
  const t = userText || ''

  if (intent === 'official-sources') {
    if (
      /abeg\s*una\s*help|i\s*just\s*land|wetin\s*i\s*fit\s*ask|show\s*(me\s*)?(options|menu)|i\s*dey\s*lost|na\s*wetin\s*you\s*dey\s*do|pls\s*orient|i\s*no\s*get\s*clue|start\s*from\s*(the\s*)?(beginning|scratch)|help\s*confused\s*student|una\s*fit\s*yarn|i\s*wan\s*start\s*but|how\s*i\s*go\s*begin|wetin\s*you\s*fit\s*do|gimme\s*options|kindly\s*show\s*topics|what\s*topics\s*you\s*cover|i\s*no\s*sabi\s*where\s*to\s*start|direct\s*me\s*abeg|i\s*dey\s*blank|pls\s*list\s*what\s*i\s*fit\s*ask|first\s*time\s*here|how\s*to\s*use\s*(una|this\s*app)/i.test(
        t,
      )
    ) {
      return `I can only guide from official NELFUND pages. Pick one:\n\n- how to apply or create account\n- pending / how far / money never enter\n- JAMB, email already used, or school not on the list\n- upkeep or repayment\n\nOfficial: ${SITE} and ${PORTAL}. I will not invent dates or live status.`
    }
  }

  if (intent === 'pending-application') {
    if (/file\s*still\s*stand|dem\s*never\s*settle|i\s*never\s*see\s*kobo|alert\s*never\s*come|dashboard\s*(still|stil)\s*(zero|0)|batch\s*(never|no)\s*reach|status\s*no\s*change/i.test(t)) {
      return `I cannot see your file here, so I will not guess a pay date.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. No SMS does not mean declined.\n3. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'portal-login') {
    if (/that\s*mail\s*don\s*exist|email\s*already\s*in\s*use|register\s*last\s*session|old\s*account\s*from\s*last\s*year|cannot\s*create\s*account\s*again|sign\s*up\s*say\s*email\s*used/i.test(t)) {
      return `If that email was used before, log in. Do not open a new account.\n\n1. Sign in at ${SITE}.\n2. Reset password on the same email if you forgot it.\n3. Still blocked: ${ESUPPORT}.`
    }
  }

  return null
}
