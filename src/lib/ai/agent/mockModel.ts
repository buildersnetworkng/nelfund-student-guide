/**
 * Deterministic MOCK model for architecture tests.
 * Not real AI — plans tool use and phases without a provider.
 */

import type { AgentInput, AgentObjective, AgentState, ToolCall, ToolName } from './contracts'
import { canAct, needsInstitution, nextPhase } from './stateMachine'
import { extractSlotsFromText } from '../slots'

export type MockPlan = {
  objective: AgentObjective
  state: AgentState
  toolCalls: ToolCall[]
  clarify?: string | null
  label: 'mock'
}

function detectObjective(text: string): AgentObjective {
  const t = text.toLowerCase()
  if (/draft|write\s*(an?\s*)?(email|message|complaint)/i.test(text)) return 'draft_message'
  if (/contact|who\s*should\s*i|reach|email\s*(for|of)/i.test(t) && !/draft/i.test(t))
    return 'find_contact'
  if (/open|latest|current|today|deadline|announce/i.test(t)) return 'current_status'
  if (/login|log\s*in|sign\s*in|which\s*link/i.test(t)) return 'portal_access'
  if (/upload|school.*(submit|sent|upload)|data.*(upload|submit)/i.test(t)) return 'verify_school_upload'
  if (/missing\s*information|record\s*not\s*found|no\s*school\s*info/i.test(t))
    return 'resolve_portal_error'
  if (/what\s*is\s*nelfund|eligib|disqualif|repay|upkeep|how\s*to\s*apply/i.test(t)) return 'explain'
  if (/error|problem|issue|stuck|not\s*working|wahala/i.test(t)) return 'troubleshoot'
  return 'unknown'
}

function detectRecipient(text: string): 'school' | 'nelfund' | null {
  if (/nelfund|nelf\.gov/i.test(text) && /contact|email|complaint|ticket/i.test(text))
    return 'nelfund'
  if (/school|institution|registry|ict|lecturer/i.test(text)) return 'school'
  return null
}

export function mockPlanTurn(input: AgentInput): MockPlan {
  let state: AgentState = { ...input.context.state, previousActions: [...input.context.state.previousActions] }
  state = nextPhase(state, { type: 'message_received' })

  const extracted = extractSlotsFromText(input.message, {
    institutionId: state.institutionId,
    institutionName: state.institutionName,
    problemSummary: state.problem,
    exactError: state.exactError,
    objective: state.objective,
  })

  if (extracted.institutionId) state.institutionId = extracted.institutionId
  if (extracted.institutionName) state.institutionName = extracted.institutionName
  if (extracted.exactError) {
    state.exactError = extracted.exactError
    state.problem = extracted.exactError
  }
  if (extracted.problemSummary && !state.problem) state.problem = extracted.problemSummary

  const objective = detectObjective(input.message) || state.objective || 'unknown'
  state.objective = objective
  const recipient = detectRecipient(input.message)
  if (recipient) state.requestedRecipient = recipient

  // Gather institution if required
  if (needsInstitution(objective) && !state.institutionId && !state.institutionName) {
    state = nextPhase(state, { type: 'needs_context', field: 'institution' })
    return { objective, state, toolCalls: [], clarify: state.pendingQuestion, label: 'mock' }
  }

  if (objective === 'unknown' && input.message.trim().length < 25 && /help|problem|issue/i.test(input.message)) {
    state = nextPhase(state, {
      type: 'needs_clarification',
      question: 'What part is not working — login, missing information, school not showing, or something else?',
    })
    return { objective, state, toolCalls: [], clarify: state.pendingQuestion, label: 'mock' }
  }

  if (!canAct(state)) {
    state = nextPhase(state, { type: 'needs_context', field: 'institution' })
    return { objective, state, toolCalls: [], clarify: state.pendingQuestion, label: 'mock' }
  }

  state = nextPhase(state, { type: 'ready_to_act' })
  const toolCalls: ToolCall[] = []
  const uid = () => `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const add = (name: ToolName, args: Record<string, string>) => {
    toolCalls.push({ id: uid(), name, arguments: args })
  }

  switch (objective) {
    case 'current_status':
      add('get_current_status', {})
      break
    case 'portal_access':
      add('get_nelfund_support', {})
      break
    case 'find_contact':
      add('get_institution_guidance', {
        institution: state.institutionName || '',
        institutionId: state.institutionId || '',
      })
      add('get_nelfund_support', {})
      break
    case 'draft_message':
      add('draft_support_email', {
        institutionId: state.institutionId || '',
        institutionName: state.institutionName || '',
        exactError: state.exactError || state.problem || 'Missing information',
        recipient: state.requestedRecipient === 'nelfund' ? 'nelfund' : 'school',
      })
      break
    case 'verify_school_upload':
    case 'resolve_portal_error':
    case 'troubleshoot':
      add('search_verified_knowledge', {
        query: input.message,
        intent: 'missing-information',
        institutionId: state.institutionId || '',
      })
      if (state.institutionId) {
        add('get_institution_guidance', {
          institutionId: state.institutionId,
          institution: state.institutionName || '',
        })
      }
      break
    case 'explain':
      add('search_verified_knowledge', { query: input.message, intent: 'what-is-nelfund' })
      break
    default:
      add('search_verified_knowledge', { query: input.message, intent: 'unknown' })
  }

  state.lastToolNames = toolCalls.map((t) => t.name)
  state.previousActions = [...state.previousActions, ...state.lastToolNames]
  return { objective, state, toolCalls, clarify: null, label: 'mock' }
}
