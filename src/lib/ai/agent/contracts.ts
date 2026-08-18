/**
 * Model-independent agent contracts for NELFUND AI.
 * Providers (xAI, OpenAI, self-hosted, mock) plug into this surface.
 */

import type { IntentId, AgentCapability } from '../types'

export type ConversationPhase =
  | 'open'
  | 'clarify'
  | 'gather'
  | 'act'
  | 'verify'
  | 'resolve'

export type AgentObjective =
  | 'explain'
  | 'troubleshoot'
  | 'find_contact'
  | 'draft_message'
  | 'current_status'
  | 'portal_access'
  | 'verify_school_upload'
  | 'resolve_portal_error'
  | 'unknown'

export interface ConversationTurnContract {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  intent?: IntentId
  toolName?: string
}

export interface AgentState {
  phase: ConversationPhase
  institutionId: string | null
  institutionName: string | null
  problem: string | null
  exactError: string | null
  objective: AgentObjective | null
  applicationStage: string | null
  previousActions: string[]
  requestedRecipient: 'school' | 'nelfund' | 'unknown' | null
  currentTask: AgentCapability | null
  pendingQuestion: string | null
  lastToolNames: string[]
}

export interface AgentContext {
  state: AgentState
  history: ConversationTurnContract[]
  ocrText?: string | null
  localeHint?: 'en' | 'pidgin' | 'mixed'
}

export interface AgentInput {
  message: string
  context: AgentContext
}

export type ToolName =
  | 'search_verified_knowledge'
  | 'fetch_official_page'
  | 'get_current_status'
  | 'get_institution_guidance'
  | 'get_nelfund_support'
  | 'draft_support_email'

export interface ToolDefinition {
  name: ToolName
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export interface ToolCall {
  id: string
  name: ToolName
  arguments: Record<string, string>
}

export type ToolResultStatus = 'ok' | 'not_found' | 'error' | 'stale' | 'forbidden'

export interface ToolResult {
  callId: string
  name: ToolName
  status: ToolResultStatus
  /** Structured evidence for the model — not a final user answer */
  data: Record<string, unknown>
  evidenceIds?: string[]
  warnings?: string[]
}

export interface SourceRef {
  id: string
  label: string
  url: string | null
  authority: 'official' | 'curated' | 'institutional' | 'unknown'
  freshness?: string
}

export interface AgentResponse {
  message: string
  phase: ConversationPhase
  state: AgentState
  citations?: SourceRef[]
  sources?: SourceRef[]
  actions?: string[]
  contacts?: Array<{ label: string; email?: string | null; url?: string | null }>
  emailDraft?: { subject: string; body: string } | null
  confidence: number
  freshness?: string
  warnings?: string[]
  toolsUsed: ToolName[]
  mode: 'mock' | 'llm' | 'offline'
}

export interface EvaluationResult {
  id: string
  pass: boolean
  notes: string[]
  observed?: Partial<AgentState>
  tools?: ToolName[]
}

export function emptyAgentState(): AgentState {
  return {
    phase: 'open',
    institutionId: null,
    institutionName: null,
    problem: null,
    exactError: null,
    objective: null,
    applicationStage: null,
    previousActions: [],
    requestedRecipient: null,
    currentTask: null,
    pendingQuestion: null,
    lastToolNames: [],
  }
}
