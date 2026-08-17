/**
 * NELFUND student support agent.
 *
 * PRIMARY: /api/chat LLM agent (reason + tools + knowledge as evidence).
 * EMERGENCY: processUserTurn offline — must never silently pretend to be the LLM.
 */

export { answerQuestion } from './answer'
export { classifyIntent } from './intent'
export { resolveCapability, detectCapabilityOverride } from './capabilities'
export { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
export {
  processUserTurn,
  createInitialSlots,
  createWelcomeMessage,
  extractErrorSignals,
} from './conversation'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './conversation'
export { extractTextFromImage, disposeOcrWorker } from './vision'
export { callAgentApi, checkAgentStatus } from './agentClient'
export type { AgentClientResult } from './agentClient'
export type {
  GroundedAnswer,
  EvidenceItem,
  IntentId,
  IntentResult,
  ConversationTurn,
  EscalationPlanView,
  EscalationContactView,
  AgentCapability,
} from './types'
