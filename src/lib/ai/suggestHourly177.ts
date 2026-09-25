function two(a: string, b: string): [string, string] {
  return [a, b]
}

/** Text-aware chips for hourly-177 journeys. Max two. */
export function suggestHourly177(userText?: string | null): [string, string] | null {
  const t = (userText || '').trim()
  if (!t) return null
  if (
    /\b(nd|hnd|nce)\b|college\s*of\s*education|poly(technic)?|vocational/i.test(t) &&
    /eligib|apply|cover|fit/i.test(t)
  ) {
    return two('How do I apply step by step?', 'My school is not on the list')
  }
  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry)|which\s*(file|document|paper)|documents?\s*(i\s*)?(need|required)/i.test(
      t,
    )
  ) {
    return two('How do I apply step by step?', 'How do I log in?')
  }
  if (/\bgsi\b|global\s*standing|pay\s*back|after\s*nysc|salary\s*(deduct|cut)/i.test(t)) {
    return two('Is NELFUND a loan or a scholarship?', 'Is the application still open?')
  }
  if (/scholarship|grant|free\s*money|loan\s*(or|vs)\s*(scholarship|grant)/i.test(t)) {
    return two('When does repayment start?', 'How does this NELFUND thing work?')
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(no|not)\s*(dey|work)/i.test(t)) {
    return two('How do I log in?', 'Email already used — what do I do?')
  }
  if (/email.{0,24}(already|don|has).{0,16}(use|used|exist)/i.test(t)) {
    return two('I forgot my password', 'How do I log in?')
  }
  return null
}
