function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-174 journeys. Max two. */
export function suggestHourly174(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/gsi\s*(mandate|consent)|accept\s*(the\s*)?(terms|gsi)|what\s*(is|be)\s*gsi/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  if (/for\s+(my\s+)?(child|son|daughter|ward)|parent\s+(apply|application)/i.test(t)) {
    return two('How do I apply for NELFUND?', 'What documents do I need?')
  }
  if (/change\s*(my\s*)?email|new\s*email/i.test(t)) {
    return two('Email already in use — what do I do?', 'How do I log in?')
  }
  if (/vocational|college\s*of\s*education|\bcoe\b|nce\s*student|monotechnic/i.test(t)) {
    return two('Is my school on the NELFUND list?', 'Who is eligible?')
  }
  if (/hostel|accommodation|feeding|upkeep\s*(cover|include)/i.test(t)) {
    return two('What is upkeep?', 'What is institutional charges?')
  }
  if (/forget\s*(my\s*)?password|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|i\s*no\s*remember\s*(my\s*)?password/i.test(t)) {
    return two('How do I log in?', 'Email already in use — what do I do?')
  }
  if (/how\s*much.{0,20}(repay|pay\s*back)|percentage.{0,16}(salary|repay)/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  return null
}
