function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-179 journeys. Max two. */
export function suggestHourly179(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/loan\s*(or|vs|versus|and)\s*(scholarship|grant)|scholarship|free\s*money|dem\s*go\s*collect/i.test(t)) {
    return two('When does repayment start?', 'Is there interest on the loan?')
  }
  if (/document|wetin\s*(i|dem)\s*(go\s*)?(carry|need|upload)|admission\s*letter|nin\s*(and|&)\s*(bvn|jamb)/i.test(t)) {
    return two('How do I apply step by step?', 'My school has not uploaded my data')
  }
  if (/school\s*(no|not|never)\s*(dey|show|list)|not\s*on\s*(the\s*)?list|no\s*result\s*found|my\s*school\s*no\s*dey/i.test(t)) {
    return two('What documents do I need?', 'How do I contact official support?')
  }
  if (/bvn|wrong\s*bank|change\s*(my\s*)?bank|account\s*(number\s*)?(wrong|reject)/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/\bnysc\b|already\s*graduat|i\s*(don|have)\s*finish/i.test(t)) {
    return two('When does repayment start?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/still\s*(dey\s*)?(open|apply)|window\s*(still\s*)?open|una\s*still\s*dey|fit\s*i\s*still\s*apply|deadline/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  return null
}
