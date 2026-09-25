function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-180 journeys. Max two. */
export function suggestHourly180(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/name\s*(no|not|never)\s*(match|the\s*same)|mismatch|different\s*name/i.test(t)) {
    return two('What documents do I need?', 'How do I contact official support?')
  }
  if (/no\s*(admission|offer)\s*letter|admission\s*letter\s*(lost|missing|required)/i.test(t)) {
    return two('What documents do I need?', 'How do I apply step by step?')
  }
  if (/who\s*(go|will|does)\s*(dem\s*)?(pay|collect)|money\s*(go|enter)\s*(school|my\s*account)/i.test(t)) {
    return two('What is upkeep?', 'What are institutional charges?')
  }
  if (/cancel.{0,20}(again|re-?apply)|reapply|second\s*application/i.test(t)) {
    return two('How do I check my application status?', 'Is the application open?')
  }
  if (/forgot\s*(my\s*)?(email|mail|username)/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/otp|whatsapp|telegram|agent\s*(ask|say)|pay\s*(am|5k|10k)/i.test(t)) {
    return two('How do I contact official support?', 'Which website is official?')
  }
  if (/how\s*(i|to)\s*(go\s*)?(reach|call|message|contact)|una\s*number|helpline|customer\s*care/i.test(t)) {
    return two('How do I log in?', 'What documents do I need?')
  }
  return null
}
