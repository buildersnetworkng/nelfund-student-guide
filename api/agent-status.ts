/**
 * Public health check: is a model provider configured?
 * Never returns secrets.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveLlmConfig } from './_lib/llmProvider'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const cfg = resolveLlmConfig()
  const configured = Boolean(cfg)

  return res.status(200).json({
    agent: configured ? 'ready' : 'unconfigured',
    mode: configured ? 'llm-agent' : 'offline-fallback',
    provider: cfg?.provider ?? null,
    model: cfg ? cfg.model : null,
    message: configured
      ? 'Model provider configured. POST /api/chat is the primary path. Validity of the key is verified only when chat is called.'
      : 'Set XAI_API_KEY, OPENAI_API_KEY, or LLM_API_KEY+LLM_BASE_URL in Vercel env, then redeploy.',
    checkedAt: new Date().toISOString(),
  })
}
