function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-181 journeys. Max two. */
export function suggestHourly181(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/jamb\s*caps|caps\s*(no|not|never)\s*(show|dey)|jamb\s*(no|not)\s*verify/i.test(t)) {
    return two('What documents do I need?', 'My school is not on the list')
  }
  if (/how\s*long.{0,24}(pending|approval)|e\s*still\s*dey\s*pending|pending\s*(since|for)/i.test(t)) {
    return two('How do I check my application status?', 'How do I contact official support?')
  }
  if (/raise\s*a?\s*dispute|wrong\s*(fee|charge|amount)|fee\s*(no|not)\s*(correct|match)/i.test(t)) {
    return two('What are institutional charges?', 'How do I apply for loan and upkeep?')
  }
  if (/which\s*(site|website|link)\s*(na|is)\s*(original|official|correct|real)|fake\s*(nelfund\s*)?(site|link)/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/passport\s*(photograph|photo)|nin\s*slip\s*(and|&)\s*(bvn|jamb)/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  if (/una\s*go\s*add\s*interest|hidden\s*interest|dem\s*go\s*add\s*interest/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When do I repay?')
  }
  if (/na\s*(gift|free\s*money|grant)\??|scholarship\s*abi\s*loan/i.test(t)) {
    return two('What is upkeep?', 'When do I repay?')
  }
  return null
}
