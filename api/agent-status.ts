/**
 * Public health check: is the LLM agent configured?
 * Never returns secrets. Safe to call from the client.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const hasXai = Boolean(process.env.XAI_API_KEY)
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY)
  const configured = hasXai || hasOpenAi

  return res.status(200).json({
    agent: configured ? 'ready' : 'unconfigured',
    mode: configured ? 'llm-agent' : 'offline-fallback',
    provider: hasXai ? 'xai' : hasOpenAi ? 'openai' : null,
    message: configured
      ? 'LLM agent is configured. POST /api/chat is the primary path.'
      : 'Set XAI_API_KEY (preferred) or OPENAI_API_KEY in Vercel project env, then redeploy.',
    checkedAt: new Date().toISOString(),
  })
}
