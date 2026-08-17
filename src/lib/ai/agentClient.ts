/**
 * Client for the LLM agent API (/api/chat).
 * Returns null when the agent is unconfigured or fails (caller uses local fallback).
 */
import type { ConversationTurn } from './types'

export async function callAgentApi(opts: {
  history: ConversationTurn[]
  userText: string
  institutionId: string | null
  institutionName: string | null
  ocrText: string | null
}): Promise<{ reply: string; mode: string; toolsUsed?: string[] } | null> {
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
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (body?.fallback || res.status === 503 || res.status === 502) return null
      return null
    }
    const data = (await res.json()) as { reply?: string; mode?: string; toolsUsed?: string[]; fallback?: boolean }
    if (data.fallback || !data.reply) return null
    return { reply: data.reply, mode: data.mode || 'llm-agent', toolsUsed: data.toolsUsed }
  } catch {
    return null
  }
}
