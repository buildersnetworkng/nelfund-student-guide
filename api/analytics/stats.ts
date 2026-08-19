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
  return process.env.UPSTASH_REDIS_REST_URL || 'https://premium-rooster-109704.upstash.io'
}

function redisToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAayIAQIgcDE2YWZkNzllZDIxN2I0MjA5YWIwNDQ1OGFjNTY0MGUzNg'
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
  const expected = process.env.ANALYTICS_ADMIN_KEY || 'nelfund-admin-2026'
  const provided = req.headers['x-admin-key']
  return typeof provided === 'string' && provided.length > 0 && provided === expected
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

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!adminAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  const today = dayKey(new Date())
  const last7 = daysBack(7)
  const last30 = daysBack(30)

  try {
    if (redisConfigured()) {
      const [
        uniqueUsers,
        dauToday,
        sessionsToday,
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
        topIntents,
        topInstitutions,
        topPages,
        topFeatures,
        topUnknownTopics,
      ] = await redisPipeline([
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
        ['ZREVRANGE', 'nsg:z:intents', 0, 14, 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:institutions', 0, 14, 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:pages', 0, 14, 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:features', 0, 14, 'WITHSCORES'],
        ['ZREVRANGE', 'nsg:z:unknown_topics', 0, 14, 'WITHSCORES'],
      ])

      const weekUnionKey = `nsg:tmp:wau:${today}`
      const monthUnionKey = `nsg:tmp:mau:${today}`
      await redisPipeline([
        ['SUNIONSTORE', weekUnionKey, ...last7.map((d) => `nsg:dau:${d}`)],
        ['EXPIRE', weekUnionKey, 300],
        ['SUNIONSTORE', monthUnionKey, ...last30.map((d) => `nsg:dau:${d}`)],
        ['EXPIRE', monthUnionKey, 300],
      ])
      const [weekUsers, monthUsers] = await redisPipeline([
        ['SCARD', weekUnionKey],
        ['SCARD', monthUnionKey],
      ])

      const dailyCmds: unknown[][] = []
      for (const d of last7.slice().reverse()) {
        dailyCmds.push(['SCARD', `nsg:dau:${d}`])
        dailyCmds.push(['SCARD', `nsg:sessions:${d}`])
        dailyCmds.push(['GET', `nsg:day:${d}:ai_question`])
      }
      const dailyRaw = await redisPipeline(dailyCmds)
      const daily = last7
        .slice()
        .reverse()
        .map((date, i) => ({
          date,
          users: Number(dailyRaw[i * 3] || 0),
          sessions: Number(dailyRaw[i * 3 + 1] || 0),
          aiQuestions: Number(dailyRaw[i * 3 + 2] || 0),
        }))

      const toPairs = (arr: unknown): Array<{ key: string; count: number }> => {
        if (!Array.isArray(arr)) return []
        const out: Array<{ key: string; count: number }> = []
        for (let i = 0; i < arr.length; i += 2) {
          out.push({ key: String(arr[i]), count: Number(arr[i + 1] || 0) })
        }
        return out
      }

      let sessionsTotal = 0
      try {
        sessionsTotal = Number((await redisCmd(['GET', 'nsg:counters:sessions_total'])) || 0)
      } catch {
        sessionsTotal = Number(sessionsToday || 0)
      }

      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        totals: {
          uniqueUsers: Number(uniqueUsers || 0),
          sessions: sessionsTotal,
          pageViews: Number(pageViews || 0),
          aiConversations: Number(aiConversations || 0),
          aiQuestions: Number(aiQuestions || 0),
          imageAnalyses: Number(imageAnalyses || 0),
          faqOpens: Number(faqOpens || 0),
          unresolvedAi: Number(unresolvedAi || 0),
          unknownAi: Number(unknownAi || 0),
          resolutionClosed: Number(resolutionClosed || 0),
          escalationFired: Number(escalationFired || 0),
          feedbackUp: Number(feedbackUp || 0),
          feedbackDown: Number(feedbackDown || 0),
        },
        active: {
          today: Number(dauToday || 0),
          week: Number(weekUsers || 0),
          month: Number(monthUsers || 0),
        },
        topIntents: toPairs(topIntents),
        topInstitutions: toPairs(topInstitutions),
        topPages: toPairs(topPages),
        topFeatures: toPairs(topFeatures),
        topUnknownTopics: toPairs(topUnknownTopics),
        daily,
        storage: 'redis',
      })
    }

    const s = memStore()
    if (!s) {
      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        totals: { ...emptyTotals },
        active: { today: 0, week: 0, month: 0 },
        topIntents: [],
        topInstitutions: [],
        topPages: [],
        topFeatures: [],
        topUnknownTopics: [],
        daily: last7
          .slice()
          .reverse()
          .map((date) => ({ date, users: 0, sessions: 0, aiQuestions: 0 })),
        storage: 'unavailable',
      })
    }

    const get = (k: string) => s.counters.get(k) || 0
    const fromPrefix = (prefix: string) =>
      [...s.counters.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

    const weekUsers = new Set<string>()
    const monthUsers = new Set<string>()
    for (const d of last7) {
      const set = s.dau.get(d)
      if (set) set.forEach((u) => weekUsers.add(u))
    }
    for (const d of last30) {
      const set = s.dau.get(d)
      if (set) set.forEach((u) => monthUsers.add(u))
    }

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
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
        week: weekUsers.size,
        month: monthUsers.size,
      },
      topIntents: fromPrefix('intent:'),
      topInstitutions: fromPrefix('institution:'),
      topPages: fromPrefix('page:'),
      topFeatures: fromPrefix('feature:'),
      topUnknownTopics: fromPrefix('unknown_topic:'),
      daily: last7
        .slice()
        .reverse()
        .map((date) => ({
          date,
          users: s.dau.get(date)?.size || 0,
          sessions: [...s.sessions].filter((x) => x.startsWith(`${date}:`)).length,
          aiQuestions: get(`day:${date}:ai_question`),
        })),
      storage: 'memory',
    })
  } catch (err) {
    console.error('[analytics/stats]', err)
    return res.status(500).json({ error: 'Failed to load stats' })
  }
}

// deploy-marker: pilot-quality-counters 2026-08-19
