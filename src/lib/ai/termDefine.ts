/**
 * Explain terms the assistant already used ("What do you mean by institutional charges?").
 * Shared by conversation + playbook paths. Does not invent policy.
 */
import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'

const TERM_DEFS: Array<{ re: RegExp; intent: IntentId; answer: string }> = [
  {
    re: /institutional\s*charg|institution\s*charg|school\s*charg/i,
    intent: 'institutional-charges',
    answer:
      `**Institutional charges** means the school fees / official charges your school bills for your programme.\n\n` +
      `- That part of the NELFUND loan is paid **to the school**, not into your personal account.\n` +
      `- **Upkeep** (if you request it) is separate living support paid **to you**.\n` +
      `- Exact amounts depend on your school — I will not invent a figure. Confirm on ${PORTAL}.\n\n` +
      `Official site: ${SITE}`,
  },
  {
    re: /\bupkeep\b|stipend|living\s*support|allowance/i,
    intent: 'upkeep',
    answer:
      `**Upkeep** is optional living support under NELFUND, separate from school charges.\n\n` +
      `- Tick it in the same session when the loan window is open.\n` +
      `- Paid **to your bank account** on the profile.\n` +
      `- Institutional charges still go **to the school**.\n` +
      `- I will not invent a monthly amount — confirm on ${PORTAL}.`,
  },
  {
    re: /\bgsi\b|global\s*standing/i,
    intent: 'gsi',
    answer:
      `**GSI** (Global Standing Instruction) is a repayment recovery method that can link to your bank account under official NELFUND rules.\n\n` +
      `Confirm exact mechanics on ${SITE} — I will not invent cut rates or start dates.`,
  },
  {
    re: /school\s*fees?|tuition/i,
    intent: 'school-fees',
    answer:
      `In NELFUND talk, **school fees** usually means **institutional charges** — what your school bills for the programme.\n\n` +
      `NELFUND pays that part **to the school**. Optional **upkeep** is separate and goes to you.`,
  },
]

/** "What do you mean by…?", "What's X?", "Wetin be X?" */
export function isMeaningAsk(text: string): boolean {
  const t = (text || '').trim()
  if (!t || t.length > 140) return false
  if (/what\s+do\s+(you|u|una|yu)\s+mean\s*(by)?/i.test(t)) return true
  if (/what\s+does?\s+.+\s+mean/i.test(t) && t.length < 120) return true
  if (/wetin\s+(you|u|una)\s+mean/i.test(t)) return true
  if (/wetin\s+(be|mean)\b/i.test(t) && t.length < 100) return true
  if (/what'?s?\s+(an?\s+)?/i.test(t) && t.length < 100) return true
  if (/what\s+(is|are|be|does|mean|means)\b/i.test(t) && t.length < 100) return true
  if (/meaning\s+of\b|define\b/i.test(t) && t.length < 100) return true
  return false
}

function cleanTypos(text: string): string {
  return (text || '')
    .replace(/\bchargers?\b/gi, 'charges')
    .replace(/\bexpanciate\b/gi, 'elaborate')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * If the student asks what a NELFUND term means (including typos like "chargers"),
 * return a short definition. Uses last assistant text when the term is only there.
 */
export function explainTerm(
  userText: string,
  lastAssistant?: string | null,
): { intent: IntentId; text: string } | null {
  const cleaned = cleanTypos(userText)
  if (!isMeaningAsk(cleaned) && !isMeaningAsk(userText || '')) return null

  for (const row of TERM_DEFS) {
    if (row.re.test(cleaned)) return { intent: row.intent, text: row.answer }
  }
  if (lastAssistant) {
    for (const row of TERM_DEFS) {
      if (row.re.test(lastAssistant)) return { intent: row.intent, text: row.answer }
    }
  }
  return null
}
