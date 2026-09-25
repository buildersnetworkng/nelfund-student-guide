function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-183 journeys. Max two. */
export function suggestHourly183(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (/direct\s*entry|ijmb|jupeb|no\s*utme|jamb\s*(number|reg).{0,20}(lost|forget|no\s*dey)/i.test(t)) {
    return two('What documents do I need?', 'How do I contact official support?')
  }
  if (/forgot\s*(the\s*)?(email|gmail)|which\s*email\s*(i\s*)?(use|used)/i.test(t)) {
    return two('How do I log in?', 'How do I contact official support?')
  }
  if (/passport\s*(photo|photograph)|upload\s*(my\s*)?(picture|photo|id\s*card)|student\s*id/i.test(t)) {
    return two('What documents do I need?', 'How do I apply step by step?')
  }
  if (/change\s*of\s*institution|i\s*change\s*(school|uni)|transfer\s*student/i.test(t)) {
    return two('My school is not on the list', 'How do I contact official support?')
  }
  if (/i\s*dey\s*(do|serve)\s*nysc|serving\s*(corps|nysc)|after\s*graduation/i.test(t)) {
    return two('When do I repay?', 'Who can apply?')
  }
  if (/how\s*(i\s*go|to|do\s*i)\s*(open|raise|create)\s*(esupport|e-?support|ticket)|ticket\s*(no|not|never)\s*(reply|answer)/i.test(t)) {
    return two('How do I contact official support?', 'Is this a scam?')
  }
  if (/na\s*(loan|scholarship|grant)|free\s*money\s*abi\s*loan/i.test(t)) {
    return two('When do I repay?', 'Is NELFUND interest-free?')
  }
  if (/interest\s*(rate|free)|does\s*(e|it)\s*get\s*interest|zero\s*interest/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'When do I repay?')
  }
  return null
}
