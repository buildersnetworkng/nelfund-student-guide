/**
 * NELFUND Student Guide — conversational AI agent endpoint.
 * LLM reasons → tools → natural reply.
 * Knowledge is EVIDENCE. Provider is swappable via env.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { join } from 'path'
import { resolveLlmConfig } from './_lib/llmProvider'

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

function loadJson<T>(rel: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', rel), 'utf8')) as T
  } catch {
    try {
      return JSON.parse(readFileSync(join(process.cwd(), 'data', rel), 'utf8')) as T
    } catch {
      return fallback
    }
  }
}

function scoreMatch(q: string, text: string): number {
  const tokens = q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
  const hay = text.toLowerCase()
  let s = 0
  for (const t of tokens) if (hay.includes(t)) s += 1
  return s
}

function searchKnowledge(query: string): string {
  const faqs = loadJson<Array<{ id: string; title: string; content: string; verification_status?: string }>>(
    'faq.json',
    [],
  )
  const facts = loadJson<Array<{ id: string; title: string; content: string; verification_status?: string }>>(
    'nelfund.json',
    [],
  )
  const tbs = loadJson<
    Array<{ id: string; problem: string; what_it_usually_means?: string; what_to_do?: string[] }>
  >('troubleshooting.json', [])

  const scored: { score: number; block: string }[] = []
  for (const f of faqs) {
    const score = scoreMatch(query, `${f.title} ${f.content}`)
    if (score >= 1) {
      scored.push({
        score,
        block: `[FAQ ${f.id} | ${f.verification_status || 'unknown'} | evidence]\n${f.title}\n${f.content}`,
      })
    }
  }
  for (const f of facts) {
    const score = scoreMatch(query, `${f.title} ${f.content}`)
    if (score >= 1) {
      scored.push({
        score: score + 0.5,
        block: `[FACT ${f.id} | ${f.verification_status || 'unknown'} | evidence]\n${f.title}\n${f.content}`,
      })
    }
  }
  for (const t of tbs) {
    const score = scoreMatch(query, `${t.problem} ${t.what_it_usually_means || ''}`)
    if (score >= 1) {
      const steps = (t.what_to_do || []).slice(0, 4).map((s, i) => `${i + 1}. ${s}`).join('\n')
      scored.push({
        score: score + 0.3,
        block: `[TROUBLESHOOT ${t.id} | evidence]\n${t.problem}\n${t.what_it_usually_means || ''}\n${steps}`,
      })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 5).map((x) => x.block)
  if (!top.length) {
    return (
      'No strongly matching verified knowledge entry. ' +
      'You may still reason, clarify, draft, or use fetch_official_page / get_current_status / get_institution_guidance. ' +
      'Do not invent NELFUND policy or contacts.'
    )
  }
  return top.join('\n\n---\n\n')
}

function getCurrentStatus(): string {
  const status = loadJson<Record<string, unknown>>('application-status.json', {})
  return JSON.stringify(
    {
      evidence_type: 'curated_snapshot',
      ...status,
      official_portal: PORTAL,
      official_site: SITE,
      instruction:
        'This is a curated snapshot, not live portal state. For "is it open now", also fetch_official_page on portal/site and state uncertainty clearly.',
      checked_note: status.last_checked || status.as_of || null,
    },
    null,
    2,
  )
}

function getNelfundSupport(): string {
  return JSON.stringify(
    {
      ticket_portal: ESUPPORT,
      client_support_email: 'clientsupport@nelf.gov.ng',
      application_portal: PORTAL,
      website: SITE,
      notes: 'Prefer eSupport for tracked tickets. Never ask for passwords, OTP, or PIN.',
    },
    null,
    2,
  )
}

function getInstitutionGuidance(nameOrId: string): string {
  const institutions = loadJson<
    Array<{ id: string; name: string; short_name?: string; official_website?: string | null }>
  >('institutions.json', [])
  const q = nameOrId.toLowerCase().trim()
  const inst =
    institutions.find((i) => i.id === q) ||
    institutions.find((i) => i.name.toLowerCase() === q) ||
    institutions.find((i) => (i.short_name || '').toLowerCase() === q) ||
    institutions.find((i) => i.name.toLowerCase().includes(q) || q.includes(i.id))

  if (!inst) {
    return JSON.stringify({
      found: false,
      message:
        'Institution not in curated directory. Ask for full official name. Do not invent emails. Student can use school website + NELFUND eSupport.',
      nelfund_support: ESUPPORT,
    })
  }

  const contactsFile = loadJson<{
    institutions?: {
      institution_id: string
      contacts: Array<{ label: string; email?: string | null; url?: string | null; office?: string }>
    }[]
  }>('institution-contacts.json', {})
  const row = contactsFile.institutions?.find((r) => r.institution_id === inst.id)
  const curated = row?.contacts || []

  return JSON.stringify(
    {
      found: true,
      id: inst.id,
      name: inst.name,
      official_website: inst.official_website || null,
      curated_contacts: curated.map((c) => ({
        label: c.label,
        office: c.office,
        email: c.email || null,
        url: c.url || inst.official_website || null,
      })),
      guidance:
        curated.length === 0
          ? 'No dedicated email stored. Point to official_website only. Never invent an email address.'
          : 'Use only listed contacts. Prefer official website confirmation.',
      nelfund_support: ESUPPORT,
    },
    null,
    2,
  )
}

async function fetchOfficialPage(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'Invalid URL'
  }
  if (!ALLOWED_FETCH_HOSTS.has(parsed.hostname)) {
    return `Host not allowed for automated fetch. Only: ${[...ALLOWED_FETCH_HOSTS].join(', ')}. You may still tell the student to open their institution website manually.`
  }
  try {
    const res = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'NELFUND-Student-Guide-Agent/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)
    return `URL: ${parsed.toString()}\nHTTP ${res.status}\nRetrieved_at: ${new Date().toISOString()}\nContent excerpt:\n${stripped}`
  } catch (e) {
    return `Fetch failed: ${e instanceof Error ? e.message : 'unknown'}. Student should check ${parsed.toString()} directly.`
  }
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_verified_knowledge',
      description:
        'Search local verified NELFUND evidence (FAQ/facts/troubleshooting). Use for policy/process explanations. NOT sufficient alone for "is it open today".',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_official_page',
      description: 'Fetch text from official NELFUND hosts only (nelf.gov.ng, portal, esupport). Use for current announcements/status.',
      parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_status',
      description: 'Curated application-window snapshot + timestamps. Pair with fetch_official_page when student asks if open now.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_institution_guidance',
      description: 'Look up institution in directory + curated contacts. Never invent emails not returned.',
      parameters: {
        type: 'object',
        properties: { institution: { type: 'string' } },
        required: ['institution'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_nelfund_support',
      description: 'Official NELFUND support channels (eSupport, portal, site).',
      parameters: { type: 'object', properties: {} },
    },
  },
]

async function runTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case 'search_verified_knowledge':
      return searchKnowledge(args.query || '')
    case 'fetch_official_page':
      return fetchOfficialPage(args.url || FAQ_PAGE)
    case 'get_current_status':
      return getCurrentStatus()
    case 'get_institution_guidance':
      return getInstitutionGuidance(args.institution || '')
    case 'get_nelfund_support':
      return getNelfundSupport()
    default:
      return `Unknown tool: ${name}`
  }
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

Keep responses proportional. End with one clear next step when helpful. Avoid repeating the same three links every turn.`
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

  const institutionName =
    body.institutionName || body.slots?.institutionName || null

  const messages: ChatMsg[] = [
    {
      role: 'system',
      content: systemPrompt({
        institutionName,
        ocrText: body.ocrText,
        slots: body.slots || {
          institutionId: body.institutionId,
          institutionName,
        },
      }),
    },
    ...incoming.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  try {
    let finalText = ''
    const toolsUsed: string[] = []
    const started = Date.now()

    for (let round = 0; round < 5; round++) {
      const resp = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.35,
        }),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        console.error('[api/chat] LLM error', cfg.provider, resp.status, errText)
        return res.status(502).json({
          error: 'llm_error',
          detail: errText.slice(0, 500),
          provider: cfg.provider,
          fallback: true,
        })
      }

      const data = (await resp.json()) as {
        choices?: {
          message?: {
            content?: string | null
            tool_calls?: { id: string; function: { name: string; arguments: string } }[]
          }
        }[]
      }

      const msg = data.choices?.[0]?.message
      if (!msg) return res.status(502).json({ error: 'empty_llm', fallback: true })

      const toolCalls = msg.tool_calls || []
      if (toolCalls.length > 0) {
        messages.push({ role: 'assistant', content: msg.content || '', tool_calls: toolCalls })
        for (const tc of toolCalls) {
          let args: Record<string, string> = {}
          try {
            args = JSON.parse(tc.function.arguments || '{}')
          } catch {
            args = {}
          }
          toolsUsed.push(tc.function.name)
          const result = await runTool(tc.function.name, args)
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: result,
          })
        }
        continue
      }

      finalText = (msg.content || '').trim()
      break
    }

    if (!finalText) {
      finalText =
        'I could not complete that response. Please try again, or check https://portal.nelf.gov.ng/'
    }

    return res.status(200).json({
      reply: finalText,
      toolsUsed,
      mode: 'llm-agent',
      provider: cfg.provider,
      model: cfg.model,
      latencyMs: Date.now() - started,
      official: { portal: PORTAL, site: SITE, esupport: ESUPPORT },
    })
  } catch (e) {
    console.error('[api/chat]', e)
    return res.status(500).json({
      error: 'server_error',
      message: e instanceof Error ? e.message : 'unknown',
      fallback: true,
    })
  }
}
