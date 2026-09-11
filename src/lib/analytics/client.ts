/**
 * Privacy-conscious analytics client.
 * - Anonymous user id / session id
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
    if (typeof v === 'string' && v.length > 80) out[k] = v.slice(0, 80)
    else out[k] = v
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

async function flushQueue() {
  const events = loadQueue()
  if (!events.length) return
  saveQueue([])
  try {
    const body: TrackBody = {
      uid: getAnonymousUserId(),
      sid: getSessionId(),
      events,
    }
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
  } catch {
    const existing = loadQueue()
    saveQueue([...events, ...existing].slice(-MAX_QUEUE))
  }
}

export function track(
  name: AnalyticsEventName,
  meta?: {
    path?: string
    intent?: string | null
    institutionId?: string | null
    feature?: string | null
    faqId?: string | null
    unresolved?: boolean
    hasImage?: boolean
    topic?: string | null
  },
) {
  const payload: AnalyticsEventPayload = {
    name,
    ts: new Date().toISOString(),
    path: meta?.path,
    intent: meta?.intent || undefined,
    institutionId: meta?.institutionId || undefined,
    feature: meta?.feature || undefined,
    faqId: meta?.faqId || undefined,
    unresolved: meta?.unresolved,
    hasImage: meta?.hasImage,
    topic: meta?.topic || undefined,
  }
  const q = loadQueue()
  q.push(payload)
  saveQueue(q)
  void flushQueue()
}

export function deriveUnknownTopic(userText?: string | null): string {
  const t = (userText || '').toLowerCase().trim()
  if (!t) return 'empty'
  if (/pending|under\s*review|status|how\s*far|never\s*(pay|see|come)/.test(t)) return 'pending-status'
  if (/jamb|utme|verification\s*fail|invalid\s*format/.test(t)) return 'jamb'
  if (/open|deadline|still\s*accept|as\s*of/.test(t)) return 'open-status'
  if (/repay|gsi|nysc|10\s*%/.test(t)) return 'repayment'
  if (/account\s*creat|create\s*account|register|sign\s*up/.test(t)) return 'account-create'
  if (/password|reset\s*password|forgot/.test(t)) return 'password-reset'
  if (/approv|not\s*yet\s*approv/.test(t)) return 'approval'
  if (/matric|admission\s*letter|documents?|paper/.test(t)) return 'documents'
  if (/level|fresher|100|200|300|400|undergraduate|poly/.test(t)) return 'eligibility-level'
  if (/what\s*is|wetin\s*be|explain|about\s*nelfund|understand/.test(t)) return 'what-is'
  if (/upload|school\s*data|institution\s*verif/.test(t)) return 'upload'
  if (/dashboard|total\s*loans|signed\s*in|welcome\s*to\s*student/.test(t)) return 'dashboard'
  if (/scam|agent|whatsapp|pay\s*\d/.test(t)) return 'scam-safety'
  if (/unilag|lasu|oou|yabatech|unilorin|uniben|school\s*name|my\s*school/.test(t)) return 'institution'
  if (/how\s*to\s*apply|steps?\s*to|register|i\s*wan\s*apply/.test(t)) return 'how-to-apply'
  if (/abeg|wetin|wahala|e\s*no\s*dey|i\s*wan|una\s*fit/.test(t)) return 'pidgin-help'
  if (/,|;|\band\b.*\band\b|also.*plus/.test(t) && t.length > 80) return 'multi-issue'
  if (t.length < 3) return 'empty'
  if (/nelfund|loan|school|help|please|guide|assist|issue|problem/.test(t)) return 'guidance'
  if (/link|website|url|official|nelf\.gov/.test(t)) return 'official-links'
  if (/poly|university|college|campus|faculty/.test(t)) return 'institution'
  if (/pidgin|abeg|wetin|una|dey/.test(t)) return 'pidgin-help'
  if (t.length > 120) return 'multi-issue'
  if (/\?/.test(t) || /what|how|when|why|who|where/.test(t)) return 'guidance'
  if (/[a-z]{3,}/.test(t)) return 'guidance'
  if (/\d{4,}/.test(t)) return 'pending-status'
  if (/[?؟]/.test(t)) return 'guidance'
  return 'guidance'
}

/** Never persist the historical catch-all bucket name. */
export function normalizeUnknownTopic(topic?: string | null): string {
  if (!topic || topic === 'other' || topic === 'greeting-vague') return 'guidance'
  return topic
}

function isUnknownIntent(intent?: string | null): boolean {
  if (!intent) return true
  const i = intent.toLowerCase()
  return i === 'unknown' || i === 'offline:unknown' || i.endsWith(':unknown')
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
  const intent = opts.intent && String(opts.intent).trim() ? opts.intent : 'current-information'
  const unknown = isUnknownIntent(intent)
  const topic = unknown || opts.unresolved ? normalizeUnknownTopic(deriveUnknownTopic(opts.userText)) : undefined

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
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  }
  if (opts.unresolved || unknown) {
    track('ai_unresolved', {
      intent,
      institutionId: opts.institutionId || undefined,
      topic,
    })
  } else if (opts.resolutionClosed) {
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

export function trackFeedback(
  vote: 'up' | 'down',
  opts?: { intent?: string | null; institutionId?: string | null },
) {
  track(vote === 'up' ? 'ai_feedback_up' : 'ai_feedback_down', {
    intent: opts?.intent || undefined,
    institutionId: opts?.institutionId || undefined,
    feature: 'thumbs',
  })
}

export function trackPageView(path?: string) {
  track('page_view', { path: path || (typeof location !== 'undefined' ? location.pathname : '/') })
}

export function trackSessionStart() {
  track('session_start')
}

export function trackFaqOpen(faqId: string) {
  track('faq_open', { faqId, feature: 'faq' })
}

export type { AnalyticsStats }
