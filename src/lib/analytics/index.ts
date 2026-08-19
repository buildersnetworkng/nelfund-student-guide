export {
  track,
  trackSessionStart,
  trackPageView,
  trackAiQuestion,
  trackAiFeedback,
  trackFaqOpen,
  trackFeature,
  trackInstitution,
  fetchAnalyticsStats,
  flushAnalytics,
  getAnonymousUserId,
  getSessionId,
} from './client'

export type { AnalyticsEventName, AnalyticsEventPayload, AnalyticsStats } from './types'
