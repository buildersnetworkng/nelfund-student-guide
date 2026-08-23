/**
 * Privacy-conscious analytics client.
 *
 * - Anonymous user id in localStorage (survives refresh; not a new user each load)
 * - Session id in sessionStorage (new tab/session = new session)
 * - Never sends passwords, OTPs, BVN, NIN, bank details, or free-text questions
 * - Only coarse intents, paths, feature names, institution ids, topic buckets
 */

import type { AnalyticsEventName, AnalyticsEventPayload, AnalyticsStats, TrackBody } from './types'

const UID_KEY = 'nsg_uid_v1'
const SID_KEY = 'nsg_sid_v1'
const QUEUE_KEY = 'nsg_analytics_queue_v1'
const MAX_QUEUE = 40

const SENSITIVE =
  /\b(password|passwd|otp|pin|bvn|nin|account\s*number|matriculation|bank\s*account|token|secret|ssn)\b/i

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function getAnonymousUserId(): string {
  try {
    let id = localStorage.getItem(UID_KEY)
    if (!id || id.length < 8) {
      id = uuid()
      localStorage.setItem(UID_KEY, id)
    }
    return id
  } catch {
    return `ephemeral-${uuid()}`
  }
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SID_KEY)
    if (!id || id.length < 8) {
      id = uuid()
      sessionStorage.setItem(SID_KEY, id)
    }
    return id
  } catch {
    return `sess-${uuid()}`
  }
}

function sanitizeMeta(
  meta?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> | undefined {
  if (!meta) return undefined
  const out: Record<string, string | number | boolean | null> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string' && SENSITIVE.test(v)) continue
    if (typeof v === 'string' && v.length > 80) {
      out[k] = v.slice(0, 80)
    } else {
      out[k] = v
    }
  }
  return out
}

function loadQueue(): AnalyticsEventPayload[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AnalyticsEventPayload[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveQueue(events: AnalyticsEventPayload[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)))
  } catch {
    /* ignore */
  }
}

