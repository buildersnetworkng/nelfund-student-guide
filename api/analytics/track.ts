import type { VercelRequest, VercelResponse } from '@vercel/node'

type EventPayload = {
  name: string
  ts?: string
  path?: string
  intent?: string
  institutionId?: string
  feature?: string
  faqId?: string
  unresolved?: boolean
  hasImage?: boolean
  topic?: string
}

type TrackBody = {
  uid?: string
  sid?: string
  events?: EventPayload[]
}

const SENSITIVE = /\b(password|passwd|otp|pin|bvn|nin|account\s*number|matriculation|bank\s*account)\b/i

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function redisUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || ''
}

function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || ''
}

function redisConfigured(): boolean {
  return !!(redisUrl() && redisToken())
}

async function redisPipeline(commands: unknown[][]): Promise<unknown> {
  const url = redisUrl()
  const token = redisToken()
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Redis pipeline failed: ${res.status} ${text}`)
  }
  return res.json()
}

const mem = globalThis as unknown as {
  __nsgAnalytics?: {
    users: Set<string>
    sessions: Set<string>
    dau: Map<string, Set<string>>
    counters: Map<string, number>
  }
}

function memStore() {
  if (!mem.__nsgAnalytics) {
    mem.__nsgAnalytics = {
      users: new Set(),
      sessions: new Set(),
      dau: new Map(),
      counters: new Map(),
    }
  }
  return mem.__nsgAnalytics
}

function memIncr(key: string, by = 1) {
  const s = memStore()
  s.counters.set(key, (s.counters.get(key) || 0) + by)
}

function sanitizeId(v: unknown, max = 64): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  if (!t || SENSITIVE.test(t)) return null
  return t
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body: TrackBody
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const uid = sanitizeId(body.uid, 80)
  const sid = sanitizeId(body.sid, 80)
  const events = Array.isArray(body.events) ? body.events.slice(0, 25) : []

  if (!uid || !sid || !events.length) {
    return res.status(400).json({ error: 'uid, sid, and events required' })
  }

  const today = dayKey()
  const commands: unknown[][] = []
  const useRedis = redisConfigured()

  if (useRedis) {
    commands.push(['SADD', 'nsg:users', uid])
    commands.push(['SADD', `nsg:dau:${today}`, uid])
    commands.push(['SADD', `nsg:sessions:${today}`, sid])
    commands.push(['INCR', 'nsg:counters:sessions_total'])
    commands.push(['EXPIRE', `nsg:dau:${today}`, 60 * 60 * 24 * 400])
    commands.push(['EXPIRE', `nsg:sessions:${today}`, 60 * 60 * 24 * 400])
  } else {
    const s = memStore()
    s.users.add(uid)
    if (!s.dau.has(today)) s.dau.set(today, new Set())
    s.dau.get(today)!.add(uid)
    s.sessions.add(`${today}:${sid}`)
    memIncr('sessions_total')
  }

  for (const ev of events) {
    const name = sanitizeId(ev.name, 40)
    if (!name) continue

    if (useRedis) {
      commands.push(['INCR', `nsg:counters:${name}`])
      commands.push(['INCR', `nsg:day:${today}:${name}`])
      commands.push(['EXPIRE', `nsg:day:${today}:${name}`, 60 * 60 * 24 * 400])
    } else {
      memIncr(name)
      memIncr(`day:${today}:${name}`)
    }

    if (ev.path) {
      const path = sanitizeId(ev.path, 120)
      if (path) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:pages', 1, path])
        else memIncr(`page:${path}`)
      }
    }
    if (ev.intent) {
      const intent = sanitizeId(ev.intent, 64)
      if (intent) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:intents', 1, intent])
        else memIncr(`intent:${intent}`)
      }
    }
    if (ev.institutionId) {
      const inst = sanitizeId(ev.institutionId, 64)
      if (inst) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:institutions', 1, inst])
        else memIncr(`institution:${inst}`)
      }
    }
    if (ev.feature) {
      const feature = sanitizeId(ev.feature, 64)
      if (feature) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:features', 1, feature])
        else memIncr(`feature:${feature}`)
      }
    }
    if (ev.faqId) {
      const faqId = sanitizeId(ev.faqId, 64)
      if (faqId) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:faqs', 1, faqId])
        else memIncr(`faq:${faqId}`)
      }
    }
    if (ev.topic) {
      const topic = sanitizeId(ev.topic, 48)
      if (topic) {
        if (useRedis) commands.push(['ZINCRBY', 'nsg:z:unknown_topics', 1, topic])
        else memIncr(`unknown_topic:${topic}`)
      }
    }
    // Unknown session tracking only. Counter for ai_unknown is already incremented above
    // when name === 'ai_unknown' (client sends a dedicated event). Do not double-count.
    if (name === 'ai_unknown') {
      if (useRedis) {
        commands.push(['SADD', `nsg:unknown_sessions:${today}`, sid])
        commands.push(['EXPIRE', `nsg:unknown_sessions:${today}`, 60 * 60 * 24 * 400])
      }
    }
  }

  try {
    if (useRedis && commands.length) {
      await redisPipeline(commands)
    }
    return res.status(204).end()
  } catch (err) {
    console.error('[analytics/track]', err)
    return res.status(500).json({ error: 'Failed to store events' })
  }
}
