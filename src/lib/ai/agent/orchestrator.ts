/**
 * Model-independent turn orchestrator.
 * Uses mock planner by default for architecture tests; LLM plugs in later via same contracts.
 */

import type { AgentContext, AgentInput, AgentResponse, AgentState, SourceRef } from './contracts'
import { emptyAgentState } from './contracts'
import { mockPlanTurn } from './mockModel'
import { runToolLocal } from './tools'
import { nextPhase } from './stateMachine'

const PORTAL = 'https://portal.nelf.gov.ng/'

function composeMessage(
  plan: ReturnType<typeof mockPlanTurn>,
  toolData: Array<{ name: string; data: Record<string, unknown>; warnings?: string[] }>,
): { message: string; emailDraft?: { subject: string; body: string } | null; actions: string[]; warnings: string[]; sources: SourceRef[] } {
  if (plan.clarify) {
    return {
      message: plan.clarify,
      actions: [],
      warnings: [],
      sources: [],
    }
  }

  const warnings: string[] = []
  const sources: SourceRef[] = []
  const actions: string[] = []
  let emailDraft: { subject: string; body: string } | null = null
  const parts: string[] = []

  for (const t of toolData) {
    if (t.warnings) warnings.push(...t.warnings)
    if (t.name === 'get_current_status') {
      parts.push(
        String(t.data.answer_preview || t.data.status_label || 'Check the official portal for live status.'),
      )
      actions.push(`Confirm on ${PORTAL}`)
      sources.push({
        id: 'portal',
        label: 'NELFUND portal',
        url: PORTAL,
        authority: 'official',
      })
    }
    if (t.name === 'get_nelfund_support') {
      parts.push(
        `Official support: ${t.data.ticket_portal || 'https://nelfund.esupport.ng/create'}. Portal: ${t.data.application_portal || PORTAL}.`,
      )
      sources.push({
        id: 'esupport',
        label: 'NELFUND eSupport',
        url: String(t.data.ticket_portal || ''),
        authority: 'official',
      })
    }
    if (t.name === 'get_institution_guidance') {
      const name = t.data.institutionName || 'your institution'
      const contacts = (t.data.contacts as Array<{ label: string; email?: string; url?: string }>) || []
      if (contacts.length) {
        parts.push(`For ${name}, curated contacts:`)
        for (const c of contacts.slice(0, 3)) {
          parts.push(`• ${c.label}${c.email ? `: ${c.email}` : c.url ? ` — ${c.url}` : ''}`)
        }
      } else {
        parts.push(
          `I could not verify a dedicated unit email for ${name}. Use the official institution website and NELFUND eSupport — do not use unofficial addresses.`,
        )
      }
    }
    if (t.name === 'draft_support_email') {
      emailDraft = {
        subject: String(t.data.subject || ''),
        body: String(t.data.body || ''),
      }
      parts.push('Here is a draft you can adapt (fill in placeholders):')
      parts.push(`Subject: ${emailDraft.subject}`)
      parts.push('')
      parts.push(emailDraft.body)
    }
    if (t.name === 'search_verified_knowledge') {
      const items = (t.data.items as Array<{ title: string; body: string }>) || []
      if (items[0]) {
        parts.push(items[0].body.slice(0, 400))
      } else if (!parts.length) {
        parts.push(
          'I do not have a strong verified match for that yet. Tell me the exact portal message or your institution so I can narrow it down.',
        )
      }
    }
  }

  if (!parts.length) {
    parts.push('Tell me a bit more about what you are trying to do on NELFUND, or paste the exact portal message.')
  }

  return { message: parts.join('\n'), emailDraft, actions, warnings, sources }
}

export function runMockAgentTurn(input: AgentInput): AgentResponse {
  const plan = mockPlanTurn(input)
  const toolData = plan.toolCalls.map((c) => {
    const r = runToolLocal(c)
    return { name: r.name, data: r.data, warnings: r.warnings }
  })

  let state: AgentState = plan.state
  if (plan.toolCalls.length) state = nextPhase(state, { type: 'tools_completed' })
  if (!plan.clarify) state = nextPhase(state, { type: 'resolved' })

  const composed = composeMessage(plan, toolData)

  return {
    message: composed.message,
    phase: state.phase,
    state,
    sources: composed.sources,
    actions: composed.actions,
    emailDraft: composed.emailDraft,
    confidence: plan.clarify ? 0.55 : 0.75,
    warnings: composed.warnings,
    toolsUsed: plan.toolCalls.map((t) => t.name),
    mode: 'mock',
  }
}

export function createContext(partial?: Partial<AgentState>): AgentContext {
  return {
    state: { ...emptyAgentState(), ...partial },
    history: [],
  }
}
