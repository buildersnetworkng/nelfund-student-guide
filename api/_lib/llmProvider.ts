/**
 * Provider-agnostic LLM config for NELFUND agent.
 * Swap providers via env without rewriting application logic.
 *
 * Supported:
 * - xAI (XAI_API_KEY)
 * - OpenAI (OPENAI_API_KEY)
 * - Any OpenAI-compatible endpoint (LLM_BASE_URL + LLM_API_KEY + LLM_MODEL)
 */

export type LlmProviderId = 'xai' | 'openai' | 'openai-compatible'

export type LlmConfig = {
  provider: LlmProviderId
  key: string
  base: string
  model: string
}

export function resolveLlmConfig(): LlmConfig | null {
  // Explicit compatible endpoint first (self-hosted / gateway)
  const compatKey = process.env.LLM_API_KEY
  const compatBase = process.env.LLM_BASE_URL
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

export function providerPublicLabel(cfg: LlmConfig | null): string | null {
  if (!cfg) return null
  return cfg.provider
}
