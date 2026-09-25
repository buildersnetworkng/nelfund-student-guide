function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-178 journeys. Max two. */
export function suggestHourly178(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/otp|whatsapp\s*(man|agent)|pay\s*(am\s*)?\d|scam|never\s*share/i.test(t)) {
    return two('How do I apply only on the official portal?', 'How do I contact official support?')
  }
  if (/jamb|invalid\s*(number|utme)|utme/i.test(t)) {
    return two('Portal shows missing information', 'What documents do I need?')
  }
  if (/school\s*(no|not|never)\s*(dey|show|list)|not\s*on\s*(the\s*)?list|no\s*result\s*found/i.test(t)) {
    return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
  }
  if (/pending|how\s*far|money\s*never|wetin\s*dey\s*hold|disburse/i.test(t)) {
    return two('When does official disbursement happen after approval?', 'How do I contact official support?')
  }
  if (/contact|esupport|help\s*desk|how\s*i\s*go\s*(yarn|reach)|official\s*(email|phone)/i.test(t)) {
    return two('How do I apply step by step?', 'Portal shows missing information')
  }
  if (/still\s*(dey\s*)?open|dem\s*don\s*close|deadline|can\s*i\s*still\s*apply|application\s*(open|close)/i.test(t)) {
    return two('How do I apply step by step?', 'Who can apply (eligibility)?')
  }
  if (/interest[- ]?free|does\s*(e|am|it)\s*get\s*interest|interest\s*dey/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When does repayment start?')
  }
  if (/loan\s*(or|vs)\s*(scholarship|grant)|na\s*(scholarship|grant)|free\s*money/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  if (/wetin\s*(i|una)\s*(go|suppose)\s*(upload|carry)|which\s*document|documents?\s*(do\s*i\s*)?need/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  if (/name\s*(no|not)\s*(match|the\s*same)|bvn|wrong\s*bank/i.test(t)) {
    return two('What is upkeep?', 'How do I contact official support?')
  }
  return null
}
