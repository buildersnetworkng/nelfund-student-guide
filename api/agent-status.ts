/**
 * Public health check: is a model provider configured?
 * Never returns secrets.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

function resolveProvider(): { provider: string; model: string } | null {
  const compatKey = process.env.LLM_API_KEY?.trim()
  const compatBase = process.env.LLM_BASE_URL?.trim()
  if (compatKey && compatBase) {
    return { provider: 'openai-compatible', model: process.env.LLM_MODEL || 'default' }
  }
  if (process.env.XAI_API_KEY?.trim()) {
    return { provider: 'xai', model: process.env.XAI_MODEL || 'grok-3-mini' }
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const cfg = resolveProvider()
    const configured = Boolean(cfg)

    return res.status(200).json({
      agent: configured ? 'ready' : 'unconfigured',
      mode: configured ? 'llm-agent' : 'offline-fallback',
      provider: cfg?.provider ?? null,
      model: cfg?.model ?? null,
      message: configured
        ? 'Model provider configured. POST /api/chat is primary. Key validity is checked only on chat calls.'
        : 'Set XAI_API_KEY, OPENAI_API_KEY, or LLM_API_KEY+LLM_BASE_URL in Vercel env, then redeploy.',
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[agent-status]', e)
    return res.status(500).json({
      agent: 'unconfigured',
      mode: 'offline-fallback',
      error: 'status_failed',
      message: e instanceof Error ? e.message : 'unknown',
    })
  }
}
