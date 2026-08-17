/**
 * NELFUND student support agent.
 *
 * Production path: /api/chat LLM agent (reason + tools + knowledge as evidence).
 * Offline path: local processUserTurn (capability router + verified data).
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
export { callAgentApi } from './agentClient'
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
