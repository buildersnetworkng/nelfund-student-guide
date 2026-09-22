/** Off-topic gate for NELFUND AI. Follow-ups in an active NELFUND thread stay on-topic. */

function isGreetingLocal(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (/nelfund|apply|portal|loan|jamb|pending|upkeep|create|account|step|guide|how\s*far/i.test(t)) return false
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))[.!?\s]*$/i.test(t)) return true
  return false
}

export function isOffTopic(text: string, priorIntent?: string | null): boolean {
  const t = text.trim().toLowerCase()
  if (!t || t.length < 2) return false
  if (isGreetingLocal(text)) return false
  if (/how\s*far|money\s*never|never\s*enter|pending|under\s*review|wetin\s*next|so\s*wetin|approved\s*but|dem\s*never\s*pay|nothing\s*don\s*drop|mates\s*don\s*collect|dashboard\s*(zero|0)|disburse|kobo\s*no\s*dey|stuck\s*on\s*pending|status\s*check|track\s*am/i.test(t)) return false
  if (
    /\b(weather|football|soccer|nba|movie|netflix|crypto|bitcoin|forex|girlfriend|boyfriend|dating|poem|joke|lottery|betting|politics|election|music|song|lyrics|write\s*code|python\s*script|javascript)\b/i.test(
      t,
    )
  ) {
    return true
  }
  // Already in a NELFUND conversation (e.g. after How to apply)
  if (priorIntent && priorIntent !== 'unknown' && priorIntent !== 'official-sources') {
    return false
  }
  if (
    /nelfund|nelf\.gov|portal|student\s*loan|upkeep|jamb|\bnin\b|\bbvn\b|matric|apply|login|sign\s*in|sign\s*up|registration|application|eligibility|create|account|register|profile|step\s*by\s*step|guide\s*me|one\s*by\s*one|how\s*to|walk\s*me|help\s*me\s*(with|create|apply)|school|student|loan|fee|admission|university|poly|college|education/i.test(
      t,
    )
  ) {
    return false
  }
  if (t.length > 40) return true
  return false
}
