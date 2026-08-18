/**
 * Lightweight acceptance runner for the LLM agent.
 * POST { limit?: number } — runs novel scenarios against the same provider as /api/chat.
 * Does not store student data. Requires a valid model key.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Scenario = {
  id: string
  category: string
  turns: { role: 'user' | 'assistant'; content: string }[]
  expect: string[]
  failIfIncludes?: string[]
}

// Keep in sync with src/lib/ai/eval/scenarios.ts (server cannot import Vite src easily)
const SCENARIOS: Scenario[] = [
  {
    id: 'what-is-nelfund',
    category: 'factual',
    turns: [{ role: 'user', content: 'What is NELFUND?' }],
    expect: ['loan', 'student'],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'is-open',
    category: 'current',
    turns: [{ role: 'user', content: 'Is NELFUND currently open?' }],
    expect: ['portal'],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'lasu-contact',
    category: 'institution',
    turns: [
      {
        role: 'user',
        content: 'My school is LASU. I have missing information. How do I contact them?',
      },
    ],
    expect: ['lasu'],
    failIfIncludes: ['Browse our FAQ'],
  },
  {
    id: 'draft-email',
    category: 'draft',
    turns: [
      {
        role: 'user',
        content: 'My school is LASU. Draft an email about my NELFUND missing information issue.',
      },
    ],
    expect: ['subject'],
    failIfIncludes: ['WHAT THIS MEANS'],
  },
  {
    id: 'missing-clarify',
    category: 'troubleshoot',
    turns: [{ role: 'user', content: 'My portal says missing information.' }],
    expect: [],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'data-upload',
    category: 'novel',
    turns: [{ role: 'user', content: 'How do I know if my school uploaded my data?' }],
    expect: ['portal'],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'pidgin',
    category: 'pidgin',
    turns: [{ role: 'user', content: 'Abeg I no understand wetin NELFUND dey ask me for verification' }],
    expect: [],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'memory',
    category: 'multi-turn',
    turns: [
      { role: 'user', content: 'My school is LASU.' },
      { role: 'assistant', content: 'Got it — Lagos State University.' },
      { role: 'user', content: 'What should I do about missing information?' },
    ],
    expect: ['lasu'],
    failIfIncludes: ['Which institution'],
  },
]

function score(scenario: Scenario, reply: string): { pass: boolean; notes: string[] } {
  const lower = reply.toLowerCase()
  const notes: string[] = []
  for (const bad of scenario.failIfIncludes || []) {
    if (lower.includes(bad.toLowerCase())) notes.push(`fail phrase: ${bad}`)
  }
  for (const good of scenario.expect) {
    if (!lower.includes(good.toLowerCase())) notes.push(`missing signal: ${good}`)
  }
  const hardFail = (scenario.failIfIncludes || []).some((b) => lower.includes(b.toLowerCase()))
  const missingAll =
    scenario.expect.length > 0 && scenario.expect.every((g) => !lower.includes(g.toLowerCase()))
  return { pass: !hardFail && !missingAll, notes }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = process.env.EVAL_SECRET
  if (secret) {
    const provided = (req.headers['x-eval-secret'] as string) || ''
    if (provided !== secret) return res.status(401).json({ error: 'unauthorized' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const limit = Math.min(Number(body.limit) || SCENARIOS.length, SCENARIOS.length)
  const origin =
    (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host']
      ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
      : null) || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://nelfund-student-guide.vercel.app'

  const results: Array<{
    id: string
    category: string
    pass: boolean
    notes: string[]
    replyPreview: string
    status: number
  }> = []

  for (const scenario of SCENARIOS.slice(0, limit)) {
    try {
      const resp = await fetch(`${origin}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: scenario.turns }),
      })
      const data = (await resp.json()) as { reply?: string; error?: string; detail?: string }
      const reply = data.reply || data.detail || data.error || ''
      const scored = score(scenario, reply)
      results.push({
        id: scenario.id,
        category: scenario.category,
        pass: resp.ok && scored.pass,
        notes: !resp.ok ? [`http ${resp.status}: ${data.error || ''}`] : scored.notes,
        replyPreview: reply.slice(0, 280),
        status: resp.status,
      })
    } catch (e) {
      results.push({
        id: scenario.id,
        category: scenario.category,
        pass: false,
        notes: [e instanceof Error ? e.message : 'fetch failed'],
        replyPreview: '',
        status: 0,
      })
    }
  }

  const passed = results.filter((r) => r.pass).length
  return res.status(200).json({
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
    note: 'Requires a valid model provider key. Set EVAL_SECRET to protect this endpoint.',
  })
}
