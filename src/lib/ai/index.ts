/**
 * Knowledge-first NELFUND assistant.
 *
 * Pipeline:
 *   Student message (natural language)
 *   → Intent + problem + stage extraction
 *   → Verified knowledge retrieval (synonym-aware)
 *   → Evidence evaluation
 *   → Diagnostic / personalised response from evidence only
 *   → Source attribution
 *   → Next actions
 *   → Relevant video
 *   → Optional clarifying questions
 *
 * The model's general knowledge is never treated as authoritative NELFUND policy.
 */
export { answerQuestion } from './answer'
export { classifyIntent } from './intent'
export { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
export type {
  GroundedAnswer,
  EvidenceItem,
  IntentId,
  IntentResult,
  ConversationTurn,
} from './types'
