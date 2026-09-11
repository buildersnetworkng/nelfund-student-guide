import type { VercelRequest, VercelResponse } from '@vercel/node'

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBack(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(dayKey(d))
  }
  return out
}

function redisUrl(): string {
  return (process.env.UPSTASH_REDIS_REST_URL || '').trim()
}

function redisToken(): string {
  return (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
}

function redisConfigured(): boolean {
  return !!(redisUrl() && redisToken())
}

async function redisCmd(command: unknown[]): Promise<unknown> {
  const url = redisUrl()
  const token = redisToken()
  const path = command.map((c) => encodeURIComponent(String(c))).join('/')
  const res = await fetch(`${url}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const json = (await res.json()) as { result: unknown }
  return json.result
}

async function redisPipeline(commands: unknown[][]): Promise<unknown[]> {
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
  if (!res.ok) throw new Error(`Redis pipeline ${res.status}`)
  const json = (await res.json()) as Array<{ result: unknown }>
  return json.map((r) => r.result)
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
  return mem.__nsgAnalytics
}

function adminAuthorized(req: VercelRequest): boolean {
  const expected = (process.env.ANALYTICS_ADMIN_KEY || '').trim()
  if (!expected || expected.length < 24) return false
  const provided = req.headers['x-admin-key']
  if (typeof provided !== 'string' || !provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!adminAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  const today = dayKey(new Date())
  const last7 = daysBack(7)
  const last30 = daysBack(30)

  try {
    if (redisConfigured()) {
      const weekUnionKey = `nsg:tmp:wau:${today}`
      const monthUnionKey = `nsg:tmp:mau:${today}`

      const baseCmds: unknown[][] = [
        ['SCARD', 'nsg:users'],
        ['SCARD', `nsg:dau:${today}`],
        ['SCARD', `nsg:sessions:${today}`],
        ['GET', 'nsg:counters:page_view'],
        ['GET', 'nsg:counters:ai_conversation_start'],
        ['GET', 'nsg:counters:ai_question'],
        ['GET', 'nsg:counters:ai_image_analysis'],
        ['GET', 'nsg:counters:faq_open'],
        ['GET', 'nsg:counters:ai_unresolved'],
        ['GET', 'nsg:counters:ai_unknown'],
        ['GET', 'nsg:counters:ai_resolution_closed'],
        ['GET', 'nsg:counters:ai_escalation_fired'],
        ['GET', 'nsg:counters:ai_feedback_up'],
        ['GET', 'nsg:counters:ai_feedback_down'],
        ['ZREVRANGE', 'nsg:z:intents', '0', '14', 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:institutions', '0', '14', 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:pages', '0', '14', 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:features', '0', '14', 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:unknown_topics', '0', '14', 'WITHSCORES'],
        ['SUNIONSTORE', weekUnionKey, ...last7.map((d) => `nsg:dau:${d}`)],
        ['SUNIONSTORE', monthUnionKey, ...last30.map((d) => `nsg:dau:${d}`)],
        ['SCARD', weekUnionKey],
        ['SCARD', monthUnionKey],
        ['GET', 'nsg:counters:sessions_total'],
      ]

      const dailyCmds: unknown[][] = []
      for (const d of last7) {
        dailyCmds.push(['SCARD', `nsg:dau:${d}`])
        dailyCmds.push(['SCARD', `nsg:sessions:${d}`])
        dailyCmds.push(['GET', `nsg:day:${d}:ai_question`])
      }

      const results = await redisPipeline([...baseCmds, ...dailyCmds])
      let i = 0
      const uniqueUsers = Number(results[i++] || 0)
      const todayUsers = Number(results[i++] || 0)
      const todaySessions = Number(results[i++] || 0)
      const pageViews = Number(results[i++] || 0)
      const aiConversations = Number(results[i++] || 0)
      const aiQuestions = Number(results[i++] || 0)
      const imageAnalyses = Number(results[i++] || 0)
      const faqOpens = Number(results[i++] || 0)
      const unresolvedAi = Number(results[i++] || 0)
      const unknownAi = Number(results[i++] || 0)
      const resolutionClosed = Number(results[i++] || 0)
      const escalationFired = Number(results[i++] || 0)
      const feedbackUp = Number(results[i++] || 0)
      const feedbackDown = Number(results[i++] || 0)

      function parseZ(raw: unknown): Array<{ key: string; count: number }> {
        if (!Array.isArray(raw)) return []
        const out: Array<{ key: string; count: number }> = []
        for (let j = 0; j < raw.length; j += 2) {
          out.push({ key: String(raw[j]), count: Number(raw[j + 1] || 0) })
        }
        return out
      }

      const topIntents = parseZ(results[i++])
      const topInstitutions = parseZ(results[i++])
      const topPages = parseZ(results[i++])
      const topFeatures = parseZ(results[i++])
      const topUnknownTopics = parseZ(results[i++])
      i += 2 // SUNIONSTORE results
      const week = Number(results[i++] || 0)
      const month = Number(results[i++] || 0)
      const sessionsTotal = Number(results[i++] || 0)

      const daily = last7.map((date) => {
        const users = Number(results[i++] || 0)
        const sessions = Number(results[i++] || 0)
        const aq = Number(results[i++] || 0)
        return { date, users, sessions, aiQuestions: aq }
      })

      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        storage: 'redis',
        totals: {
          uniqueUsers,
          sessions: sessionsTotal || todaySessions,
          pageViews,
          aiConversations,
          aiQuestions,
          imageAnalyses,
          faqOpens,
          unresolvedAi,
          unknownAi,
          resolutionClosed,
          escalationFired,
          feedbackUp,
          feedbackDown,
        },
        active: { today: todayUsers, week, month },
        topIntents,
        topInstitutions,
        topPages,
        topFeatures,
        topUnknownTopics,
        daily: daily.slice().reverse(),
      })
    }

    // memory fallback
    const s = memStore()
    if (!s) {
      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        totals: {
          uniqueUsers: 0,
          sessions: 0,
          pageViews: 0,
          aiConversations: 0,
          aiQuestions: 0,
          imageAnalyses: 0,
          faqOpens: 0,
          unresolvedAi: 0,
          unknownAi: 0,
          resolutionClosed: 0,
          escalationFired: 0,
          feedbackUp: 0,
          feedbackDown: 0,
        },
        active: { today: 0, week: 0, month: 0 },
        topIntents: [],
        topInstitutions: [],
        topPages: [],
        topFeatures: [],
        topUnknownTopics: [],
        daily: last7.slice().reverse().map((date) => ({ date, users: 0, sessions: 0, aiQuestions: 0 })),
        storage: 'unavailable',
      })
    }

    const get = (k: string) => s.counters.get(k) || 0
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      storage: 'memory',
      totals: {
        uniqueUsers: s.users.size,
        sessions: get('sessions_total') || s.sessions.size,
        pageViews: get('page_view'),
        aiConversations: get('ai_conversation_start'),
        aiQuestions: get('ai_question'),
        imageAnalyses: get('ai_image_analysis'),
        faqOpens: get('faq_open'),
        unresolvedAi: get('ai_unresolved'),
        unknownAi: get('ai_unknown'),
        resolutionClosed: get('ai_resolution_closed'),
        escalationFired: get('ai_escalation_fired'),
        feedbackUp: get('ai_feedback_up'),
        feedbackDown: get('ai_feedback_down'),
      },
      active: {
        today: s.dau.get(today)?.size || 0,
        week: 0,
        month: 0,
      },
      topIntents: [],
      topInstitutions: [],
      topPages: [],
      topFeatures: [],
      topUnknownTopics: [],
      daily: last7.slice().reverse().map((date) => ({
        date,
        users: s.dau.get(date)?.size || 0,
        sessions: 0,
        aiQuestions: get(`day:${date}:ai_question`),
      })),
    })
  } catch (err) {
    console.error('[analytics/stats]', err)
    return res.status(500).json({ error: 'Failed to load stats' })
  }
}
