/** Pure-greeting detection for NELFUND AI. Never swallows real questions. */
export function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (
    /nelfund|explain|eligib|\bapply\b|application|\bportal\b|missing|upkeep|repay|\bjamb\b|\bnin\b|\bbvn\b|\bscam\b|\botp\b|matric|\bloan\b|scholarship|document|school\s*(not|fee)|what\s*is|wetin\s*be|overview|describe|teach\s*me|tell\s*me\s*(about|everything)|break\s*down|about\s*(this\s+)?nelf|how\s*to|pending|reject/i.test(
      t,
    )
  ) {
    return false
  }
  if (
    /^(hi|hii+|hello|hey|heyy+|hiya|yo|yoo+|sup|wassup|whatsup|howdy|hi\s*there|hello\s*there)(\s+(there|man|bro|sis|guys|guy|dear|boss|sir|ma|pal|fam))?$/i.test(
      t,
    )
  )
    return true
  if (/^(good\s*)?(morning|afternoon|evening|day|night)(\s*(sir|ma|boss|bro|sis|man))?$/i.test(t))
    return true
  if (
    /^(how\s*far|howfar|how\s*fa|howfa|wetin\s*dey|wetin\s*dey\s*happen|how\s*you\s*dey|how\s*una\s*dey|how\s*is\s*it|how\s*are\s*you|how\s*r\s*you|whats?\s*up|what'?s\s*up|wass?up|what\s*is\s*up|how\s*you|you\s*good|you\s*dey|na\s*how|kedu|bawo|sannu|salam|peace)(\s*(nah|now|o|oh|abeg|man|bro|sis))?$/i.test(
      t,
    )
  )
    return true
  if (/^(thanks|thank\s*you|tenki|merci|bless\s*you)(\s*(you|so\s*much))?$/i.test(t) && t.length < 30)
    return true
  if (
    /^(hi|hello|hey|how\s*far|howfar|wassup|whatsup|sup|yo|good\s*(morning|afternoon|evening))(\s+(man|bro|sis|sir|ma))?$/i.test(
      t,
    )
  )
    return true
  return false
}

export function greetingReply(): string {
  return `How far — welcome.\n\nI am here to help with **NELFUND**: applications, portal issues, eligibility, upkeep, repayment, and school-record problems.\n\nWhat do you need help with today?`
}
