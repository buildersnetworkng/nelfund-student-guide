function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-182 journeys. Max two. */
export function suggestHourly182(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/forgot\s*(my\s*)?(login\s*)?email|which\s*email\s*(i\s*)?(use|used)/i.test(t)) {
    return two('How do I reset my password?', 'How do I contact official support?')
  }
  if (/reset\s*(my\s*)?password|forgot\s*(my\s*)?password|change\s*(my\s*)?password/i.test(t)) {
    return two('How do I log in?', 'Email already used — what do I do?')
  }
  if (/what\s*(is|be)\s*(the\s*)?gsi|gsi\s*mandate|wetin\s*(be|mean)\s*gsi/i.test(t)) {
    return two('When do I repay?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/after\s*nysc|when\s*(do|go)\s*i\s*repay|how\s*(i\s*)?(go|to)\s*pay\s*(back|am)/i.test(t)) {
    return two('What is GSI mandate?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/school\s*fees?\s*(don|has)|upkeep\s*(never|no|not)\s*(enter|show)|fees?\s*don\s*enter/i.test(t)) {
    return two('What is the difference between fees and upkeep?', 'How do I check my application status?')
  }
  if (/change\s*(my\s*)?(bank|account)|wrong\s*account|update\s*(my\s*)?bvn/i.test(t)) {
    return two('What documents do I need?', 'How do I contact official support?')
  }
  if (/how\s*to\s*apply\s*then\s*i\s*meant|loan\s+and\s+upkeep|meant\s*(for\s*)?(the\s*)?(loan|upkeep)/i.test(t)) {
    return two('What are institutional charges?', 'What is upkeep?')
  }
  return null
}
