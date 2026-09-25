function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-182 journeys. Max two. */
export function suggestHourly182(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/wetin\s*(i|dem)\s*(go\s*)?(need|carry|gather)|documents?\s*(checklist|list)|what\s*(papers|docs)\s*(do\s*i|i\s*need)/i.test(t)) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  if (/i\s*(no|never|don.?t)\s*(do|finish|don)\s*nysc|before\s*nysc|repay.{0,20}nysc|when\s*(i\s*)?(go|will)\s*pay\s*back/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'What is GSI?')
  }
  if (/college\s*of\s*education|coe\b|polytechnic\s*(student|i\s*dey)|i\s*dey\s*(poly|coe|college)/i.test(t)) {
    return two('My school is not on the list', 'What documents do I need?')
  }
  if (/(send|give|share).{0,18}(nin|bvn|account).{0,18}(whatsapp|agent|them)|whatsapp.{0,18}(nin|bvn)|make\s*i\s*send\s*(my\s*)?(nin|bvn)/i.test(t)) {
    return two('How do I contact official support?', 'Which site is official?')
  }
  if (/ticket\s*(or|vs|abi)\s*(school|campus)|campus\s*desk\s*(or|abi)\s*(esupport|ticket)|who\s*(i\s*)?go\s*ask\s*first/i.test(t)) {
    return two('How do I contact official support?', 'My school is not on the list')
  }
  if (/how\s*(i\s*go|to|do\s*i)\s*apply\s*(for\s*)?(loan\s*)?(and|&|plus)\s*upkeep|upkeep\s*(and|&|plus)\s*(school\s*fees|institutional)|select\s*both\s*(loan|upkeep)/i.test(t)) {
    return two('What are institutional charges?', 'What is upkeep?')
  }
  if (/gsi.{0,24}(now|today|debit|remove\s*money)|will\s*(dem|they)\s*(debit|remove\s*money)\s*now|mandate\s*(mean|be)\s*wetin/i.test(t)) {
    return two('When do I repay?', 'Is NELFUND interest-free?')
  }
  return null
}
