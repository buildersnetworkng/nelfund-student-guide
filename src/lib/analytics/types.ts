/** Privacy-safe analytics event types for NELFUND Student Guide */

export type AnalyticsEventName =
  | 'page_view'
  | 'session_start'
  | 'ai_conversation_start'
  | 'ai_question'
  | 'ai_image_analysis'
  | 'ai_unresolved'
  | 'ai_resolved'
  | 'ai_unknown'
  /** Conversation produced a useful grounded answer (diagnosed, known intent) */
  | 'ai_resolution_closed'
  /** AI handed off school and/or NELFUND contact details */
  | 'ai_escalation_fired'
  | 'ai_feedback_up'
  | 'ai_feedback_down'
  | 'faq_view'
  | 'faq_open'
  | 'feature_use'
  | 'institution_set'

export interface AnalyticsEventPayload {
  name: AnalyticsEventName
  /** ISO timestamp from client */
  ts?: string
  path?: string
  /** Coarse intent id only — never free-text questions */
  intent?: string
  /** Institution id from local selector (not free-text PII) */
  institutionId?: string
  feature?: string
  faqId?: string
  /** true when AI could not ground an answer confidently */
  unresolved?: boolean
  /** true when image OCR/analysis ran */
  hasImage?: boolean
  /** Coarse unknown-topic bucket only — never free-text questions */
  topic?: string
  meta?: Record<string, string | number | boolean | null>
}

export interface TrackBody {
  uid: string
  sid: string
  events: AnalyticsEventPayload[]
}

export interface AnalyticsStats {
  generatedAt: string
  totals: {
    uniqueUsers: number
    sessions: number
    pageViews: number
    aiConversations: number
    aiQuestions: number
    imageAnalyses: number
    faqOpens: number
    unresolvedAi: number
    unknownAi: number
    /** Exact: useful diagnosis closed */
    resolutionClosed: number
    /** Exact: escalation / contact handoff fired */
    escalationFired: number
    feedbackUp: number
    feedbackDown: number
  }
  active: {
    today: number
    week: number
    month: number
  }
  topIntents: Array<{ key: string; count: number }>
  topInstitutions: Array<{ key: string; count: number }>
  topPages: Array<{ key: string; count: number }>
  topFeatures: Array<{ key: string; count: number }>
  /** Coarse buckets for unclassified questions (never free-text) */
  topUnknownTopics: Array<{ key: string; count: number }>
  daily: Array<{ date: string; users: number; sessions: number; aiQuestions: number }>
  storage: 'redis' | 'memory' | 'unavailable'
}
