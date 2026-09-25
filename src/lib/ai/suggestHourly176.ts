function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-176 journeys. Max two. */
export function suggestHourly176(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/jamb.{0,20}(invalid|no\s*dey|never\s*work|fail|wrong)|invalid\s*(jamb|utme)/i.test(t)) {
    return two('Portal shows missing information', 'How do I log in?')
  }
  if (
    /school\s*(no|not|never)\s*(dey|show|list|appear)|not\s*(on\s*)?(the\s*)?list|cannot\s*find\s*(my\s*)?school|no\s*result\s*found/i.test(
      t,
    )
  ) {
    return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
  }
  if (
    /how\s*(i\s*go|do\s*i|to)\s*(yarn|reach|contact|call)|official\s*(email|phone|number|support)|esupport|open\s*(a\s*)?ticket/i.test(
      t,
    )
  ) {
    return two('How do I apply step by step?', 'Portal shows missing information')
  }
  if (/(share|send|give).{0,16}(otp|pin|password)|otp.{0,16}(whatsapp|agent)|never\s*share\s*(otp|pin)/i.test(t)) {
    return two('How do I apply only on the official portal?', 'How do I contact official support?')
  }
  if (/interest[- ]?free|zero\s*interest|does\s*(am|it|e)\s*get\s*interest|interest\s*dey/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When does repayment start?')
  }
  if (
    /pending.{0,24}(long|since|months|weeks)|how\s*far\s*(my\s*)?(loan|money|application)|money\s*never\s*(enter|show|drop)|wetin\s*dey\s*hold/i.test(
      t,
    )
  ) {
    return two('When does official disbursement happen after approval?', 'How do I contact official support?')
  }
  return null
}
