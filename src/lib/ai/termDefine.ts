/**
 * Term meaning answers — "what is X?", "wetin be X?", typos like "disurment".
 * Used when the student asks what a word means in NELFUND context.
 */
import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

type TermRow = { re: RegExp; intent: IntentId; answer: string }

const TERM_DEFS: TermRow[] = [
  {
    re: /institutional\s*charges?|institution\s*charges?|school\s*charges?/i,
    intent: 'institutional-charges',
    answer:
      '**Institutional charges** = the school-fee part of the loan.\n\n' +
      'NELFUND pays this **to your school** (not to your personal account). Optional **upkeep** is separate and goes to you if you selected it.',
  },
  {
    re: /\bupkeep\b|stipend|living\s*support|allowance/i,
    intent: 'upkeep',
    answer:
      '**Upkeep** is optional living support on the NELFUND student loan.\n\n' +
      'If you select it and it is approved, it is paid **to your bank account**. School fees / institutional charges still go **to the school**. Confirm amounts only on the portal.',
  },
  {
    re: /school\s*fees?|tuition/i,
    intent: 'school-fees',
    answer:
      'In NELFUND talk, **school fees** usually means **institutional charges** — what your school bills for the programme.\n\n' +
      'NELFUND pays that part **to the school**. Optional **upkeep** is separate and goes to you.',
  },
  {
    re: /disburse|disbursement|disurment|disbursment|disburstment|payout|when\s*money|money\s*enter/i,
    intent: 'pending-application',
    answer:
      '**Disbursement** means NELFUND **paying** an approved loan.\n\n' +
      '• Institutional charges → paid to the **school**\n' +
      '• Upkeep (if selected) → paid to **you**\n' +
      'Official FAQ: often within **30 days of approval** of a successful application — confirm live status on the portal. I will not invent your personal pay date.\n\n' +
      `Login: ${LOGIN}`,
  },
  {
    re: /\bpending\b|under\s*review/i,
    intent: 'pending-application',
    answer:
      '**Pending** on the portal means the application is **submitted and still processing** — not declined.\n\n' +
      `Sign in at ${LOGIN} → **☰ → Loans** and read the exact status. I cannot move the queue from this chat.`,
  },
  {
    re: /\bgsi\b|global\s*standing\s*instruction/i,
    intent: 'gsi',
    answer:
      '**GSI (Global Standing Instruction)** is a repayment arrangement used with student loans so recovery can follow official rules after the study / NYSC period.\n\n' +
      `Confirm exact wording on ${SITE} and ${PORTAL}. I will not invent rates or jail terms.`,
  },
  {
    re: /raise\s*(a\s*)?dispute|fee\s*dispute|dispute/i,
    intent: 'pending-application',
    answer:
      '**Raise a dispute / Fee Disputes** is used when the **school fee amount shown** on the portal does **not** match what your bursary confirms.\n\n' +
      'Best done **before Submit**. Your school then confirms the figure; whatever they confirm becomes the institutional loan amount.\n' +
      `Login: ${LOGIN} → **☰ → Disputes**`,
  },
  {
    re: /\bbvn\b|bank\s*verification/i,
    intent: 'bank-information',
    answer:
      '**BVN** is your Bank Verification Number. The portal uses it with your bank account (must be in **your** name).\n\n' +
      `Update only on ${PORTAL}. For 2026/2027 re-enter BVN/bank when asked.`,
  },
  {
    re: /\bnin\b|national\s*identity/i,
    intent: 'nin-verification',
    answer:
      '**NIN** is your National Identification Number. Use the one that belongs to you and matches JAMB where the portal asks.\n' +
      `Retry on ${PORTAL}. Still failing: campus desk or send a support message at ${ESUPPORT}.`,
  },
  {
    re: /\bportal\b|student\s*loan\s*portal/i,
    intent: 'portal-login',
    answer:
      'The **portal** is the official NELFUND student site where you register, log in, apply, and check status.\n\n' +
      `Start: ${PORTAL}\nLogin: ${LOGIN}\nPublic info site: ${SITE}`,
  },
  {
    re: /session|institution has not opened/i,
    intent: 'pending-application',
    answer:
      'A **session** is your school’s open period for loan applications on the portal.\n\n' +
      'National NELFUND may be open while **your school** has not opened its session yet — then Home can say “institution has not opened a session.” Contact campus NELFUND desk; try login → **☰ → Loans** → refresh.',
  },
]

/** "What do you mean by…?", "What's X?", "Wetin be X?", "what's disurment" */
export function isMeaningAsk(text: string): boolean {
  const t = (text || '').trim()
  if (!t || t.length > 180) return false
  if (/what\s+do\s+(you|u|una|yu)\s+mean\s*(by)?/i.test(t)) return true
  if (/what\s+does?\s+.+\s+mean/i.test(t) && t.length < 140) return true
  if (/wetin\s+(you|u|una)\s+mean/i.test(t)) return true
  if (/wetin\s+(be|mean)\b/i.test(t) && t.length < 120) return true
  if (/what'?s?\s+(an?\s+)?/i.test(t) && t.length < 120) return true
  if (/what\s+(is|are|be|does|mean|means)\b/i.test(t) && t.length < 120) return true
  if (/meaning\s+of\b|define\b/i.test(t) && t.length < 120) return true
  if (/^[a-zA-Z\s?]{3,40}\??$/.test(t) && /disburse|disurment|upkeep|pending|gsi|bvn|nin|portal|dispute/i.test(t))
    return true
  return false
}

function cleanTypos(text: string): string {
  return (text || '')
    .replace(/\bchargers?\b/gi, 'charges')
    .replace(/\bchargesr\b/gi, 'charges')
    .replace(/\binstutional\b/gi, 'institutional')
    .replace(/\binstituional\b/gi, 'institutional')
    .replace(/\bchargres\b/gi, 'charges')
    .replace(/\bexpanciate\b/gi, 'elaborate')
    .replace(/\bdisurment\b/gi, 'disbursement')
    .replace(/\bdisbursment\b/gi, 'disbursement')
    .replace(/\bdisburstment\b/gi, 'disbursement')
    .replace(/\bdisburst\b/gi, 'disburse')
    .replace(/\bpendding\b/gi, 'pending')
    .replace(/\brepayement\b/gi, 'repayment')
    .replace(/\beligiblity\b/gi, 'eligibility')
    .replace(/\baplication\b/gi, 'application')
    .replace(/\s+/g, ' ')
    .trim()
}

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
