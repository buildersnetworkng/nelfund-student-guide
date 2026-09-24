import type { IntentId, EvidenceItem, IntentResult } from './types'

const OFFICIAL_SITE = 'https://nelf.gov.ng/'
const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'
const OFFICIAL_LOGIN = 'https://portal.nelf.gov.ng/auth/login'

function dedupeActions(actions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of actions) {
    const k = a.trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(a.trim())
  }
  return out
}

export function diagnosticAssemble(intent: IntentId, evidence: EvidenceItem[], intentMeta: IntentResult) {
  const clarifyingQuestions: string[] = []
  let answer = ''
  let whatThisMeans: string | null = null
  const tips: string[] = []
  const steps: string[] = []
  let stillStuck: string | null = null
  const avoid: string[] = []

  // Keep answers grounded; nextActions always [] so UI never shows What to do next
  if (intent === 'portal-login') {
    answer =
      '**Log in / sign in**\n\n' +
      `Open the official login page: ${OFFICIAL_LOGIN}\n\n` +
      'Enter your NELFUND account email and password.\n' +
      `New account? Sign up at ${OFFICIAL_PORTAL}`
    clarifyingQuestions.push('I forgot my password', 'Email already used on the portal')
  } else if (intent === 'password-reset') {
    answer =
      '**Forgot password**\n\n' +
      `1. Open ${OFFICIAL_LOGIN}\n` +
      '2. Tap **Forgot password** on that page.\n' +
      '3. Enter the email for your account and check inbox/spam.\n' +
      `4. No email: open a support ticket at https://nelfund.esupport.ng/create`
  } else if (intent === 'email-already-used') {
    answer =
      '**Email already used**\n\n' +
      `1. Log in at ${OFFICIAL_LOGIN} with that same email.\n` +
      '2. If you forgot the password, use **Forgot password** on the login page.\n' +
      `3. Still stuck: https://nelfund.esupport.ng/create with a screenshot`
  } else {
    answer =
      intentMeta?.summary ||
      `Confirm on ${OFFICIAL_SITE} and ${OFFICIAL_PORTAL}. For case-specific issues, open a support ticket at https://nelfund.esupport.ng/create`
  }

  void evidence
  void tips
  void steps
  void stillStuck
  void avoid
  void dedupeActions

  return {
    answer: answer.trim(),
    whatThisMeans,
    nextActions: [] as string[],
    clarifyingQuestions: clarifyingQuestions.slice(0, 2),
  }
}
