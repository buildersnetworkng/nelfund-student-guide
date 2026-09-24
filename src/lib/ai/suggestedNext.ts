/**
 * Suggested next questions after each reply (ChatGPT-style one-tap chips).
 * Grounded on current intent — not invented loan numbers.
 */
import type { IntentId } from './types'

const DEFAULT = [
  'Who can apply (eligibility)?',
  'How do I apply step by step?',
  'What is the difference between school fees and upkeep?',
  'Is NELFUND a scam?',
]

/** Up to 4 clickable follow-ups for the UI. */
export function suggestedNextQuestions(intent: IntentId | string | null | undefined): string[] {
  switch (intent) {
    case 'what-is-nelfund':
      return [
        'Who can apply (eligibility)?',
        'How do I apply step by step?',
        'What is institutional charges?',
        'What is upkeep?',
      ]
    case 'eligibility':
      return [
        'How do I apply step by step?',
        'What documents do I need?',
        'Can 100 level students apply?',
        'My school is a polytechnic — can I apply?',
      ]
    case 'how-to-apply':
      return [
        'How do I log in?',
        'What documents do I need?',
        'School not on the list / missing information',
        'What is upkeep vs school fees?',
      ]
    case 'portal-login':
      return [
        'I forgot my password',
        'Old email from last year — what do I do?',
        'Portal shows missing information',
        'How do I contact official support?',
      ]
    case 'upkeep':
      return [
        'What is institutional charges?',
        'When does money enter my account?',
        'How do I apply for upkeep?',
        'Is upkeep optional?',
      ]
    case 'institutional-charges':
      return [
        'What is upkeep?',
        'Who receives institutional charges?',
        'How do I apply?',
        'Repayment — when does it start?',
      ]
    case 'missing-information':
    case 'school-not-found':
    case 'institution-verification':
      return [
        'How do I know if my school uploaded my data?',
        'Draft email to my school about missing information',
        'How do I contact official support?',
        'How do I log in again?',
      ]
    case 'pending-application':
      return [
        'How long does approval take?',
        'When will money enter my account?',
        'How do I contact official support?',
        'Is my application still open?',
      ]
    case 'repayment':
    case 'gsi':
      return [
        'When does repayment start?',
        'Who can apply (eligibility)?',
        'How do I check status on the portal?',
        'Official NELFUND website',
      ]
    case 'scam-safety':
      return [
        'How do I apply only on the official portal?',
        'How do I contact official support?',
        'Is NELFUND real / government?',
        'What should I never share (OTP/password)?',
      ]
    case 'jamb-verification':
      return [
        'NIN / BVN issues',
        'Portal shows missing information',
        'How do I contact official support?',
        'How do I log in?',
      ]
    case 'contact-support':
    case 'contact-lookup':
      return [
        'How do I apply step by step?',
        'Portal shows missing information',
        'Is NELFUND a scam?',
        'How do I log in?',
      ]
    case 'current-information':
    case 'deadline':
      return [
        'How do I apply step by step?',
        'Who can apply (eligibility)?',
        'How do I log in?',
        'What is upkeep?',
      ]
    case 'documents-needed':
      return [
        'How do I apply step by step?',
        'Who can apply (eligibility)?',
        'NIN / BVN issues',
        'How do I log in?',
      ]
    default:
      return DEFAULT
  }
}
