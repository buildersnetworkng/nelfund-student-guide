/**
 * Knowledge-first NELFUND assistant.
 *
 * Architecture (non-negotiable):
 *   Student question
 *   → Intent classification
 *   → Verified knowledge retrieval
 *   → Evidence-backed answer
 *   → Source attribution
 *   → Next action
 *   → Relevant YouTube guide (from catalogue only)
 *
 * The model's general knowledge is never treated as authoritative NELFUND policy.
 * If the verified layer lacks evidence, the assistant refuses rather than invents.
 */
export { answerQuestion } from './answer'
export { classifyIntent } from './intent'
export { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
export type { GroundedAnswer, EvidenceItem, IntentId, IntentResult } from './types'
