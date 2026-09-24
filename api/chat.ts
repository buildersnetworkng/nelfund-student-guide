/**
 * NELFUND Student Guide: conversational AI agent endpoint.
 * Playbook gates first. LLM is optional evidence, never required for core intents.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

type LlmConfig = { provider: string; key: string; base: string; model: string }

function resolveLlmConfig(): LlmConfig | null {
  const compatKey = process.env.LLM_API_KEY?.trim()
  const compatBase = process.env.LLM_BASE_URL?.trim()
  if (compatKey && compatBase) {
    return {
      provider: 'openai-compatible',
      key: compatKey,
      base: compatBase.replace(/\/$/, ''),
      model: process.env.LLM_MODEL || 'default',
    }
  }
  const xai = process.env.XAI_API_KEY?.trim()
  if (xai) {
    return {
      provider: 'xai',
      key: xai,
      base: (process.env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, ''),
      model: process.env.XAI_MODEL || 'grok-3-mini',
    }
  }
  const oai = process.env.OPENAI_API_KEY?.trim()
  if (oai) {
    return {
      provider: 'openai',
      key: oai,
      base: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    }
  }
  return null
}

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ_PAGE = 'https://nelf.gov.ng/faq'

type ChatMsg = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
  tool_calls?: unknown
}

type Body = {
  messages?: { role: 'user' | 'assistant'; content?: string; text?: string }[]
  question?: string
  text?: string
  message?: string
  userText?: string
  institutionName?: string | null
  ocrText?: string | null
  slots?: { institutionName?: string | null; problemSummary?: string | null; exactError?: string | null; objective?: string | null; phase?: string | null } | null
}

function lastUserText(messages: { role: string; content?: string; text?: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const m = messages[i]
      return (m.content || m.text || '').trim()
    }
  }
  return ''
}

const LIVE_ONLY = /is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|closed)|deadline|as\s+of\s+today|still\s+accept|can\s+i\s+still\s+apply|closing\s+date|opening\s+date|loan\s*window/i
const PENDING_RE = /\bpending\b|under\s*review|check\s*(my\s*)?(application\s*)?status|how\s*far|money\s*never\s*enter|una\s*(never|don)\s*pay|e\s*never\s*(drop|pay|enter|show)|dem\s*never\s*(approve|pay)|when\s*(dem|they)\s*(go|will)\s*pay|no\s*alert|i\s*don\s*(submit|apply)/i
const JAMB_RE = /invalid\s*jamb|jamb.*(invalid|fail|verif|format)|jamb\s*no\s*(gree|work)|utme\s*(number|verif)|jamb\s*number|my\s*jamb/i
const APPLY_RE = /how\s*(do\s*i|to)\s*apply|i\s*wan\s*apply|step\s*by\s*step|sign\s*up|create\s*(an?\s*)?account/i
const OVERVIEW_RE =
  /how\s+(does\s+)?(nelfund|it|this|the\s+loan|dis)\s+work|how\s+nelfund\s+works|how\s+does\s+this\s+nelfund|how\s+(does\s+)?(this|dis)\s+nelfund\s+(thing|stuff|matter|loan)?\s*work|nelfund\s+(thing|stuff)\s+work|go\s*through\s+(of\s+)?(the\s+)?(whole\s+)?nelfund|whole\s+nelfund\s+(stuff|thing|process|system)|everything\s+(on|about|on\s+how)\s+(how\s+)?nelfund|full\s+(guide|overview|explanation|walk\s*through|walkthrough)|explain\s+(how\s+)?nelfund|overview\s+(of\s+)?nelfund|walk\s*me\s+through\s+(nelfund|the\s+loan)|brief\s+(on|about)\s+nelfund|how\s+the\s+(scheme|loan)\s+works/i
const TERM_CHARGES_RE = /institutional\s*charg|institution\s*charg|school\s*charg|what\s+do\s+(u|you)\s+mean\s+by\s+institutional/i
const LOGIN_RE = /how\s+do\s+i\s+log\s*in|how\s+to\s+log\s*in|how\s+i\s+go\s+login|how\s+to\s+sign\s*in|log\s*in\s+to\s+nelfund/i
const APPLY_UPKEEP_FOLLOW_RE = /meant\s+for\s+the\s+loan|loan\s+and\s+upkeep|apply\s+for\s+(the\s+)?(loan|upkeep)/i
const MISSING_RE = /missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found|school\s*no\s*(dey|gree)\s*show|dem\s*never\s*upload/i
const PURPOSE_LIVE =
  /what\s*(is|are)\s*(the\s+)?(purpose|aim|point|goal|meaning|reason|use).{0,40}(nelfund|loan|scheme)|what\s*is\s*(this\s+)?nelfund|wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan|scheme)|why\s+.{0,48}(nelfund|this\s+loan|dis\s+loan|scheme).{0,24}(creat|establish|start|form|set\s*up|bring|make|exist)|why\s+(dem|they|una|fg|government|e).{0,24}(create|make|start|bring|form|introduce|set\s*up)|why\s+nelfund|purpose\s+of\s+(nelfund|the\s+(student\s+)?loan)|nelfund\s+(purpose|mission|aim|meaning|stand\s+for)|who\s+(created|established|started|signed|bring|start)\s+nelfund|wetin\s+be\s+(nelfund|dis\s+loan)|all\s+about\s+nelfund|tell\s+me\s+about\s+nelfund|explain\s+nelfund/i

function purposePlaybook(): string {
  return `**Why NELFUND was created:** to remove financial barriers so eligible students in **public** tertiary institutions can access higher education without paying school charges upfront.\n\n**What it is:** the Nigeria Education Loan Fund: **interest-free** loans for **institutional charges** (paid to the school) and optional **monthly upkeep** (paid to the student), under the Students Loans (Access to Higher Education) Act.\n\nIt is a **loan**, not a scholarship. Official FAQ: repayment starts **2 years after NYSC** (10% of salary / profit).\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ_PAGE}`
}
function pendingPlaybook(): string {
  return `**Pending / under review / money never enter** is not a rejection.\n\nWhat to do:\n1. Open ${PORTAL} and note the exact status word (Pending, Under review, Approved, Declined).\n2. Confirm your school has uploaded your data.\n3. School-level upkeep can lag after NELFUND pays the institution. Check the portal first, then your school NELFUND desk.\n4. If it stays pending a long time, ticket: ${ESUPPORT}\n\nI cannot see your personal file and I will not invent a pay date.`
}
function jambPlaybook(): string {
  return `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile (no extra spaces or letters).\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. If the portal says *invalid JAMB number format*, fix the number and retry. Do not create a second account.\n4. Still failing? Ticket: ${ESUPPORT} and keep a screenshot.\n\nPortal: ${PORTAL}`
}
function applyPlaybook(): string {
  return `**Apply**\n1. Create account: ${PORTAL}\n2. Complete profile (NIN, BVN, JAMB, admission / matric).\n3. Submit **institutional charges** and, if you need it, **upkeep** in the same session.\n4. Track status on the portal.\n\nLogin for an existing account is ${SITE}, not the same as sign-up.`
}
function overviewPlaybook(): string {
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
function chargesTermPlaybook(): string {
  return (
    `**Institutional charges** means the school fees / official charges your school bills for your programme.\n\n` +
    `- That part of the NELFUND loan is paid **to the school**, not into your personal account.\n` +
    `- **Upkeep** (if you request it) is separate living support paid **to you**.\n` +
    `- Exact amounts depend on your school — I will not invent a figure. Confirm on ${PORTAL}.\n\n` +
    `Official site: ${SITE}`
  )
}
function loginPlaybook(): string {
  return (
    `**How to log in to NELFUND**\n\n` +
    `1. Open ${PORTAL} and use **Sign in** with the email you registered.\n` +
    `2. You can also sign in from ${SITE}.\n` +
    `3. If that email was used before (including last year), do **not** create a new account — sign in or reset password on the same email.\n` +
    `4. First time only: create account at ${PORTAL}.\n` +
    `5. Forgot password: use reset on ${PORTAL} or ${SITE}. Tickets: ${ESUPPORT}.`
  )
}
function applyLoanUpkeepPlaybook(): string {
  return (
    `**How to apply for the loan (school charges) and upkeep**\n\n` +
    `1. Confirm your school is listed and your record is uploaded.\n` +
    `2. Sign in at ${PORTAL} with the same email (do not open a second account).\n` +
    `3. Complete profile: JAMB, NIN, BVN, and a bank account **in your name**.\n` +
    `4. When the official loan window is open, use **Request for Student Loan**.\n` +
    `5. **Institutional charges** (school fees) go to the school. Tick **upkeep** in the same session if you want living support — it goes to your bank account.\n` +
    `6. I will not invent open dates or amounts. Confirm the window on ${PORTAL} and ${SITE}.`
  )
}
function missingPlaybook(): string {
  return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND's public-institution list.\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}`
}
function helpMenu(): string {
  return `I can still help with NELFUND without inventing dates.\n\n• Purpose / what it is\n• How to apply: ${PORTAL}\n• Login: ${SITE}\n• Pending / JAMB / missing school\n• Support: ${ESUPPORT}\n\nAsk in English or Pidgin. Official pages only.`
}

function isPurposeHit(latestUser: string): boolean {
  if (!latestUser.trim()) return false
  if (LIVE_ONLY.test(latestUser) && !/why|purpose|wetin|what\s*is|meaning|created|create|exist|aim/i.test(latestUser)) {
    return false
  }
  const compact = latestUser.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const phrases = [
    'why was nelfund created',
    'why dem create nelfund',
    'wetin be nelfund',
    'what is nelfund',
    'why they create nelfund',
    'nelfund stand for',
    'who start nelfund',
    'na wetin be nelfund',
    'tell me about nelfund',
    'explain nelfund',
    'nelfund meaning',
  ]
  if (phrases.some((p) => compact.includes(p))) return true
  return PURPOSE_LIVE.test(latestUser)
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

  const incoming = Array.isArray(body.messages) ? body.messages.slice(-16) : []
  const looseQ = (body.question || body.text || body.message || body.userText || '').trim()
  if (!incoming.length && looseQ) incoming.push({ role: 'user', content: looseQ })
  if (!incoming.length) return res.status(400).json({ error: 'messages required' })

  const latestUser = lastUserText(incoming) || looseQ
  const purposeHit = isPurposeHit(latestUser)
  if (TERM_CHARGES_RE.test(latestUser) && /mean|wetin|what|define|chargers?/i.test(latestUser)) {
    return res.status(200).json({ reply: chargesTermPlaybook(), mode: 'llm-agent', provider: 'playbook-term-charges', latencyMs: 0, intent: 'institutional-charges' })
  }
  if (OVERVIEW_RE.test(latestUser)) {
    return res.status(200).json({ reply: overviewPlaybook(), mode: 'llm-agent', provider: 'playbook-overview', latencyMs: 0, intent: 'what-is-nelfund' })
  }
  if (LOGIN_RE.test(latestUser) && !APPLY_RE.test(latestUser)) {
    return res.status(200).json({ reply: loginPlaybook(), mode: 'llm-agent', provider: 'playbook-login', latencyMs: 0, intent: 'portal-login' })
  }
  if (APPLY_UPKEEP_FOLLOW_RE.test(latestUser)) {
    return res.status(200).json({ reply: applyLoanUpkeepPlaybook(), mode: 'llm-agent', provider: 'playbook-apply-upkeep', latencyMs: 0, intent: 'how-to-apply' })
  }
  if (purposeHit) {
    return res.status(200).json({ reply: purposePlaybook(), mode: 'llm-agent', provider: 'playbook-purpose', latencyMs: 0, intent: 'what-is-nelfund' })
  }
  if (LIVE_ONLY.test(latestUser) && !purposeHit) {
    return res.status(200).json({
      reply: `For **live** open/closed and dates, confirm on ${PORTAL} and ${SITE}.\n\nI will not invent a closing date. Account creation and loan/upkeep windows are different.\n\n• Sign **up**: ${PORTAL}\n• Sign **in**: ${SITE}\n• Support: ${ESUPPORT}`,
      mode: 'llm-agent',
      provider: 'playbook-open',
      latencyMs: 0,
      intent: 'current-information',
    })
  }
  if (JAMB_RE.test(latestUser)) {
    return res.status(200).json({ reply: jambPlaybook(), mode: 'llm-agent', provider: 'playbook-jamb', latencyMs: 0, intent: 'jamb-verification' })
  }
  if (MISSING_RE.test(latestUser)) {
    return res.status(200).json({ reply: missingPlaybook(), mode: 'llm-agent', provider: 'playbook-missing', latencyMs: 0, intent: 'missing-information' })
  }
  if (PENDING_RE.test(latestUser) && !LIVE_ONLY.test(latestUser)) {
    return res.status(200).json({ reply: pendingPlaybook(), mode: 'llm-agent', provider: 'playbook-pending', latencyMs: 0, intent: 'pending-application' })
  }
  if (APPLY_RE.test(latestUser) && !/\blogin\b|sign\s*in/i.test(latestUser)) {
    return res.status(200).json({ reply: applyPlaybook(), mode: 'llm-agent', provider: 'playbook-apply', latencyMs: 0, intent: 'how-to-apply' })
  }
  if (/school\s*fees|institutional\s*charges|tuition/.test(latestUser) && /\bupkeep\b|monthly\s*allowance|stipend/.test(latestUser)) {
    return res.status(200).json({
      reply: `**School fees vs upkeep** (two different things)\n\n• **Institutional charges / school fees:** paid **to your school**, not your personal account.\n• **Upkeep:** monthly living allowance paid **to you**, if you applied for it.\n\nOfficial FAQ: apply for **both** at registration. Amounts and pay dates only on ${PORTAL} / ${SITE}. FAQ: ${FAQ_PAGE}`,
      mode: 'llm-agent',
      provider: 'playbook-fees-upkeep',
      latencyMs: 0,
      intent: 'school-fees',
    })
  }
  if (/(\blogin\b|log\s*in|sign\s*in)/i.test(latestUser) && /sign\s*up|create\s*(an?\s*)?account|register/i.test(latestUser)) {
    return res.status(200).json({
      reply: `**Login / sign in:** ${SITE}\n**New account / apply:** ${PORTAL}\n\nThose are different pages. Sign up creates the account; login opens an existing one; submitting a loan is a later step after profile.`,
      mode: 'llm-agent',
      provider: 'playbook-login-signup',
      latencyMs: 0,
      intent: 'portal-login',
    })
  }

  const cfg = resolveLlmConfig()
  if (!cfg) {
    return res.status(200).json({ reply: helpMenu(), mode: 'llm-agent', provider: 'playbook-unconfigured', latencyMs: 0, intent: 'official-sources' })
  }

  const messages: ChatMsg[] = [
    {
      role: 'system',
      content: `You are NELFUND AI. Do not invent deadlines, amounts, or personal status. Official portal ${PORTAL}, site ${SITE}, tickets ${ESUPPORT}. Purpose questions are loans not status. Match Pidgin if used.`,
    },
    ...incoming.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content || m.text || '' })),
  ]

  try {
    const started = Date.now()
    const r = await fetch(`${cfg.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.3 }),
    })
    const data = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] }
    const reply = (data.choices?.[0]?.message?.content || '').trim()
    if (!r.ok || !reply) {
      return res.status(200).json({ reply: helpMenu(), mode: 'llm-agent', provider: 'playbook-llm-fallback', latencyMs: Date.now() - started, intent: 'official-sources' })
    }
    return res.status(200).json({ reply, mode: 'llm-agent', provider: cfg.provider, latencyMs: Date.now() - started })
  } catch {
    return res.status(200).json({ reply: helpMenu(), mode: 'llm-agent', provider: 'playbook-catch', latencyMs: 0, intent: 'official-sources' })
  }
}
