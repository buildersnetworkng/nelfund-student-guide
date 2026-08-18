/**
 * NELFUND student support agent.
 *
 * PRIMARY: /api/chat LLM agent (provider-agnostic + tools + knowledge as evidence).
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
export type { AgentClientResult, AgentSlotsPayload } from './agentClient'
export { extractSlotsFromText } from './slots'
export type { ExtractedSlots } from './slots'
export { EVAL_SCENARIOS, scoreReply } from './eval/scenarios'
export type { EvalScenario, EvalTurn } from './eval/scenarios'
export {
  freshnessFromDates,
  formatEvidenceForPrompt,
} from './evidence'
export type { EvidenceMeta, SourceAuthority, SourceType, Freshness } from './evidence'
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
