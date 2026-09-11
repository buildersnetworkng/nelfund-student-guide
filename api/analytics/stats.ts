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

const emptyTotals = {
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

  if (!redisConfigured()) {
    const store = memStore()
    if (store) {
      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        storage: 'memory',
        totals: {
          uniqueUsers: store.users.size,
          sessions: store.sessions.size,
          pageViews: store.counters.get('pageViews') || 0,
          aiConversations: store.counters.get('aiConversations') || 0,
          aiQuestions: store.counters.get('aiQuestions') || 0,
          imageAnalyses: store.counters.get('imageAnalyses') || 0,
          faqOpens: store.counters.get('faqOpens') || 0,
          unresolvedAi: store.counters.get('unresolvedAi') || 0,
          unknownAi: store.counters.get('unknownAi') || 0,
          resolutionClosed: store.counters.get('resolutionClosed') || 0,
          escalationFired: store.counters.get('escalationFired') || 0,
          feedbackUp: store.counters.get('feedbackUp') || 0,
          feedbackDown: store.counters.get('feedbackDown') || 0,
        },
        active: {
          today: store.dau.get(today)?.size || 0,
          week: 0,
          month: 0,
        },
        topIntents: [],
        topInstitutions: [],
        topPages: [],
        topFeatures: [],
        topUnknownTopics: [],
        daily: last7.map((date) => ({
          date,
          users: store.dau.get(date)?.size || 0,
          sessions: 0,
          aiQuestions: 0,
          unknownAi: 0,
        })),
      })
    }
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      storage: 'none',
      totals: emptyTotals,
      active: { today: 0, week: 0, month: 0 },
      topIntents: [],
      topInstitutions: [],
      topPages: [],
      topFeatures: [],
      topUnknownTopics: [],
      daily: last7.map((date) => ({ date, users: 0, sessions: 0, aiQuestions: 0, unknownAi: 0 })),
    })
  }

  try {
    const pipeline: unknown[][] = [
      ['SCARD', 'nsg:analytics:users'],
      ['SCARD', 'nsg:analytics:sessions'],
      ['GET', 'nsg:analytics:pageViews'],
      ['GET', 'nsg:analytics:aiConversations'],
      ['GET', 'nsg:analytics:aiQuestions'],
      ['GET', 'nsg:analytics:imageAnalyses'],
      ['GET', 'nsg:analytics:faqOpens'],
      ['GET', 'nsg:analytics:unresolvedAi'],
      ['GET', 'nsg:analytics:unknownAi'],
      ['GET', 'nsg:analytics:resolutionClosed'],
      ['GET', 'nsg:analytics:escalationFired'],
      ['GET', 'nsg:analytics:feedbackUp'],
      ['GET', 'nsg:analytics:feedbackDown'],
      ['SCARD', `nsg:analytics:dau:${today}`],
      ...last7.map((d) => ['SCARD', `nsg:analytics:dau:${d}`] as unknown[]),
      ...last30.map((d) => ['SCARD', `nsg:analytics:dau:${d}`] as unknown[]),
      ['ZREVRANGE', 'nsg:analytics:intents', '0', '19', 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:institutions', '0', '19', 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:pages', '0', '19', 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:features', '0', '19', 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:unknownTopics', '0', '19', 'WITHSCORES'],
      ...last7.flatMap((d) => [
        ['SCARD', `nsg:analytics:dau:${d}`] as unknown[],
        ['GET', `nsg:analytics:day:${d}:sessions`] as unknown[],
        ['GET', `nsg:analytics:day:${d}:aiQuestions`] as unknown[],
        ['GET', `nsg:analytics:day:${d}:unknownAi`] as unknown[],
      ]),
    ]

    const results = await redisPipeline(pipeline)
    let i = 0
    const uniqueUsers = Number(results[i++] || 0)
    const sessions = Number(results[i++] || 0)
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
    const todayActive = Number(results[i++] || 0)
    const weekSets = last7.map(() => Number(results[i++] || 0))
    const monthSets = last30.map(() => Number(results[i++] || 0))

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

    const daily = last7.map((date) => {
      const users = Number(results[i++] || 0)
      const sess = Number(results[i++] || 0)
      const aq = Number(results[i++] || 0)
      const uk = Number(results[i++] || 0)
      return { date, users, sessions: sess, aiQuestions: aq, unknownAi: uk }
    })

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      storage: 'redis',
      totals: {
        uniqueUsers,
        sessions,
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
      active: {
        today: todayActive,
        week: weekSets.reduce((a, b) => a + b, 0),
        month: monthSets.reduce((a, b) => a + b, 0),
      },
      topIntents,
      topInstitutions,
      topPages,
      topFeatures,
      topUnknownTopics,
      daily,
    })
  } catch (err) {
    console.error('[analytics/stats]', err)
    return res.status(500).json({ error: 'stats_failed' })
  }
}
