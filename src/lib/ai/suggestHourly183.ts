function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-183 journeys. Max two. */
export function suggestHourly183(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/email\s*(already|don|has)\s*(been\s*)?(use[d]?|taken|exist)|dis\s*email\s*(don|already)\s*(dey|exist)|account\s*(already|don)\s*(dey|exist)/i.test(t)) {
    return two('How do I reset my password?', 'How do I log in?')
  }
  if (/forget\s*(my\s*)?(pass|password)|forgot\s*(my\s*)?(pass|password)|reset\s*(my\s*)?(pass|password)|password\s*(no|not|never)\s*(dey|work|correct)|i\s*no\s*remember\s*(my\s*)?password/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/\b(na|is)\s*(dis|this|am)\s*(scholarship|grant|free\s*money)|loan\s*(or|vs|abi)\s*scholarship|scholarship\s*(or|vs|abi)\s*loan|dem\s*(go|will)\s*collect\s*(am\s*)?back|na\s*free\s*money/i.test(t)) {
    return two('When do I repay?', 'Is NELFUND interest-free?')
  }
  if (/interest\s*(rate|free|zero)|zero\s*interest|dem\s*(go|will)\s*add\s*interest|how\s*much\s*interest|e\s*get\s*interest/i.test(t)) {
    return two('When do I repay?', 'Is NELFUND a loan or a scholarship?')
  }
  if (/school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)?\s*(the\s*)?list|my\s*school\s*(no|not)\s*(dey|on)\s*(the\s*)?list|una\s*no\s*put\s*my\s*school/i.test(t)) {
    return two('What documents do I need?', 'How do I contact official support?')
  }
  if (/missing\s*(info|information|details)|profile\s*(no|not)\s*complete|e\s*say\s*missing|portal\s*say\s*missing/i.test(t)) {
    return two('Has my school uploaded my data?', 'How do I log in?')
  }
  if (/part[\s-]*time|sandwich|post\s*graduate|postgraduate|masters?\b|phd\b|i\s*dey\s*part\s*time/i.test(t)) {
    return two('Who can apply for NELFUND?', 'My school is not on the list')
  }
  if (/how\s*(to|i\s*go|do\s*i)\s*apply\s*(then\s*)?(i\s*meant\s*)?(for\s*)?(the\s*)?(loan|upkeep)|apply.{0,24}(loan|upkeep).{0,16}(and|&|plus).{0,16}(loan|upkeep)/i.test(t)) {
    return two('What are institutional charges?', 'What is upkeep?')
  }
  return null
}
