import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, adminAuthorized, rateLimitOr429 } from '../lib/security'

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
  applyCors(req, res, 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!rateLimitOr429(req, res, 'analytics-stats', 30, 60_000)) return
  if (!adminAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  const today = dayKey(new Date())
  const last7 = daysBack(7)
  const last30 = daysBack(30)

  if (!redisConfigured()) {
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
    const counterKeys = [
      'nsg:analytics:users',
      'nsg:analytics:sessions',
      'nsg:analytics:pageViews',
      'nsg:analytics:aiConversations',
      'nsg:analytics:aiQuestions',
      'nsg:analytics:imageAnalyses',
      'nsg:analytics:faqOpens',
      'nsg:analytics:unresolvedAi',
      'nsg:analytics:unknownAi',
      'nsg:analytics:resolutionClosed',
      'nsg:analytics:escalationFired',
      'nsg:analytics:feedbackUp',
      'nsg:analytics:feedbackDown',
    ]

    const pipeline: unknown[][] = [
      ['SCARD', 'nsg:analytics:users'],
      ['SCARD', 'nsg:analytics:sessions'],
      ...counterKeys.slice(2).map((k) => ['GET', k]),
      ['SCARD', `nsg:analytics:dau:${today}`],
      ...last7.map((d) => ['SCARD', `nsg:analytics:dau:${d}`]),
      ...last30.map((d) => ['SCARD', `nsg:analytics:dau:${d}`]),
      ['ZREVRANGE', 'nsg:analytics:intents', 0, 19, 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:institutions', 0, 19, 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:pages', 0, 19, 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:features', 0, 19, 'WITHSCORES'],
      ['ZREVRANGE', 'nsg:analytics:unknownTopics', 0, 19, 'WITHSCORES'],
      ...last7.flatMap((d) => [
        ['SCARD', `nsg:analytics:dau:${d}`],
        ['GET', `nsg:analytics:day:${d}:sessions`],
        ['GET', `nsg:analytics:day:${d}:aiQuestions`],
        ['GET', `nsg:analytics:day:${d}:unknownAi`],
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
    i += last7.length + last30.length

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
        week: 0,
        month: 0,
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
