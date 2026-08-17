/**
 * NELFUND Student Guide — conversational AI agent endpoint.
 * LLM reasons → tools (knowledge / official web / contacts) → natural reply.
 * Knowledge base is EVIDENCE, not the brain.
 * Requires XAI_API_KEY or OPENAI_API_KEY in Vercel env.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { join } from 'path'

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

type Body = {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  institutionId?: string | null
  institutionName?: string | null
  ocrText?: string | null
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
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2)
  const hay = text.toLowerCase()
  let s = 0
  for (const t of tokens) if (hay.includes(t)) s += 1
  return s
}

function searchKnowledge(query: string): string {
  const faqs = loadJson<Array<{ id: string; title: string; content: string; verification_status?: string }>>('faq.json', [])
  const facts = loadJson<Array<{ id: string; title: string; content: string; verification_status?: string }>>('nelfund.json', [])
  const tbs = loadJson<
    Array<{ id: string; problem: string; what_it_usually_means?: string; what_to_do?: string[] }>
  >('troubleshooting.json', [])

  const scored: { score: number; block: string }[] = []
  for (const f of faqs) {
    const score = scoreMatch(query, `${f.title} ${f.content}`)
    if (score >= 1) {
      scored.push({ score, block: `[FAQ ${f.id} | ${f.verification_status || 'unknown'}]\n${f.title}\n${f.content}` })
    }
  }
  for (const f of facts) {
    const score = scoreMatch(query, `${f.title} ${f.content}`)
    if (score >= 1) {
      scored.push({ score: score + 0.5, block: `[FACT ${f.id} | ${f.verification_status || 'unknown'}]\n${f.title}\n${f.content}` })
    }
  }
  for (const t of tbs) {
    const score = scoreMatch(query, `${t.problem} ${t.what_it_usually_means || ''}`)
    if (score >= 1) {
      const steps = (t.what_to_do || []).slice(0, 4).map((s, i) => `${i + 1}. ${s}`).join('\n')
      scored.push({ score: score + 0.3, block: `[TROUBLESHOOT ${t.id}]\n${t.problem}\n${t.what_it_usually_means || ''}\n${steps}` })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 5).map((x) => x.block)
  if (!top.length) {
    return 'No strongly matching verified knowledge. Use fetch_official_page or get_current_status. You may reason and clarify — do not invent NELFUND policy.'
  }
  return top.join('\n\n---\n\n')
}

function getCurrentStatus(): string {
  const status = loadJson<Record<string, unknown>>('application-status.json', {})
  return JSON.stringify(
    {
      ...status,
      official_portal: PORTAL,
      official_site: SITE,
      instruction: 'Curated snapshot only. Confirm live openness on the official portal.',
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
  const institutions = loadJson<Array<{ id: string; name: string; short_name?: string; official_website?: string | null }>>(
    'institutions.json',
    [],
  )
  const q = nameOrId.toLowerCase().trim()
  const inst =
    institutions.find((i) => i.id === q) ||
    institutions.find((i) => i.name.toLowerCase() === q) ||
    institutions.find((i) => (i.short_name || '').toLowerCase() === q) ||
    institutions.find((i) => i.name.toLowerCase().includes(q) || q.includes(i.id))

  if (!inst) {
    return JSON.stringify({
      found: false,
      message: 'Institution not in directory. Ask for full official name. Do not invent emails.',
      nelfund_support: ESUPPORT,
    })
  }

  const contactsFile = loadJson<{
    institutions?: { institution_id: string; contacts: Array<{ label: string; email?: string | null; url?: string | null; office?: string }> }[]
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
          ? 'No dedicated email stored. Direct student to official website. Never invent an email.'
          : 'Use only listed contacts.',
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
    return `Host not allowed. Only: ${[...ALLOWED_FETCH_HOSTS].join(', ')}`
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
    return `URL: ${parsed.toString()}\nHTTP ${res.status}\nContent excerpt:\n${stripped}`
  } catch (e) {
    return `Fetch failed: ${e instanceof Error ? e.message : 'unknown'}. Check ${parsed.toString()} directly.`
  }
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_verified_knowledge',
      description: 'Search local verified NELFUND knowledge. Not a substitute for live status.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_official_page',
      description: 'Fetch text from official NELFUND URL (nelf.gov.ng, portal, esupport).',
      parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_status',
      description: 'Curated application-window snapshot. Confirm live on official site when asked if open.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_institution_guidance',
      description: 'Institution directory + curated contacts. Never invent emails not returned.',
      parameters: { type: 'object', properties: { institution: { type: 'string' } }, required: ['institution'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_nelfund_support',
      description: 'Official NELFUND support channels.',
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

function systemPrompt(ctx: { institutionName?: string | null; ocrText?: string | null }): string {
  return `You are the NELFUND Student Guide AI — a capable student-support agent for Nigerian tertiary students.

You reason, converse, research with tools, draft messages, and guide students. You are NOT a FAQ search box.

How you work:
1. Understand what the student is trying to do.
2. Use conversation context — do not re-ask information already given.
3. Call tools when you need verified facts, live official pages, contacts, or support links.
4. Reason over tool results and reply naturally and concisely (Pidgin OK if the student uses it).
5. Ask at most ONE useful clarifying question when required.
6. Prefer doing the task over dumping generic lists.

Hard boundaries:
- Do NOT invent NELFUND policies, deadlines, amounts, or official emails.
- Do NOT invent the student's application status.
- Do NOT present guesses as official fact.
- If unsure about current openness/deadlines, use get_current_status and/or fetch_official_page, state uncertainty, point to ${PORTAL} and ${SITE}.
- Never ask for passwords, OTP, PIN, or full BVN/NIN in chat.

Official anchors:
- Portal (login + apply): ${PORTAL}
- Website: ${SITE}
- Support tickets: ${ESUPPORT}
- FAQ: ${FAQ_PAGE}

Context:
${ctx.institutionName ? `Student institution: ${ctx.institutionName}` : 'Institution not yet known.'}
${ctx.ocrText ? `OCR/screenshot text:\n${ctx.ocrText.slice(0, 2000)}` : ''}

Keep answers proportional. End with one clear next step when helpful.`
}

function apiConfig(): { key: string; base: string; model: string } | null {
  const xai = process.env.XAI_API_KEY
  if (xai) {
    return { key: xai, base: process.env.XAI_BASE_URL || 'https://api.x.ai/v1', model: process.env.XAI_MODEL || 'grok-3-mini' }
  }
  const oai = process.env.OPENAI_API_KEY
  if (oai) {
    return { key: oai, base: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const cfg = apiConfig()
  if (!cfg) {
    return res.status(503).json({
      error: 'agent_unconfigured',
      message: 'Set XAI_API_KEY or OPENAI_API_KEY on Vercel to enable the LLM agent.',
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

  const messages: ChatMsg[] = [
    { role: 'system', content: systemPrompt({ institutionName: body.institutionName, ocrText: body.ocrText }) },
    ...incoming.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  try {
    let finalText = ''
    const toolsUsed: string[] = []

    for (let round = 0; round < 5; round++) {
      const resp = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.model, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.4 }),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        console.error('[api/chat] LLM error', resp.status, errText)
        return res.status(502).json({ error: 'llm_error', detail: errText.slice(0, 500), fallback: true })
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
          messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: result })
        }
        continue
      }

      finalText = (msg.content || '').trim()
      break
    }

    if (!finalText) {
      finalText = 'I could not complete that response. Please try again, or check https://portal.nelf.gov.ng/'
    }

    return res.status(200).json({
      reply: finalText,
      toolsUsed,
      mode: 'llm-agent',
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
