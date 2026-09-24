/**
 * Suggested next questions after each reply.
 * Hard cap: two chips so a student can walk the whole path by tapping.
 */
import type { IntentId } from './types'

const DEFAULT = ['Who can apply (eligibility)?', 'How do I apply step by step?']

function two(a: string, b: string): string[] {
  return [a, b]
}

export function suggestedNextQuestions(intent: IntentId | string | null | undefined): string[] {
  switch (intent) {
    case 'what-is-nelfund':
    case 'nelfund-purpose':
    case 'nelfund-history':
      return two('Who can apply (eligibility)?', 'How do I apply step by step?')
    case 'eligibility':
      return two('How do I apply step by step?', 'What documents do I need?')
    case 'how-to-apply':
      return two('How do I log in?', 'What is upkeep vs school fees?')
    case 'portal-login':
      return two('I forgot my password', 'Old email from last year — what do I do?')
    case 'password-reset':
      return two('How do I log in?', 'Email already used — what do I do?')
    case 'email-already-used':
      return two('I forgot my password', 'How do I contact official support?')
    case 'upkeep':
    case 'upkeep-allowance':
      return two('What is institutional charges?', 'How do I apply for upkeep?')
    case 'institutional-charges':
    case 'upkeep-vs-fees':
    case 'school-fees':
      return two('What is upkeep?', 'How do I apply?')
    case 'missing-information':
    case 'school-not-found':
    case 'institution-verification':
      return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
    case 'pending-application':
      return two('When will money enter my account?', 'How do I contact official support?')
    case 'repayment':
    case 'gsi':
      return two('Is NELFUND a loan or a scholarship?', 'How do I check status on the portal?')
    case 'loan-or-scholarship':
      return two('When does repayment start?', 'Is the loan interest-free?')
    case 'scam-safety':
      return two('How do I apply only on the official portal?', 'How do I contact official support?')
    case 'jamb-verification':
      return two('Portal shows missing information', 'How do I log in?')
    case 'contact-support':
    case 'contact-lookup':
      return two('How do I apply step by step?', 'Portal shows missing information')
    case 'current-information':
    case 'deadline':
    case 'academic-session':
      return two('How do I apply step by step?', 'Who can apply (eligibility)?')
    case 'documents-needed':
      return two('How do I apply step by step?', 'How do I log in?')
    default:
      return DEFAULT
  }
}

/** Alias used by some UI paths. */
export function suggest(intent: IntentId | string | null | undefined): string[] {
  return suggestedNextQuestions(intent).slice(0, 2)
}