async function flush(events: AnalyticsEventPayload[]): Promise<boolean> {
  if (!events.length) return true
  if (typeof window === 'undefined') return false
  const body: TrackBody = {
    uid: getAnonymousUserId(),
    sid: getSessionId(),
    events: events.map((e) => ({
      ...e,
      ts: e.ts || new Date().toISOString(),
      path: e.path || window.location.pathname,
      meta: sanitizeMeta(e.meta),
    })),
  }
  try {
    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

export function track(name: AnalyticsEventName, payload: Omit<AnalyticsEventPayload, 'name'> = {}) {
  const event: AnalyticsEventPayload = {
    name,
    ts: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...payload,
  }
  const queue = loadQueue()
  queue.push(event)
  saveQueue(queue)
  void flush(queue).then((ok) => {
    if (ok) saveQueue([])
  })
}

export function trackPageView(path: string) {
  track('page_view', { path: path.slice(0, 120) })
}

export function trackSessionStart() {
  track('session_start', {})
}

export async function flushAnalytics(): Promise<boolean> {
  const queue = loadQueue()
  if (!queue.length) return true
  const ok = await flush(queue)
  if (ok) saveQueue([])
  return ok
}

/** Coarse topic buckets only — never stores the student question text. */
export function deriveUnknownTopic(text: string | null | undefined): string {
  if (!text || !text.trim()) return 'empty'
  const t = text.toLowerCase()
  if (/missing|no\s*info|record\s*not\s*found/.test(t)) return 'missing-info'
  if (/jamb/.test(t)) return 'jamb'
  if (/nin/.test(t)) return 'nin'
  if (/pending|status|under\s*review/.test(t)) return 'pending-status'
  if (/reject|declined|not\s*approved/.test(t)) return 'rejection'
  if (/school\s*(not|no)|not\s*show|institution\s*not/.test(t)) return 'school-list'
  if (/upkeep|20\s*k|allowance/.test(t)) return 'upkeep'
  if (/fee|tuition|charges/.test(t)) return 'fees'
  if (/repay|gsi|pay\s*back/.test(t)) return 'repayment'
  if (/open|deadline|window|apply\s*today|latest\s*update|expire|bvn/.test(t)) return 'open-status'
  if (/login|password|otp|sign\s*in|portal/.test(t)) return 'login-portal'
  if (/contact|email|phone|who\s*do\s*i/.test(t)) return 'contacts'
  if (/draft|write\s*(an?\s*)?(email|message)/.test(t)) return 'email-draft'
  if (/eligib|qualify|disqualif/.test(t)) return 'eligibility'
  if (/screenshot|error|what\s*does\s*this\s*mean/.test(t)) return 'error-screenshot'
  if (/hello|hi\b|help|abeg|please|wahala|stuck/.test(t) && t.length < 40) return 'greeting-vague'
  if (/disburse|payment|money\s*enter|when\s*will\s*i\s*get/.test(t)) return 'disbursement'
  if (/account\s*creat|create\s*account|register|sign\s*up/.test(t)) return 'account-create'
  if (/password|reset\s*password|forgot/.test(t)) return 'password-reset'
  if (/approv|not\s*yet\s*approv/.test(t)) return 'approval'
  return 'other'
}

function isUnknownIntent(intent?: string | null): boolean {
  if (!intent) return true
  const i = intent.toLowerCase()
  return (
    i === 'unknown' ||
    i === 'offline:unknown' ||
    i === 'llm-agent' ||
    i.endsWith(':unknown') ||
    i === 'conversation'
  )
}

export function trackAiQuestion(opts: {
  intent?: string | null
  institutionId?: string | null
  hasImage?: boolean
  unresolved?: boolean
  isNewConversation?: boolean
  userText?: string | null
  resolutionClosed?: boolean
  escalationFired?: boolean
}) {
  const intent = opts.intent || 'unknown'
  // Only pure unknown intents count as unknown — clarifying questions (e.g. ask school)
  // are unresolved but classified; counting them as unknown inflated Pilot #2 rates.
  const unknown = isUnknownIntent(intent)
  const topic = unknown || opts.unresolved ? deriveUnknownTopic(opts.userText) : undefined

  if (opts.isNewConversation) {
    track('ai_conversation_start', {
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  }
  track('ai_question', {
    intent,
    institutionId: opts.institutionId || undefined,
    hasImage: !!opts.hasImage,
    unresolved: !!opts.unresolved || unknown,
    topic,
  })
  if (opts.hasImage) {
    track('ai_image_analysis', {
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  }
  if (unknown) {
    track('ai_unknown', {
      intent: intent === 'llm-agent' ? 'llm-agent' : 'unknown',
      institutionId: opts.institutionId || undefined,
      hasImage: !!opts.hasImage,
      unresolved: true,
      topic: topic || 'other',
    })
    track('ai_unresolved', {
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  } else if (opts.unresolved) {
    track('ai_unresolved', {
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  } else {
    track('ai_resolved', {
      intent,
      institutionId: opts.institutionId || undefined,
    })
  }

  if (opts.resolutionClosed) {
    track('ai_resolution_closed', {
      intent,
      institutionId: opts.institutionId || undefined,
    })
  }
  if (opts.escalationFired) {
    track('ai_escalation_fired', {
      intent,
      institutionId: opts.institutionId || undefined,
    })
  }
}

export function trackFeedback(vote: 'up' | 'down', opts?: { intent?: string | null; institutionId?: string | null }) {
  track(vote === 'up' ? 'ai_feedback_up' : 'ai_feedback_down', {
    intent: opts?.intent || undefined,
    institutionId: opts?.institutionId || undefined,
    feature: 'thumbs',
  })
}

export function trackFaqOpen(faqId: string) {
  track('faq_open', { faqId, feature: 'faq' })
}

export function trackFeature(feature: string, path?: string) {
  track('feature_use', { feature, path })
}

export function trackInstitution(institutionId: string) {
  track('institution_set', { institutionId, feature: 'institution_select' })
}

export async function fetchAnalyticsStats(adminKey: string): Promise<AnalyticsStats | null> {
  try {
    const res = await fetch('/api/analytics/stats', {
      headers: { 'x-admin-key': adminKey },
    })
    if (!res.ok) return null
    return (await res.json()) as AnalyticsStats
  } catch {
    return null
  }
}
