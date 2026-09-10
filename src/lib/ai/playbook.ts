/**
 * NELFUND AI playbook — adaptive replies that match what the student asked.
 * Clear distinctions: sign-up vs login vs loan application; school fees vs upkeep.
 */

import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string
  userText?: string
  priorIntent?: IntentId | null
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string {
  const PORTAL_L = PORTAL
  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp or Telegram “portal” links.\n\nIf you pasted a long error, say whether it is login, pending, JAMB, or missing school.`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    const t = (ctx.userText || '').trim()
    if (!t) {
      return `Send a short line about what you need.\n\nUseful starters: sign up, login, how to apply, pending status, missing information, upkeep vs school fees.\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    if (t.length < 48 || /help|abeg|stuck|wahala|what\s*next|empty|wetin|una\s*fit|reply|are\s*you\s*there/i.test(t)) {
      return `Pick one:\n• Sign **up** (new account)\n• Sign **in** / login (existing account)\n• Loan application (fees / upkeep)\n• Missing information / pending\n• Upkeep vs school fees\n• Official links / support ticket\n\nPidgin or English is fine. One short sentence is enough. Portal: ${PORTAL}`
    }
    return `Live notices only from ${SITE} and ${PORTAL}. I will not invent a deadline or approval date.\n\nWhat are you trying to do — sign up, login, submit a loan, or check pending status?`
  }
  if (intent === 'unknown' || !intent) {
    return `Tell me in one line — for example “I want to sign up”, “I cannot login”, “how to apply for the loan”, “upkeep vs school fees”, or paste the portal error.\n\nPortal: ${PORTAL}`
  }
  return `Check live status on ${PORTAL_L}. Reply with the exact portal message or whether you mean **sign up**, **login**, **loan application**, **school fees**, or **upkeep**.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|sign\s*up|portal|jamb|nin|scam|open|status|abeg|wahala|help|stuck|ticket|esupport|school|pending|password|error|fees/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (intent === 'pending-application') return `Next: open ${PORTAL} and tell me the exact status word (Pending, Under review, Approved).`
  if (intent === 'missing-information' || intent === 'school-not-found') return 'Which school do you attend? (e.g. UNILAG, LASU, OOU, YABATECH) — that lets me narrow the next step.'
  if (intent === 'how-to-apply') return 'Are you stuck on **sign up**, **profile**, or **submit loan**? Those are different steps.'
  if (intent === 'portal-login') return 'Still on login — wrong password, session expired, or blank page?'
  return 'What next — sign up, login, loan application, school fees, or upkeep?'
}
