/**
 * NELFUND chat API — playbook gates first.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ_PAGE = 'https://nelf.gov.ng/faq'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'

type Body = {
  messages?: { role: string; content?: string; text?: string }[]
  question?: string
  text?: string
  message?: string
  userText?: string
}

function lastUser(body: Body): string {
  const incoming = Array.isArray(body.messages) ? body.messages : []
  for (let i = incoming.length - 1; i >= 0; i--) {
    if (incoming[i].role === 'user') return (incoming[i].content || incoming[i].text || '').trim()
  }
  return (body.question || body.text || body.message || body.userText || '').trim()
}

function ok(res: VercelResponse, reply: string, intent: string, provider: string, suggestions: string[]) {
  return res.status(200).json({
    reply,
    mode: 'llm-agent',
    provider,
    latencyMs: 0,
    intent,
    suggestions: suggestions.slice(0, 2),
  })
}

function overview(): string {
  return (
    `**How NELFUND works (full go-through)**\n\n` +
    `1. **What it is:** Nigeria Education Loan Fund — **interest-free** student loans under the Students Loans (Access to Higher Education) Act. It is a **loan**, not a scholarship or free money.\n` +
    `2. **Who it is for:** Eligible students in **public** tertiary institutions (not private schools), with admission and required records (JAMB, NIN, BVN, bank).\n` +
    `3. **Two money parts:**\n` +
    `   - **Institutional charges** (school fees) → paid **to the school**\n` +
    `   - **Upkeep** (optional living support) → paid **to you** if you tick it in the same session\n` +
    `4. **How to use it:** Open ${PORTAL} → create account or sign in → complete profile → request the loan only when the official window is open.\n` +
    `5. **After you apply:** Check status on the same portal. School charges go to the institution; upkeep (if any) goes to your profile bank. I will not invent pay dates.\n` +
    `6. **Repayment:** Starts after the applicable study or NYSC period under official rules — confirm on ${SITE}. I will not invent rates or jail terms.\n` +
    `7. **Safety:** Never pay an agent. Only ${PORTAL} and ${SITE}. Tickets: ${ESUPPORT}.\n\n` +
    `Ask next about **eligibility**, **how to apply**, **upkeep**, **portal errors**, or **repayment** if you want one topic in detail.`
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body: Body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  const q = lastUser(body)
  if (!q) return res.status(400).json({ error: 'messages required' })

  if (/institutional\s*charg|institution\s*charg|school\s*charg|what\s+do\s+(u|you)\s+mean\s+by\s+institutional/i.test(q) && /mean|wetin|what|define|chargers?/i.test(q)) {
    return ok(
      res,
      `**Institutional charges** means the school fees / official charges your school bills for your programme.\n\n- That part of the NELFUND loan is paid **to the school**, not into your personal account.\n- **Upkeep** (if you request it) is separate living support paid **to you**.\n- Exact amounts depend on your school — I will not invent a figure. Confirm on ${PORTAL}.\n\nOfficial site: ${SITE}`,
      'institutional-charges',
      'playbook-term-charges',
      ['What is upkeep?', 'How do I apply?'],
    )
  }

  if (/how\s+(does\s+)?(nelfund|it|this|the\s+loan|dis)\s+work|how\s+nelfund\s+works|how\s+does\s+this\s+nelfund|nelfund\s+(thing|stuff)\s+work|go\s*through\s+(of\s+)?(the\s+)?(whole\s+)?nelfund|whole\s+nelfund\s+(stuff|thing|process)|full\s+(guide|overview|walk\s*through)|overview\s+(of\s+)?nelfund|walk\s*me\s+through\s+(nelfund|the\s+loan)|how\s+the\s+(scheme|loan)\s+works/i.test(q)) {
    return ok(res, overview(), 'what-is-nelfund', 'playbook-overview', ['Who can apply (eligibility)?', 'How do I apply step by step?'])
  }

  if (/fogo?t\s*(my\s*)?pas+w|forgot\s*(my\s*)?password|reset\s*(my\s*)?password|i\s*no\s*remember\s*(my\s*)?password|pasword/i.test(q)) {
    return ok(
      res,
      `**Forgot password**\n\n1. Open ${LOGIN} or ${PORTAL} → Forgot / Reset password.\n2. Use the **same email** already on the account.\n3. Check inbox and spam.\n4. Do not create a second account.\n5. No mail: ${ESUPPORT} with a screenshot.`,
      'password-reset',
      'playbook-password',
      ['How do I log in?', 'Email already used — what do I do?'],
    )
  }

  if (/email.{0,24}(already|don|has).{0,16}(used|exist|dey|register)|email\s+don\s+already|used\s+by\s+another\s+student/i.test(q)) {
    return ok(
      res,
      `**Email already used**\n\n1. Sign in at ${LOGIN} with that email.\n2. If you forgot the password, reset on the same email.\n3. Still blocked: ${ESUPPORT} with a screenshot.\n\nDo not open a second account.`,
      'email-already-used',
      'playbook-email-used',
      ['I forgot my password', 'How do I contact official support?'],
    )
  }

  if (/documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry|requirements?\s*to\s*apply/i.test(q)) {
    return ok(
      res,
      `**Documents the portal typically asks for**\n\n• JAMB number / admission letter\n• NIN and BVN\n• Bank account in your name\n• Matric number when issued\n• School ID if the form asks\n\nUpload only on ${PORTAL}. Never send files to an agent.`,
      'documents-needed',
      'playbook-docs',
      ['How do I apply step by step?', 'How do I log in?'],
    )
  }

  if (/loan\s*(or|vs)\s*scholarship|na\s*scholarship|na\s*grant|free\s*money/i.test(q)) {
    return ok(
      res,
      `**Loan, not scholarship**\n\nNELFUND is an **interest-free loan**, not a grant or free money.\nOfficial FAQ: repayment starts **2 years after NYSC**. Confirm on ${SITE}. I will not invent extra rates.`,
      'loan-or-scholarship',
      'playbook-loan-vs-schol',
      ['When does repayment start?', 'Is the loan interest-free?'],
    )
  }

  if (/scam|fake\s*portal|pay\s*(an?\s*)?agent/i.test(q)) {
    return ok(
      res,
      `**Stay safe**\n\nNever pay an agent. Never share OTP or password.\nOfficial only: ${SITE} · ${PORTAL} · ${LOGIN} · ${ESUPPORT}`,
      'scam-safety',
      'playbook-scam',
      ['How do I apply only on the official portal?', 'How do I contact official support?'],
    )
  }

  if (/how\s+(do\s*i|to|i\s*go)\s+(log\s*in|login|sign\s*in)|^(log\s*in|login|sign\s*in)\??$/i.test(q) && !/how\s*(do\s*i|to)\s*apply/i.test(q)) {
    return ok(
      res,
      `**How to log in to NELFUND**\n\n1. Open ${PORTAL} and use **Sign in** with the email you registered.\n2. You can also sign in from ${SITE}. Login page: ${LOGIN}.\n3. If that email was used before (including last year), do **not** create a new account — sign in or reset password on the same email.\n4. First time only: create account at ${PORTAL}.\n5. Forgot password: use reset on ${PORTAL} or ${SITE}. Tickets: ${ESUPPORT}.`,
      'portal-login',
      'playbook-login',
      ['I forgot my password', 'Old email from last year — what do I do?'],
    )
  }

  if (/meant\s+for\s+the\s+loan|loan\s+and\s+upkeep|apply\s+for\s+(the\s+)?(loan|upkeep)/i.test(q)) {
    return ok(
      res,
      `**How to apply for the loan (school charges) and upkeep**\n\n1. Confirm your school is listed and your record is uploaded.\n2. Sign in at ${PORTAL} with the same email (do not open a second account).\n3. Complete profile: JAMB, NIN, BVN, and a bank account **in your name**.\n4. When the official loan window is open, use **Request for Student Loan**.\n5. **Institutional charges** (school fees) go to the school. Tick **upkeep** in the same session if you want living support — it goes to your bank account.\n6. I will not invent open dates or amounts. Confirm the window on ${PORTAL} and ${SITE}.`,
      'how-to-apply',
      'playbook-apply-upkeep',
      ['How do I log in?', 'What is upkeep vs school fees?'],
    )
  }

  if (/wetin\s*(be|mean)\s*(this\s+)?nelfund|what\s*is\s*(this\s+)?nelfund|why\s+nelfund|purpose\s+of\s+nelfund|tell\s+me\s+about\s+nelfund|explain\s+nelfund|abeg\s+wetin\s+be\s+nelfund/i.test(q)) {
    return ok(
      res,
      `**Why NELFUND was created:** to remove financial barriers so eligible students in **public** tertiary institutions can access higher education without paying school charges upfront.\n\n**What it is:** the Nigeria Education Loan Fund: **interest-free** loans for **institutional charges** (paid to the school) and optional **monthly upkeep** (paid to the student), under the Students Loans (Access to Higher Education) Act.\n\nIt is a **loan**, not a scholarship. Official FAQ: repayment starts **2 years after NYSC**.\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ_PAGE}`,
      'what-is-nelfund',
      'playbook-purpose',
      ['Who can apply (eligibility)?', 'How do I apply step by step?'],
    )
  }

  if (/is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|closed)|deadline|can\s+i\s+still\s+apply|loan\s*window/i.test(q)) {
    return ok(
      res,
      `For **live** open/closed and dates, confirm on ${PORTAL} and ${SITE}.\n\nI will not invent a closing date.\n\n• Sign **up**: ${PORTAL}\n• Sign **in**: ${LOGIN}\n• Support: ${ESUPPORT}`,
      'current-information',
      'playbook-open',
      ['How do I apply step by step?', 'Who can apply (eligibility)?'],
    )
  }

  if (/invalid\s*jamb|jamb.*(invalid|fail|verif)|jamb\s*number|my\s*jamb/i.test(q)) {
    return ok(
      res,
      `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile.\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. Still failing? Ticket: ${ESUPPORT} with a screenshot.\n\nPortal: ${PORTAL}`,
      'jamb-verification',
      'playbook-jamb',
      ['Portal shows missing information', 'How do I log in?'],
    )
  }

  if (/missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found|school\s*no\s*(dey|gree)\s*show/i.test(q)) {
    return ok(
      res,
      `**Missing information / school not on the list** usually means the institution has not finished uploading your record.\n\n1. Confirm you attend a **public** institution.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. Ticket: ${ESUPPORT}`,
      'missing-information',
      'playbook-missing',
      ['How do I know if my school uploaded my data?', 'How do I contact official support?'],
    )
  }

  if (/\bpending\b|under\s*review|check\s*(my\s*)?(application\s*)?status|how\s*far|money\s*never\s*enter/i.test(q)) {
    return ok(
      res,
      `**Pending / under review / money never enter** is not a rejection.\n\n1. Open ${PORTAL} and note the exact status word.\n2. Confirm your school has uploaded your data.\n3. Official FAQ: disbursement within **30 days of approval**.\n4. Ticket if it stays stuck: ${ESUPPORT}\n\nI will not invent a pay date.`,
      'pending-application',
      'playbook-pending',
      ['When will money enter my account?', 'How do I contact official support?'],
    )
  }

  if (/how\s*(do\s*i|to)\s*apply|i\s*wan\s*apply|step\s*by\s*step|sign\s*up|create\s*(an?\s*)?account/i.test(q)) {
    return ok(
      res,
      `**Apply**\n1. Create account: ${PORTAL}\n2. Complete profile (NIN, BVN, JAMB, admission / matric).\n3. Submit **institutional charges** and, if you need it, **upkeep** in the same session.\n4. Track status on the portal.\n\nLogin: ${LOGIN}`,
      'how-to-apply',
      'playbook-apply',
      ['How do I log in?', 'What is upkeep vs school fees?'],
    )
  }

  if (/school\s*fees|institutional\s*charges|tuition/.test(q) && /\bupkeep\b|stipend/.test(q)) {
    return ok(
      res,
      `**School fees vs upkeep** (two different things)\n\n• **Institutional charges / school fees:** paid **to your school**.\n• **Upkeep:** living support paid **to you**, if you applied for it.\n\nAmounts only on ${PORTAL} / ${SITE}. FAQ: ${FAQ_PAGE}`,
      'school-fees',
      'playbook-fees-upkeep',
      ['What is upkeep?', 'How do I apply?'],
    )
  }

  if (/repay|after\s*nysc|pay\s*back/i.test(q)) {
    return ok(
      res,
      `**Repayment** starts after the applicable study / NYSC period under official rules.\n\nOfficial FAQ: due **2 years after NYSC**. Confirm on ${SITE}. I will not invent rates or jail terms.`,
      'repayment',
      'playbook-repay',
      ['Is NELFUND a loan or a scholarship?', 'How do I check status on the portal?'],
    )
  }

  return ok(
    res,
    `I can still help with NELFUND without inventing dates.\n\n• Purpose / what it is\n• How to apply: ${PORTAL}\n• Login: ${LOGIN}\n• Pending / JAMB / missing school\n• Support: ${ESUPPORT}\n\nAsk in English or Pidgin. Official pages only.`,
    'official-sources',
    'playbook-fallback',
    ['Who can apply (eligibility)?', 'How do I apply step by step?'],
  )
}
