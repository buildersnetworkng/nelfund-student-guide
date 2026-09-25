function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-178 journeys. Max two. */
export function suggestHourly178(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/interest|percent(age)?\s*(interest|loan)/i.test(t)) {
    return two('When does repayment start?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/jamb/i.test(t)) {
    return two('What documents do I need?', 'My school has not uploaded my data')
  }
  if (/\bpending\b|when\s*(go|will)\s*(dem|they)\s*(approve|pay)/i.test(t)) {
    return two('How do I check my application status?', 'What does disbursement mean?')
  }
  if (/whatsapp|telegram|scam|fraud|otp\s*(for|to)\s*agent|pay\s*(5k|10k)/i.test(t)) {
    return two('How do I contact official support?', 'How do I log in?')
  }
  if (/contact|esupport|customer\s*care|helpline|official\s*(email|phone)/i.test(t)) {
    return two('How do I log in?', 'Is the application still open?')
  }
  if (/missing\s*information|school\s*(never|no|not)\s*upload/i.test(t)) {
    return two('How do I apply step by step?', 'My school is not on the list')
  }
  if (/fees?\s*(vs|versus|or|and)\s*upkeep|upkeep\s*(vs|versus|or|and)\s*(fees?|charges)|difference.{0,16}(upkeep|fee|charge)/i.test(t)) {
    return two('What is upkeep?', 'How do I apply for the loan and upkeep?')
  }
  return null
}
