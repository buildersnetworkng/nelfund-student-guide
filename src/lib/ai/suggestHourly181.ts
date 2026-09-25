function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-181 journeys. Max two. */
export function suggestHourly181(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(it|nelfund|am)\s*(a\s*)?(scholarship|grant)/i.test(
      t,
    )
  ) {
    return two('When does repayment start?', 'Is the loan interest-free?')
  }
  if (/interest\s*(dey|free|rate)|zero\s*interest|does\s*(e|it|am)\s*get\s*interest|any\s*interest/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When does repayment start?')
  }
  if (
    /part[-\s]*time|sandwich|private\s*(uni|school)|100\s*l|nd1|hnd1|freshers?/i.test(t) &&
    /eligib|apply|can\s*i|who\s*can/i.test(t)
  ) {
    return two('How do I apply step by step?', 'What documents do I need?')
  }
  if (/mail\s*don\s*(dey|exist)|email\s*already|account\s*already\s*(dey|exist)/i.test(t)) {
    return two('I forgot my password', 'How do I log in?')
  }
  if (/dem\s*don\s*close|still\s*(dey\s*)?open|window\s*(open|close)|fit\s*i\s*still\s*apply/i.test(t)) {
    return two('How do I apply step by step?', 'Who can apply (eligibility)?')
  }
  if (/how\s*i\s*go\s*apply.{0,30}(loan|upkeep)|loan\s+and\s+upkeep|i\s*meant.{0,20}upkeep/i.test(t)) {
    return two('How do I log in?', 'What is upkeep vs school fees?')
  }
  return null
}
