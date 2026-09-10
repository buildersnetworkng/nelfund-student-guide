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

let flushTimer: ReturnType<typeof setTimeout> | null = null

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
    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    if (!res.ok) {
      const existing = loadQueue()
      saveQueue([...events, ...existing].slice(-MAX_QUEUE))
    }
  } catch {
    const existing = loadQueue()
    saveQueue([...events, ...existing].slice(-MAX_QUEUE))
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushQueue()
  }, 1200)
}

export function track(name: AnalyticsEventName, payload: Omit<AnalyticsEventPayload, 'name' | 'ts'> = {}) {
  const event: AnalyticsEventPayload = {
    name,
    ts: new Date().toISOString(),
    path: payload.path || (typeof location !== 'undefined' ? location.pathname : undefined),
    intent: payload.intent,
    institutionId: payload.institutionId,
    feature: payload.feature,
    faqId: payload.faqId,
    unresolved: payload.unresolved,
    hasImage: payload.hasImage,
    topic: payload.topic,
    meta: sanitizeMeta(payload.meta),
  }
  const q = loadQueue()
  q.push(event)
  saveQueue(q)
  scheduleFlush()
}

/** Coarse topic buckets only — never stores the student question text. */
export function deriveUnknownTopic(userText?: string | null): string {
  const t = (userText || '').toLowerCase().trim()
  if (!t || t.length < 2) return 'empty'
  if (/jamb/.test(t)) return 'jamb'
  if (/nin/.test(t)) return 'nin'
  if (/pending|status|under\s*review|how\s*far|nothing\s*dey/.test(t)) return 'pending-status'
  if (/reject|declined|not\s*approved/.test(t)) return 'rejection'
  if (/school\s*(not|no)|not\s*show|institution\s*not/.test(t)) return 'school-list'
  if (/upkeep|20\s*k|allowance/.test(t)) return 'upkeep'
  if (/fee|tuition|charges/.test(t)) return 'fees'
  if (/repay|gsi|pay\s*back/.test(t)) return 'repayment'
  if (/open|deadline|window|apply\s*today|latest\s*update|expire|bvn/.test(t)) return 'open-status'
  if (/login|password|otp|sign\s*in|portal/.test(t)) return 'login-portal'
  if (/contact|email|phone|who\s*do\s*i|esupport|ticket|helpline/.test(t)) return 'contacts'
  if (/draft|write\s*(an?\s*)?(email|message)/.test(t)) return 'email-draft'
  if (/eligib|qualify|disqualif/.test(t)) return 'eligibility'
  if (/screenshot|error|what\s*does\s*this\s*mean|unable\s*to|try\s*again|500|404/.test(t)) return 'error-screenshot'
  if (/hello|hi\b|help|abeg|please|wahala|stuck|how\s*far|wetin|good\s*(morning|afternoon|evening)/.test(t) && t.length < 48)
    return 'greeting-vague'
  if (/disburse|payment|money\s*enter|when\s*will\s*i\s*get/.test(t)) return 'disbursement'
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
  return 'other'
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
  const intent = opts.intent || 'unknown'
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

export function trackFeature(feature: string, meta?: Record<string, string | number | boolean | null>) {
  track('feature_use', { feature, meta })
}

export async function flushAnalytics(): Promise<boolean> {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  try {
    await flushQueue()
    return true
  } catch {
    return false
  }
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
