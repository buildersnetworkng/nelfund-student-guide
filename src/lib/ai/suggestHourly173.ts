function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-173 journeys. Max two. */
export function suggestHourly173(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/how\s*long.{0,20}(pending|take|wait)|pending.{0,16}(weeks|month)/i.test(t)) {
    return two('When does official disbursement happen after approval?', 'How do I contact official support?')
  }
  if (/refund|already\s*(pay|paid)\s*(school\s*)?fees/i.test(t)) {
    return two('What is institutional charges?', 'How do I contact official support?')
  }
  if (/change\s*(my\s*)?(phone|number|gsm)|new\s*phone\s*number/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/two\s*(loan|application)|duplicate\s*(loan|application)|apply\s*(am\s*)?(two|2)\s*times/i.test(t)) {
    return two('How do I check status on the portal?', 'How do I contact official support?')
  }
  if (/session\s*(not\s*)?(open|opened|close)|institution.{0,30}session/i.test(t)) {
    return two('How do I know if my school uploaded my data?', 'How do I contact official support?')
  }
  if (/na\s*free\s*money|loan\s*abi\s*scholarship/i.test(t)) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  return null
}
