/**
 * Conversation phase transitions for NELFUND support agent.
 * Prevents question → massive dump jumps.
 */

import type { AgentObjective, AgentState, ConversationPhase } from './contracts'

export type TransitionEvent =
  | { type: 'message_received' }
  | { type: 'needs_clarification'; question: string }
  | { type: 'needs_context'; field: 'institution' | 'error' | 'recipient' }
  | { type: 'context_filled' }
  | { type: 'ready_to_act' }
  | { type: 'tools_completed' }
  | { type: 'resolved' }
  | { type: 'follow_up' }

const ORDER: ConversationPhase[] = ['open', 'clarify', 'gather', 'act', 'verify', 'resolve']

export function nextPhase(state: AgentState, event: TransitionEvent): AgentState {
  const s: AgentState = { ...state, previousActions: [...state.previousActions] }

  switch (event.type) {
    case 'message_received':
      if (s.phase === 'resolve') s.phase = 'open'
      break
    case 'needs_clarification':
      s.phase = 'clarify'
      s.pendingQuestion = event.question
      break
    case 'needs_context':
      s.phase = 'gather'
      s.pendingQuestion =
        event.field === 'institution'
          ? 'Which institution do you attend?'
          : event.field === 'error'
            ? 'What exact message does the portal show?'
            : 'Should this go to your school or to NELFUND?'
      break
    case 'context_filled':
      s.pendingQuestion = null
      if (s.phase === 'gather' || s.phase === 'clarify') s.phase = 'act'
      break
    case 'ready_to_act':
      s.phase = 'act'
      s.pendingQuestion = null
      break
    case 'tools_completed':
      s.phase = 'verify'
      break
    case 'resolved':
      s.phase = 'resolve'
      s.pendingQuestion = null
      break
    case 'follow_up':
      s.phase = 'open'
      break
  }
  return s
}

export function needsInstitution(objective: AgentObjective | null): boolean {
  return (
    objective === 'find_contact' ||
    objective === 'draft_message' ||
    objective === 'resolve_portal_error' ||
    objective === 'verify_school_upload'
  )
}

export function canAct(state: AgentState): boolean {
  if (state.objective === 'current_status' || state.objective === 'portal_access' || state.objective === 'explain') {
    return true
  }
  if (needsInstitution(state.objective) && !state.institutionId && !state.institutionName) {
    return false
  }
  return true
}

export function phaseIndex(p: ConversationPhase): number {
  return ORDER.indexOf(p)
}
