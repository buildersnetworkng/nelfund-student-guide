/**
 * Optional external-model client (/api/chat). Not required for NELFUND AI.
 * Primary product intelligence is processUserTurn (owned NELFUND AI).
 * Never surfaces provider status banners to students.
 */
import type { ConversationTurn } from './types'
import { extractSlotsFromText } from './slots'

export type AgentClientResult =
  | {
      kind: 'llm'
      reply: string
      mode: 'llm-agent'
      toolsUsed?: string[]
      provider?: string
      latencyMs?: number
    }
  | {
      kind: 'degraded'
      reason: 'unconfigured' | 'llm_error' | 'network' | 'empty'
      message: string
    }

export type AgentSlotsPayload = {
  institutionId?: string | null
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  objective?: string | null
  phase?: string | null
}

/** Optional health check — not used for UI banners. */
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
  slots?: AgentSlotsPayload | null
}): Promise<AgentClientResult> {
  try {
    const extracted = extractSlotsFromText(opts.userText, {
      institutionId: opts.slots?.institutionId ?? opts.institutionId,
      institutionName: opts.slots?.institutionName ?? opts.institutionName,
      problemSummary: opts.slots?.problemSummary ?? null,
      exactError: opts.slots?.exactError ?? null,
      objective: opts.slots?.objective ?? null,
    })

    const slots: AgentSlotsPayload = {
      institutionId: extracted.institutionId,
      institutionName: extracted.institutionName,
      problemSummary: extracted.problemSummary,
      exactError: extracted.exactError,
      objective: extracted.objective,
      phase: opts.slots?.phase ?? null,
    }

    const messages = [
      ...opts.history.map((h) => ({ role: h.role, content: h.text })),
      { role: 'user' as const, content: opts.userText },
    ]
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        institutionId: slots.institutionId,
        institutionName: slots.institutionName,
        ocrText: opts.ocrText,
        slots,
      }),
    })

    const body = (await res.json().catch(() => ({}))) as {
      reply?: string
      mode?: string
      toolsUsed?: string[]
      fallback?: boolean
      error?: string
      message?: string
      detail?: string
      provider?: string
      latencyMs?: number
    }

    if (res.status === 503 || body.error === 'agent_unconfigured' || body.fallback) {
      const reason =
        body.error === 'llm_error' || res.status === 502 ? 'llm_error' : 'unconfigured'
      return {
        kind: 'degraded',
        reason,
        message: body.message || body.detail || 'optional_llm_unavailable',
      }
    }

    if (!res.ok) {
      return {
        kind: 'degraded',
        reason: 'llm_error',
        message: body.message || body.detail || `agent_error_${res.status}`,
      }
    }

    if (!body.reply || body.mode !== 'llm-agent') {
      return {
        kind: 'degraded',
        reason: 'empty',
        message: 'empty_reply',
      }
    }

    return {
      kind: 'llm',
      reply: body.reply,
      mode: 'llm-agent',
      toolsUsed: body.toolsUsed,
      provider: body.provider,
      latencyMs: body.latencyMs,
    }
  } catch {
    return {
      kind: 'degraded',
      reason: 'network',
      message: 'network_error',
    }
  }
}
