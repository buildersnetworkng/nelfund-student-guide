/**
 * Conversational NELFUND student support agent.
 *
 * Architecture: GROUND THE FACTS, NOT THE CONVERSATION.
 *
 * Pipeline:
 *   Student message and/or screenshot
 *   → Intent classification (+ capability override)
 *   → Conversational state (phase, pending clarify, slots)
 *   → Decide: clarify one question | answer factual | troubleshoot | contact | draft | current
 *   → Execute capability against verified data (never invent contacts/deadlines)
 *   → Concise response + one useful next step
 *
 * FAQ/verified knowledge is ONE tool — not the whole agent.
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
