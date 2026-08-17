/**
 * Conversational NELFUND student support agent.
 *
 * Architecture: GROUND THE FACTS, NOT THE CONVERSATION.
 *
 * Pipeline:
 *   Student message and/or screenshot
 *   → Intent classification (+ capability override)
 *   → Capability router:
 *        verified-knowledge | troubleshooting | contact-lookup |
 *        email-draft | current-information | conversation
 *   → Follow-up only when that capability needs a slot (e.g. institution)
 *   → Execute capability (KB retrieve / contacts / generate / current status)
 *   → Verify factual claims against allowlisted sources
 *   → Actionable response (+ optional video, escalation, draft)
 *
 * FAQ/verified knowledge is ONE tool — not the whole agent.
 * Generative writing does not require FAQ retrieval.
 * Current/time-sensitive questions use application-status + official links
 * and instruct the student to confirm live on nelf.gov.ng / the portal.
 * Contacts are never invented; only official websites or curated verified rows.
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
  AgentCapability,
} from './types'
