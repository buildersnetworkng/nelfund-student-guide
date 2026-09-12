/**
 * NELFUND Student Guide: conversational AI agent endpoint.
 * LLM reasons → tools → natural reply.
 * Knowledge is EVIDENCE. Provider is swappable via env.
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

const ALLOWED_FETCH_HOSTS = new Set([
  'nelf.gov.ng',
  'www.nelf.gov.ng',
  'portal.nelf.gov.ng',
  'nelfund.esupport.ng',
  'www.nelfund.esupport.ng',
])

type ChatMsg = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
  tool_calls?: unknown
}

type SlotPayload = {
  institutionId?: string | null
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  objective?: string | null
  phase?: string | null
}

type Body = {
  messages?: { role: 'user' | 'assistant'; content?: string; text?: string }[]
  question?: string
  text?: string
  institutionId?: string | null
  institutionName?: string | null
  ocrText?: string | null
  slots?: SlotPayload | null
}

function systemPrompt(ctx: {
  institutionName?: string | null
  ocrText?: string | null
  slots?: SlotPayload | null
}): string {
  const slots = ctx.slots || {}
  const inst = ctx.institutionName || slots.institutionName || null
  const problem = slots.problemSummary || slots.exactError || null
  const objective = slots.objective || null

  return `You are NELFUND AI, a digital student-support agent for Nigerian tertiary students (universities, polytechnics, colleges of education nationwide).

You are NOT a FAQ search engine. You are a support agent that understands goals, remembers context, uses tools for evidence, and completes tasks.

## Operating model
1. Infer what the student is trying to accomplish (not only keywords).
2. Use conversation history and known slots. Never re-ask facts already given.
3. If one high-value fact is missing (e.g. institution for contact/draft), ask ONE short question.
4. Call tools when you need verified policy, current official pages, contacts, or support routes.
5. Reason over tool results; distinguish curated evidence vs live fetch vs uncertainty.
6. Prefer short natural replies. Match Pidgin if the student uses Pidgin.
7. Do the task: draft emails when asked; give contacts when asked; check current status when asked.

## Task patterns
- Missing information / portal error: clarify institution if unknown; explain carefully; offer draft/contact; do not dump long generic articles.
- "Did my school upload data?": explain students cannot see a private upload log; describe portal signals; suggest school ICT/Registry + NELFUND support if school insists upload is done.
- Current / open / latest / today: use get_current_status and/or fetch_official_page; never claim certainty from memory alone.
- Email draft: write Subject + body with placeholders; do not substitute troubleshooting unless asked.
- Login / fill information: point to ${PORTAL}.
- Institution contact: get_institution_guidance; never invent emails.

## Hard boundaries
- Do not invent policies, deadlines, amounts, eligibility outcomes, or official emails.
- Do not invent the student's application status.
- Do not ask for passwords, OTP, PIN, or full BVN/NIN.
- If evidence is thin, say so and give the next useful step.

## Official anchors
- Portal: ${PORTAL}
- Website: ${SITE}
- Support tickets: ${ESUPPORT}
- FAQ: ${FAQ_PAGE}

## Known session context (trust these; do not re-ask)
- Institution: ${inst || 'not yet known'}
- Problem / portal message: ${problem || 'not yet known'}
- Objective: ${objective || 'not yet known'}
- Phase: ${slots.phase || 'open'}
${ctx.ocrText ? `- Screenshot OCR text:\n${ctx.ocrText.slice(0, 2000)}` : ''}

Keep responses proportional. End with one clear next step when helpful. Avoid repeating the same three links every turn.

## Critical routing (do not violate)
- If the student asks why NELFUND exists / what it is / wetin be NELFUND / why dem create am: answer PURPOSE first from official FAQ (zero-interest loans for institutional charges and optional upkeep so eligible students can access higher education). NEVER call get_current_status and NEVER describe loan-window open/closed.
- get_current_status is ONLY for "is it open / deadline / as of today / still accepting".
- Sign up, login, loan application, school fees, and upkeep are different tasks. Do not mix them.

## Critical conversation rules
- Treat each user message as a NEW request if it asks for different content (e.g. YouTube links, how to apply, upkeep, contacts). Never say "I already covered this" or "pick a different next action" when the student asked something new.
- When the student asks for a YouTube video, tutorial, or walkthrough on applying / upkeep / portal steps, include these clickable educational links in your reply:
  - How to apply: https://www.youtube.com/watch?v=XOhro3UuSDE
  - Upkeep selection: https://www.youtube.com/watch?v=bhj-Lb_1fT8
  Label them as educational (not official NELFUND). Always prefer the official portal ${PORTAL} for real actions.
- Stay on the student's latest topic. Use history for context, not to refuse a new question.
`
}

async function fetchOfficialPage(url: string): Promise<string> {
  try {
    const u = new URL(url)
    if (!ALLOWED_FETCH_HOSTS.has(u.hostname)) return 'Host not allowed.'
    const r = await fetch(url, { headers: { 'User-Agent': 'NELFUND-Student-Guide/1.0' } })
    const text = await r.text()
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000)
  } catch (e) {
    return `Fetch failed: ${e instanceof Error ? e.message : 'error'}`
  }
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'fetch_official_page',
      description: 'Fetch text from an official NELFUND page',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_status',
      description: 'ONLY for is-it-open / deadline / as-of-today. Never use for why NELFUND was created or what it is.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
]

async function runTool(name: string, argsJson: string): Promise<string> {
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(argsJson || '{}')
  } catch {
    args = {}
  }
  if (name === 'fetch_official_page') {
    return fetchOfficialPage(String(args.url || SITE))
  }
  if (name === 'get_current_status') {
    return `Account creation may be available on ${PORTAL}. Loan/upkeep application windows open and close by cycle. Confirm only on ${SITE} and ${PORTAL}. This assistant does not invent deadlines.`
  }
  return 'Unknown tool'
}

const PURPOSE_LIVE =
  /what\s*(is|are)\s*(the\s+)?(purpose|aim|point|goal|meaning|reason|use).{0,40}(nelfund|loan|scheme)|what\s*is\s*(this\s+)?nelfund|wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan|scheme)|why\s+.{0,48}(nelfund|this\s+loan|dis\s+loan|scheme).{0,24}(creat|establish|start|form|set\s*up|bring|make|exist)|why\s+(dem|they|una|fg|government|e).{0,24}(create|make|start|bring|form|introduce|set\s*up)|why\s+nelfund|purpose\s+of\s+(nelfund|the\s+(student\s+)?loan)|nelfund\s+(purpose|mission|aim|meaning|stand\s+for)|who\s+(created|established|started|signed|bring|start)\s+nelfund|how\s+come\s+.{0,28}(nelfund|this\s+loan)|reason\s+(for|behind)\s+.{0,24}nelfund|nelfund\s+for\s+wetin|nelfund\s+dey\s+for\s+wetin|student\s+loans?\s+act|wetin\s+be\s+(nelfund|dis\s+loan|the\s+point|the\s+use)|what\s+problem\s+.{0,20}nelfund|why\s+(this|dis)\s+(student\s+)?loan|wetin\s+una\s+dey\s+try\s+do|all\s+about\s+nelfund|what\s+is\s+nelfund\s+all\s+about|why\s+e\s+dey|why\s+e\s+exist/i
const LIVE_ONLY = /is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|closed)|deadline|as\s+of\s+today|still\s+accept|can\s+i\s+still\s+apply|closing\s+date|opening\s+date|loan\s*window/i

function lastUserText(messages: { role: string; content?: string; text?: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const m = messages[i]
      return (m.content || m.text || '').trim()
    }
  }
  return ''
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

function missingPlaybook(): string {
  return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND's public-institution list.\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}`
}

const PENDING_RE = /\bpending\b|under\s*review|check\s*(my\s*)?(application\s*)?status|how\s*far\s*(with)?\s*(my\s*)?(loan|application)?|money\s*never\s*enter|una\s*never\s*pay|e\s*never\s*(drop|pay)|dem\s*never\s*(approve|pay)/i
const JAMB_RE = /invalid\s*jamb|jamb.*(invalid|fail|verif|format)|jamb\s*no\s*(gree|work)|utme\s*(number|verif)/i
const APPLY_RE = /how\s*(do\s*i|to)\s*apply|i\s*wan\s*apply|step\s*by\s*step|sign\s*up|create\s*(an?\s*)?account/i
const MISSING_RE = /missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found|school\s*no\s*(dey|gree)\s*show|dem\s*never\s*upload/i

function purposePlaybook(): string {
  return `**Why NELFUND was created:** to remove financial barriers so eligible students in **public** tertiary institutions can access higher education without paying school charges upfront.\n\n**What it is:** the Nigeria Education Loan Fund: **interest-free** loans for **institutional charges** (paid to the school) and optional **monthly upkeep** (paid to the student), under the Students Loans (Access to Higher Education) Act.\n\nIt is a **loan**, not a scholarship. Official FAQ: repayment starts **2 years after NYSC** (10% of salary / profit).\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ_PAGE}`
}

function isPurposeHit(latestUser: string): boolean {
  if (!latestUser.trim()) return false
  if (LIVE_ONLY.test(latestUser) && !/why|purpose|wetin|what\s*is|meaning|created|create|exist|aim/i.test(latestUser)) {
    return false
  }
  return (
    PURPOSE_LIVE.test(latestUser) ||
    /why\s+(was|is|dem|they|una|e).{0,40}nelfund|wetin\s+be\s+(this\s+)?nelfund|what\s+is\s+nelfund|why\s+dem\s+create|why\s+they\s+create/i.test(
      latestUser,
    )
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

  const incoming = Array.isArray(body.messages) ? body.messages.slice(-16) : []
  const looseQ = (body.question || body.text || '').trim()
  if (!incoming.length && looseQ) {
    incoming.push({ role: 'user', content: looseQ })
  }
  if (!incoming.length) return res.status(400).json({ error: 'messages required' })

  const latestUser = lastUserText(incoming) || looseQ
  const purposeHit = isPurposeHit(latestUser)
  if (purposeHit) {
    return res.status(200).json({
      reply: purposePlaybook(),
      mode: 'llm-agent',
      provider: 'playbook-purpose',
      latencyMs: 0,
      intent: 'what-is-nelfund',
    })
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
    return res.status(200).json({
      reply: jambPlaybook(),
      mode: 'llm-agent',
      provider: 'playbook-jamb',
      latencyMs: 0,
      intent: 'jamb-verification',
    })
  }
  if (MISSING_RE.test(latestUser)) {
    return res.status(200).json({
      reply: missingPlaybook(),
      mode: 'llm-agent',
      provider: 'playbook-missing',
      latencyMs: 0,
      intent: 'missing-information',
    })
  }
  if (PENDING_RE.test(latestUser) && !LIVE_ONLY.test(latestUser)) {
    return res.status(200).json({
      reply: pendingPlaybook(),
      mode: 'llm-agent',
      provider: 'playbook-pending',
      latencyMs: 0,
      intent: 'pending-application',
    })
  }
  if (APPLY_RE.test(latestUser) && !/\blogin\b|sign\s*in/i.test(latestUser)) {
    return res.status(200).json({
      reply: applyPlaybook(),
      mode: 'llm-agent',
      provider: 'playbook-apply',
      latencyMs: 0,
      intent: 'how-to-apply',
    })
  }

  const cfg = resolveLlmConfig()
  if (!cfg) {
    return res.status(503).json({
      error: 'agent_unconfigured',
      message:
        'No model provider configured. Set XAI_API_KEY, OPENAI_API_KEY, or LLM_API_KEY+LLM_BASE_URL on Vercel.',
      fallback: true,
    })
  }

  const institutionName = body.institutionName || body.slots?.institutionName || null

  const messages: ChatMsg[] = [
    {
      role: 'system',
      content: systemPrompt({
        institutionName,
        ocrText: body.ocrText,
        slots: body.slots,
      }),
    },
    ...incoming.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content || m.text || '',
    })),
  ]

  try {
    const started = Date.now()
    let reply = ''
    for (let round = 0; round < 3; round++) {
      const bodyWithTools = {
        model: cfg.model,
        messages,
        temperature: 0.3,
        tools: TOOLS,
        tool_choice: 'auto' as const,
      }
      const bodyPlain = {
        model: cfg.model,
        messages,
        temperature: 0.3,
      }
      let r = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify(round === 0 ? bodyWithTools : bodyPlain),
      })
      let data = (await r.json().catch(() => ({}))) as {
        choices?: {
          message?: {
            content?: string
            tool_calls?: { id: string; function: { name: string; arguments: string } }[]
          }
        }[]
        error?: { message?: string }
      }
      if (!r.ok && round === 0) {
        r = await fetch(`${cfg.base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.key}`,
          },
          body: JSON.stringify(bodyPlain),
        })
        data = (await r.json().catch(() => ({}))) as typeof data
      }
      if (!r.ok) {
        return res.status(200).json({
          reply: `I can still help with NELFUND without inventing dates.\n\n• Purpose / what it is\n• How to apply: ${PORTAL}\n• Login: ${SITE}\n• Pending / JAMB / missing school\n• Support: ${ESUPPORT}\n\nAsk in English or Pidgin. Official pages only.`,
          mode: 'llm-agent',
          provider: 'playbook-llm-fallback',
          latencyMs: Date.now() - started,
        })
      }
      const msg = data.choices?.[0]?.message
      const toolCalls = msg?.tool_calls || []
      if (toolCalls.length) {
        messages.push({
          role: 'assistant',
          content: msg?.content || '',
          tool_calls: toolCalls,
        })
        for (const tc of toolCalls) {
          const result = await runTool(tc.function.name, tc.function.arguments)
          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: tc.id,
            name: tc.function.name,
          })
        }
        continue
      }
      reply = (msg?.content || '').trim()
      break
    }
    if (!reply) {
      return res.status(200).json({
        reply: `I can still help with NELFUND. Ask purpose, apply, login, pending, JAMB, or missing school.\nPortal: ${PORTAL} · Site: ${SITE} · Ticket: ${ESUPPORT}`,
        mode: 'llm-agent',
        provider: 'playbook-empty-llm',
        latencyMs: Date.now() - started,
      })
    }
    return res.status(200).json({
      reply,
      mode: 'llm-agent',
      provider: cfg.provider,
      latencyMs: Date.now() - started,
    })
  } catch {
    return res.status(200).json({
      reply: `I can still help with NELFUND without inventing dates.\nPortal: ${PORTAL} · Site: ${SITE} · Ticket: ${ESUPPORT}`,
      mode: 'llm-agent',
      provider: 'playbook-catch',
      latencyMs: 0,
    })
  }
}
