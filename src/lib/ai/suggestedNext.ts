/**
 * Suggested next questions after each reply.
 * Hard cap: two chips so a student can walk the whole path by tapping.
 */
import type { IntentId } from './types'

const DEFAULT = ['Who can apply (eligibility)?', 'How do I apply step by step?']

function two(a: string, b: string): string[] {
  return [a, b]
}

function byText(userText?: string | null): string[] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/otp|one[- ]time|pin|password|scam|agent|pay\s*\d|whatsapp\s*(man|agent)/i.test(t)) {
    return two('How do I apply only on the official portal?', 'How do I contact official support?')
  }
  if (/name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch|different\s*name/i.test(t)) {
    return two('How do I fix bank / BVN details?', 'How do I contact official support?')
  }
  if (/gsi|global\s*standing|debit\s*my\s*account/i.test(t)) {
    return two('When does repayment start?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*after/i.test(t)) {
    return two('My school is not on the list', 'How do I contact official support?')
  }
  if (/vocational|skills?\s*school|monotechnic|part[\s-]*time|sandwich/i.test(t)) {
    return two('Who can apply (eligibility)?', 'What documents do I need?')
  }
  if (/passport\s*(photo|photograph)|profile\s*picture|upload\s*photo/i.test(t)) {
    return two('What documents do I need?', 'How do I apply step by step?')
  }
  if (/document|wetin\s*(i|una)\s*need|nin|bvn|admission\s*letter|wetin\s*i\s*(go|suppose)\s*carry/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  if (/school\s*(no|not|never)\s*(dey|show|list)|not\s*listed|cannot\s*find\s*(my\s*)?school/i.test(t)) {
    return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
  }
  if (/pending|how\s*far|money\s*never|never\s*enter|wetin\s*dey\s*hold/i.test(t)) {
    return two('When does official disbursement happen after approval?', 'How do I contact official support?')
  }
  if (/jamb|utme|invalid\s*number/i.test(t)) {
    return two('Portal shows missing information', 'How do I log in?')
  }
  if (/loan\s*(or|vs)\s*scholarship|na\s*(scholarship|grant)|free\s*money/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  if (/interest[- ]?free|zero\s*interest|does\s*(am|it)\s*get\s*interest/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When does repayment start?')
  }
  if (/still\s*(open|dey\s*open)|deadline|can\s*i\s*still\s*apply|dem\s*don\s*close|application\s*(open|close)/i.test(t)) {
    return two('How do I apply step by step?', 'Who can apply (eligibility)?')
  }
  if (/contact|esupport|help\s*desk|ticket|how\s*i\s*go\s*(yarn|call)/i.test(t)) {
    return two('How do I apply step by step?', 'Portal shows missing information')
  }
  if (/how\s*(do\s*i|to)\s*(log\s*in|login)|sign\s*in|forgot\s*(my\s*)?password/i.test(t)) {
    return two('I forgot my password', 'Old email from last year — what do I do?')
  }
  if (/how\s*(to|do\s*i|i\s*go|i\s*take)\s*apply|loan\s*and\s*upkeep|i\s*meant/i.test(t)) {
    return two('How do I log in?', 'What is upkeep vs school fees?')
  }
  if (/who\s*(can|fit|dey)\s*apply|eligib|200\s*l|private\s*(uni|school)/i.test(t)) {
    return two('How do I apply step by step?', 'What documents do I need?')
  }
  if (/repay|pay\s*back|after\s*nysc|guarantor/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'How do I check status on the portal?')
  }
  if (/rejected|decline|apply\s*again|re-?apply/i.test(t)) {
    return two('How do I contact official support?', 'Who can apply (eligibility)?')
  }
  if (/wrong\s*bank|change\s*account|refund|bvn/i.test(t)) {
    return two('What is upkeep?', 'How do I contact official support?')
  }
  if (/upkeep|stipend|allowance/i.test(t)) {
    return two('What is institutional charges?', 'How do I apply for loan and upkeep?')
  }
  if (/institutional\s*charg|school\s*fees|tuition/i.test(t)) {
    return two('What is upkeep?', 'How do I apply for the loan and upkeep?')
  }
  return null
}

export function suggestedNextQuestions(
  intent: IntentId | string | null | undefined,
  userText?: string | null,
): string[] {
  const fromText = byText(userText)
  if (fromText) return fromText

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
      return two('What is institutional charges?', 'How do I apply for loan and upkeep?')
    case 'institutional-charges':
    case 'upkeep-vs-fees':
    case 'school-fees':
      return two('What is upkeep?', 'How do I apply for the loan and upkeep?')
    case 'missing-information':
    case 'school-not-found':
    case 'institution-verification':
      return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
    case 'pending-application':
      return two('When does official disbursement happen after approval?', 'How do I contact official support?')
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
    case 'refund':
      return two('What is institutional charges?', 'How do I contact official support?')
    case 'bank-information':
      return two('What is upkeep?', 'How do I log in?')
    case 'rejected-application':
      return two('How do I contact official support?', 'Who can apply (eligibility)?')
    case 'reapplication':
      return two('How do I log in with last year email?', 'How do I apply step by step?')
    case 'guarantor':
      return two('Who can apply (eligibility)?', 'What documents do I need?')
    case 'nin-verification':
      return two('JAMB verification failed', 'What documents do I need?')
    default:
      return DEFAULT
  }
}

/** Alias used by UI + processTurn. Always at most two chips. */
export function suggest(
  intent: IntentId | string | null | undefined,
  userText?: string | null,
): string[] {
  return suggestedNextQuestions(intent, userText).slice(0, 2)
}
