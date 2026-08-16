/**
 * Conversational NELFUND student support agent.
 *
 * Pipeline:
 *   Student message and/or screenshot
 *   → Intent + slot update (institution, error, entities)
 *   → Follow-up question if critical context is missing
 *   → Verified knowledge retrieval (allowlist-scoped)
 *   → Diagnosis + next actions + escalation + message draft
 *   → Source attribution + optional relevant video
 *
 * The model’s general knowledge is never treated as authoritative NELFUND policy.
 * Contacts and facts come only from the verified data layer.
 */

export { answerQuestion } from './answer'
export { classifyIntent } from './intent'
export { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
export {
  processUserTurn,
  createInitialSlots,
  createWelcomeMessage,
  extractErrorSignals,
} from './conversation'
export type { ConversationSlots, ChatMessage, AgentTurnResult } from './conversation'
export { extractTextFromImage, disposeOcrWorker } from './vision'
export type {
  GroundedAnswer,
  EvidenceItem,
  IntentId,
  IntentResult,
  ConversationTurn,
  EscalationPlanView,
  EscalationContactView,
} from './types'
