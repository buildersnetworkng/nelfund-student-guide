/**
 * Privacy-conscious analytics client.
 *
 * - Anonymous user id in localStorage (survives refresh; not a new user each load)
 * - Session id in sessionStorage (new tab/session = new session)
 * - Never sends passwords, OTPs, BVN, NIN, bank details, or free-text questions
 * - Only coarse intents, paths, feature names, institution ids
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
    events,
  }

  const payload = JSON.stringify(body)

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }))
      if (ok) return true
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    const q = loadQueue()
    if (!q.length) return
    void flush(q).then((ok) => {
      if (ok) saveQueue([])
    })
  }, 600)
}

export function track(name: AnalyticsEventName, partial: Omit<AnalyticsEventPayload, 'name' | 'ts'> = {}) {
  if (typeof window === 'undefined') return

  const event: AnalyticsEventPayload = {
    name,
    ts: new Date().toISOString(),
    path: partial.path,
    intent: partial.intent ? String(partial.intent).slice(0, 64) : undefined,
    institutionId: partial.institutionId ? String(partial.institutionId).slice(0, 64) : undefined,
    feature: partial.feature ? String(partial.feature).slice(0, 64) : undefined,
    faqId: partial.faqId ? String(partial.faqId).slice(0, 64) : undefined,
    unresolved: partial.unresolved,
    hasImage: partial.hasImage,
    meta: sanitizeMeta(partial.meta),
  }

  if (event.meta && 'text' in event.meta) delete event.meta.text
  if (event.meta && 'question' in event.meta) delete event.meta.question

  const q = loadQueue()
  q.push(event)
  saveQueue(q)
  scheduleFlush()
}

let sessionStarted = false

export function trackSessionStart() {
  if (sessionStarted) return
  sessionStarted = true
  getAnonymousUserId()
  getSessionId()
  track('session_start', {
    path: typeof window !== 'undefined' ? window.location.hash || window.location.pathname : '/',
  })
}

export function trackPageView(path: string) {
  track('page_view', { path: path.slice(0, 120) })
}

export function trackAiQuestion(opts: {
  intent?: string | null
  institutionId?: string | null
  hasImage?: boolean
  unresolved?: boolean
  isNewConversation?: boolean
}) {
  if (opts.isNewConversation) {
    track('ai_conversation_start', {
      intent: opts.intent || undefined,
      institutionId: opts.institutionId || undefined,
    })
  }
  track('ai_question', {
    intent: opts.intent || undefined,
    institutionId: opts.institutionId || undefined,
    hasImage: !!opts.hasImage,
    unresolved: !!opts.unresolved,
  })
  if (opts.hasImage) {
    track('ai_image_analysis', {
      intent: opts.intent || undefined,
      institutionId: opts.institutionId || undefined,
    })
  }
  if (opts.unresolved) {
    track('ai_unresolved', {
      intent: opts.intent || undefined,
      institutionId: opts.institutionId || undefined,
    })
  } else if (opts.intent && opts.intent !== 'unknown') {
    track('ai_resolved', {
      intent: opts.intent,
      institutionId: opts.institutionId || undefined,
    })
  }
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

export function flushAnalytics() {
  const q = loadQueue()
  if (!q.length) return
  void flush(q).then((ok) => {
    if (ok) saveQueue([])
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAnalytics()
  })
  window.addEventListener('pagehide', () => flushAnalytics())
}
