function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-175 journeys. Max two. */
export function suggestHourly175(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/email\s*(don|already|has)\s*(use|used|exist|dey)|mail\s*(already|don)\s*(use|used)/i.test(t)) {
    return two('I forgot my password', 'How do I contact official support?')
  }
  if (/missing\s*(info|information|details)|incomplete\s*(profile|information)/i.test(t)) {
    return two('How do I know if my school uploaded my data?', 'What documents do I need?')
  }
  if (/dem\s*don\s*close|can\s*i\s*still\s*apply|still\s*(dey\s*)?open|deadline\s*(pass|don\s*pass)/i.test(t)) {
    return two('How do I apply step by step?', 'Who can apply (eligibility)?')
  }
  if (/na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  if (/pay\s*(me\s*)?(5k|5000|10k|agent)|whatsapp.{0,20}(pay|otp)|make\s*i\s*pay/i.test(t)) {
    return two('How do I apply only on the official portal?', 'How do I contact official support?')
  }
  if (/wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry|bring)|which\s*(file|document)/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  return null
}
