import type { IntentId } from './types'

/** Max 2 next-question chips per reply so students can tap through NELFUND. */
export function suggest(intent: IntentId | string | null | undefined): [string, string] {
  switch (intent) {
    case 'what-is-nelfund':
    case 'nelfund-purpose':
    case 'nelfund-history':
      return ['Who can apply for NELFUND?', 'How do I apply for the loan and upkeep?']
    case 'eligibility':
      return ['How do I apply for NELFUND?', 'My school is not showing on the list']
    case 'how-to-apply':
      return ['What documents do I need?', 'Difference between school fees and upkeep']
    case 'documents-needed':
      return ['How do I apply for NELFUND?', 'How do I log in?']
    case 'portal-login':
      return ['I forgot my password', 'Email already used, I registered last year']
    case 'password-reset':
      return ['How do I log in?', 'Email already used, I registered last year']
    case 'email-already-used':
      return ['I forgot my password', 'How do I apply again this session?']
    case 'upkeep':
    case 'upkeep-allowance':
      return ['Difference between school fees and upkeep', 'How to apply then I meant for the loan and upkeep']
    case 'institutional-charges':
    case 'upkeep-vs-fees':
    case 'school-fees':
      return ['What do you mean by upkeep?', 'How to apply then I meant for the loan and upkeep']
    case 'missing-information':
      return ['My school is not showing on the list', 'It is showing invalid JAMB number']
    case 'school-not-found':
      return ['Missing information on the portal', 'How do I contact official support?']
    case 'pending-application':
      return ['When will they disburse after approval?', 'How do I contact official support?']
    case 'jamb-verification':
      return ['NIN is not matching on the portal', 'Missing information on the portal']
    case 'nin-verification':
      return ['It is showing invalid JAMB number', 'How do I log in?']
    case 'repayment':
    case 'gsi':
      return ['Is NELFUND a loan or a scholarship?', 'Is the loan interest-free?']
    case 'loan-or-scholarship':
      return ['When do I start repayment?', 'Who can apply for NELFUND?']
    case 'scam-safety':
      return ['How do I log in on the official portal?', 'How do I contact official support?']
    case 'contact-support':
    case 'contact-lookup':
      return ['How do I stay safe from fake portals?', 'My application is pending']
    case 'current-information':
    case 'deadline':
    case 'academic-session':
      return ['How do I apply for NELFUND?', 'Who can apply for NELFUND?']
    case 'rejected-application':
      return ['How do I contact official support?', 'Can I apply again this session?']
    case 'reapplication':
      return ['Email already used, I registered last year', 'Is the application still open?']
    case 'bank-information':
      return ['What documents do I need?', 'How do I log in?']
    case 'refund':
      return ['Difference between school fees and upkeep', 'How do I contact official support?']
    case 'guarantor':
      return ['Who can apply for NELFUND?', 'How do I apply for NELFUND?']
    default:
      return ['How does this NELFUND thing work?', 'How do I apply for NELFUND?']
  }
}
