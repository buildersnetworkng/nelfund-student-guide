/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string | null
  userText?: string | null
  priorIntent?: IntentId | null
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const userText = (ctx.userText || '').trim()

  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return (
      '**NELFUND** is the **Nigeria Education Loan Fund** — a government interest-free student loan for eligible students in **public** tertiary institutions.\n\n' +
      '- Institutional charges go to the **school**.\n' +
      '- Upkeep (optional) goes to **you**.\n' +
      `- Official: ${SITE} · ${PORTAL}`
    )
  }

  if (intent === 'eligibility') {
    return (
      '**Eligibility**\n\n' +
      '• Nigerian citizen\n' +
      '• Full-time admission into a **public** university, polytechnic, college of education, or vocational school\n' +
      '• Year of study alone does not block you\n\n' +
      `Confirm on ${PORTAL}.`
    )
  }

  if (intent === 'how-to-apply') {
    return (
      '**How to apply**\n\n' +
      `1. Open ${PORTAL}\n` +
      '2. Create an account or sign in if you already have one.\n' +
      '3. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '4. Request the loan only when the official window is open — check the portal, not social media.\n' +
      `5. Stuck: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (intent === 'portal-login') {
    return `**How to log in to NELFUND**\n\n1. Open ${PORTAL} (or ${SITE}) and **Sign in** with your account email and password.\n2. Read the exact error on the screen if login fails.\n3. First time only: create account at ${PORTAL}.\n4. Portal hangs: refresh once, try another network, then ${ESUPPORT}.\n\nFor **forgot password** or **email already used**, ask those as separate questions — they are different fixes.`
  }

  if (intent === 'password-reset' || /forgot\s*(my\s*)?password|reset\s*(my\s*)?password/i.test(userText)) {
    return (
      '**Forgot password**\n\n' +
      `1. Open ${PORTAL} → Forgot / Reset password.\n` +
      '2. Use the email linked to your account.\n' +
      '3. Check inbox and spam for the reset link or code.\n' +
      '4. Set a new password and sign in.\n' +
      `5. No email: ${ESUPPORT}. Do not create a second account unless support tells you to.`
    )
  }

  if (intent === 'email-already-used' || /email\s+(already\s+)?(used|registered)/i.test(userText)) {
    return (
      '**Email already used / already registered**\n\n' +
      '1. Sign in with **that** email (do not invent a new account).\n' +
      `2. If you forgot the password: reset for that same email on ${PORTAL}.\n` +
      `3. Still stuck: ${ESUPPORT} with a screenshot.\n\n` +
      '“I used this email before” is not a special rule — it only means an account may already exist.'
    )
  }

  if (intent === 'upkeep') {
    return (
      '**Upkeep** is optional living support under NELFUND.\n\n' +
      '- Paid to **you** if you tick it when applying.\n' +
      '- Institutional charges still go to the **school**.\n' +
      `- Confirm amounts only on ${PORTAL}.`
    )
  }

  if (intent === 'institutional-charges' || intent === 'upkeep-vs-fees') {
    return (
      '**School fees vs upkeep**\n\n' +
      '1. Institutional charges go to the **school**.\n' +
      '2. Upkeep (optional) goes to **you**.\n' +
      `3. Confirm figures only on ${PORTAL}.`
    )
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    return (
      '**Missing information / school not on the list**\n\n' +
      'Usually the school has not finished uploading your record.\n\n' +
      '1. Confirm you attend a public institution.\n' +
      '2. Ask the campus NELFUND desk about the upload.\n' +
      `3. Retry ${PORTAL}. Still failing: ${ESUPPORT}.`
    )
  }

  if (intent === 'repayment') {
    return (
      '**Repayment** follows official NELFUND rules after the applicable study/NYSC period.\n\n' +
      `Confirm on ${SITE} and ${PORTAL}. I will not invent start dates or percentages.`
    )
  }

  if (intent === 'scam-safety') {
    return (
      '**NELFUND is a real government scheme.**\n\n' +
      '- Never pay an agent.\n' +
      '- Never share OTP, password, NIN, or BVN codes with strangers.\n' +
      `- Official only: ${PORTAL} · ${SITE} · ${ESUPPORT}`
    )
  }

  if (intent === 'contact-support' || intent === 'official-sources') {
    return `**Official support**\n\n- Portal: ${PORTAL}\n- Website: ${SITE}\n- Tickets: ${ESUPPORT}\n\nI will not invent WhatsApp agents or private numbers.`
  }

  return null
}

export function nextStepAdvance(ctx: PlaybookContext, priorIntent: IntentId): string {
  const base = playbookAnswer(priorIntent, ctx)
  if (base && base.length > 40) return base
  return `Open ${PORTAL}, note the exact status or error, then ask me with that wording. Official tickets: ${ESUPPORT}.`
}

export function isNearDuplicate(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const x = norm(a)
  const y = norm(b)
  if (!x || !y) return false
  if (x === y) return true
  if (x.length > 40 && y.includes(x.slice(0, 40))) return true
  return false
}

export function isNewUserAsk(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t || t.length < 3) return false
  if (/^(alright|ok(ay)?|tell\s*me\s*more|elaborate|expanciate)\b/i.test(t)) return false
  return /nelfund|apply|login|eligib|upkeep|repay|portal|jamb|scam|password|email/i.test(t)
}

export function isClarificationFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase()
  return /^(i\s+meant|no\s+i\s+mean|actually|what\s+i\s+mean|for\s+the\s+)/i.test(t)
}

export function defineNelfundTerm(
  userText: string,
  _lastAssistant?: string | null,
): { intent: IntentId; text: string } | null {
  const t = userText.trim()
  if (/institutional\s*charg|what\s+do\s+(you|u)\s+mean.{0,30}charg/i.test(t)) {
    return {
      intent: 'institutional-charges',
      text:
        '**Institutional charges** means school fees paid **to the school** under NELFUND. Upkeep is separate and goes to you if requested.',
    }
  }
  if (/\bupkeep\b/i.test(t) && /what|mean|explain/i.test(t)) {
    return {
      intent: 'upkeep',
      text:
        '**Upkeep** is optional living support paid **to you** if you tick it. Institutional charges go to the school.',
    }
  }
  if (/full\s+meaning|meaning\s+of\s+nelfund|nelfund\s+stand\s+for/i.test(t)) {
    return {
      intent: 'what-is-nelfund',
      text: '**NELFUND** stands for **Nigeria Education Loan Fund** — a government student loan scheme for eligible students in public tertiary institutions.',
    }
  }
  return null
}
