/**
 * NELFUND student support agent public exports.
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
} from './processTurn'
export type {
  ConversationSlots,
  ChatMessage,
  AgentTurnResult,
  ConversationPhase,
} from './processTurn'
export { extractTextFromImage, disposeOcrWorker } from './vision'
export { callAgentApi, checkAgentStatus } from './agentClient'
export type { AgentClientResult, AgentSlotsPayload } from './agentClient'
export { extractSlotsFromText } from './slots'
export type { ExtractedSlots } from './slots'
export { EVAL_SCENARIOS, scoreReply } from './eval/scenarios'
export type { EvalScenario, EvalTurn } from './eval/scenarios'
export { ARCH_DATASET } from './eval/dataset'
export type { ArchCase } from './eval/dataset'
export { freshnessFromDates, formatEvidenceForPrompt } from './evidence'
export type { EvidenceMeta, SourceAuthority, SourceType, Freshness } from './evidence'
export { understandPortalText, SAMPLE_DASHBOARD_OCR } from './screenshotUnderstand'
export type { ScreenshotUnderstanding, PortalScreenKind } from './screenshotUnderstand'

export { emptyAgentState } from './agent/contracts'
export type {
  AgentInput,
  AgentContext,
  AgentState,
  AgentResponse,
  ToolCall,
  ToolResult,
  ToolName,
  EvaluationResult,
  AgentObjective,
} from './agent/contracts'
export { nextPhase, canAct, needsInstitution } from './agent/stateMachine'
export { TOOL_DEFINITIONS, runToolLocal } from './agent/tools'
export { mockPlanTurn } from './agent/mockModel'
export { runMockAgentTurn, createContext } from './agent/orchestrator'
export { runArchitectureTests } from './agent/runArchitectureTests'
export type { TestReport } from './agent/runArchitectureTests'

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
