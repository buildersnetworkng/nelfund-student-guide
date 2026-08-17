/**
 * Client for the LLM agent API (/api/chat).
 * Distinguishes real agent replies from degraded offline mode — never silent.
 */
import type { ConversationTurn } from './types'

export type AgentClientResult =
  | {
      kind: 'llm'
      reply: string
      mode: 'llm-agent'
      toolsUsed?: string[]
    }
  | {
      kind: 'degraded'
      reason: 'unconfigured' | 'llm_error' | 'network' | 'empty'
      message: string
    }

export async function checkAgentStatus(): Promise<{
  agent: 'ready' | 'unconfigured'
  mode: string
  message: string
} | null> {
  try {
    const res = await fetch('/api/agent-status', { method: 'GET' })
    if (!res.ok) return null
    return (await res.json()) as { agent: 'ready' | 'unconfigured'; mode: string; message: string }
  } catch {
    return null
  }
}

export async function callAgentApi(opts: {
  history: ConversationTurn[]
  userText: string
  institutionId: string | null
  institutionName: string | null
  ocrText: string | null
}): Promise<AgentClientResult> {
  try {
    const messages = [
      ...opts.history.map((h) => ({ role: h.role, content: h.text })),
      { role: 'user' as const, content: opts.userText },
    ]
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        institutionId: opts.institutionId,
        institutionName: opts.institutionName,
        ocrText: opts.ocrText,
      }),
    })

    const body = (await res.json().catch(() => ({}))) as {
      reply?: string
      mode?: string
      toolsUsed?: string[]
      fallback?: boolean
      error?: string
      message?: string
    }

    if (res.status === 503 || body.error === 'agent_unconfigured' || body.fallback) {
      return {
        kind: 'degraded',
        reason: 'unconfigured',
        message:
          body.message ||
          'The intelligent AI agent is not configured on the server (missing API key). Offline limited mode is active.',
      }
    }

    if (!res.ok) {
      return {
        kind: 'degraded',
        reason: 'llm_error',
        message: body.message || body.detail || `Agent error (${res.status}). Offline limited mode is active.`,
      }
    }

    if (!body.reply || body.mode !== 'llm-agent') {
      return {
        kind: 'degraded',
        reason: 'empty',
        message: 'Agent returned an empty response. Offline limited mode is active.',
      }
    }

    return {
      kind: 'llm',
      reply: body.reply,
      mode: 'llm-agent',
      toolsUsed: body.toolsUsed,
    }
  } catch {
    return {
      kind: 'degraded',
      reason: 'network',
      message: 'Could not reach the AI agent. Offline limited mode is active.',
    }
  }
}
