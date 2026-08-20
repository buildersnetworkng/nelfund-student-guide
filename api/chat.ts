/**
 * NELFUND Student Guide — conversational AI agent endpoint.
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
  messages?: { role: 'user' | 'assistant'; content: string }[]
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

  return `You are NELFUND AI — a digital student-support agent for Nigerian tertiary students (universities, polytechnics, colleges of education nationwide).

You are NOT a FAQ search engine. You are a support agent that understands goals, remembers context, uses tools for evidence, and completes tasks.

## Operating model
1. Infer what the student is trying to accomplish (not only keywords).
2. Use conversation history and known slots — never re-ask facts already given.
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
      description: 'Summarize current application window guidance (no invented dates)',
      parameters: { type: 'object', properties: {} },
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
    return `Account creation may be available on ${PORTAL}. Loan/upkeep application windows open and close by cycle — confirm only on ${SITE} and ${PORTAL}. This assistant does not invent deadlines.`
  }
  return 'Unknown tool'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const cfg = resolveLlmConfig()
  if (!cfg) {
    return res.status(503).json({
      error: 'agent_unconfigured',
      message:
        'No model provider configured. Set XAI_API_KEY, OPENAI_API_KEY, or LLM_API_KEY+LLM_BASE_URL on Vercel.',
      fallback: true,
    })
  }

  let body: Body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const incoming = Array.isArray(body.messages) ? body.messages.slice(-16) : []
  if (!incoming.length) return res.status(400).json({ error: 'messages required' })

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
      content: m.content,
    })),
  ]

  try {
    const started = Date.now()
    let reply = ''
    for (let round = 0; round < 3; round++) {
      const r = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: 0.3,
          tools: TOOLS,
          tool_choice: 'auto',
        }),
      })
      const data = (await r.json().catch(() => ({}))) as {
        choices?: {
          message?: {
            content?: string
            tool_calls?: { id: string; function: { name: string; arguments: string } }[]
          }
        }[]
        error?: { message?: string }
      }
      if (!r.ok) {
        return res.status(502).json({
          error: 'llm_error',
          message: data?.error?.message || `provider_${r.status}`,
          fallback: true,
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
      return res.status(502).json({ error: 'empty', message: 'empty_llm_reply', fallback: true })
    }
    return res.status(200).json({
      reply,
      mode: 'llm-agent',
      provider: cfg.provider,
      latencyMs: Date.now() - started,
    })
  } catch (e) {
    return res.status(502).json({
      error: 'llm_error',
      message: e instanceof Error ? e.message : 'network',
      fallback: true,
    })
  }
}
