export {
  track,
  trackSessionStart,
  trackPageView,
  trackAiQuestion,
  trackFeedback,
  trackFaqOpen,
  trackFeature,
  trackInstitution,
  fetchAnalyticsStats,
  flushAnalytics,
  getAnonymousUserId,
  getSessionId,
  sanitizeAiPath,
  sanitizeAiArea,
  sanitizeAiFallbackReason,
  clampAiLatencyMs,
} from './client'

export type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsStats,
  AiPathValue,
  AiAreaValue,
  AiFallbackReasonValue,
} from './types'

export {
  AI_PATH_ALLOWLIST,
  AI_AREA_ALLOWLIST,
  AI_FALLBACK_REASON_ALLOWLIST,
} from './types'
