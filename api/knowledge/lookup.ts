import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Live official-source lookup for time-sensitive NELFUND questions.
 * Fetches nelf.gov.ng / portal.nelf.gov.ng, extracts plain text, and returns
 * short grounded snippets — never invents policy.
 */

const OFFICIAL = [
  { id: 'nelfund-website', label: 'NELFUND official website', url: 'https://nelf.gov.ng/' },
  { id: 'nelfund-portal', label: 'NELFUND application portal', url: 'https://portal.nelf.gov.ng/' },
] as const

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url: string): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'NELFUND-Student-Guide/1.0 (+https://nelfund-student-guide.vercel.app; knowledge-lookup)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { ok: false, text: '' }
    const html = await res.text()
    return { ok: true, text: stripHtml(html).slice(0, 60000) }
  } catch {
    return { ok: false, text: '' }
  }
}

function extractSnippets(text: string, query: string, max = 3): string[] {
  if (!text) return []
  const q = query.toLowerCase()
  const terms = q
    .split(/[^a-z0-9/]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !['the', 'and', 'for', 'what', 'who', 'how', 'when', 'is', 'are', 'does', 'nelfund'].includes(t))

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 420)

  const scored = sentences.map((s) => {
    const lower = s.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (lower.includes(t)) score += 2
    }
    if (/\b(apply|application|student\s+loan|upkeep|portal|eligible|disburse)\b/i.test(s)) score += 1
    if (/\b(2025|2026|2027|deadline|open|closed|announce)\b/i.test(s)) score += 2
    return { s, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q =
    (typeof req.query.q === 'string' ? req.query.q : '') ||
    (typeof req.body?.q === 'string' ? req.body.q : '') ||
    (typeof req.body?.query === 'string' ? req.body.query : '')

  const query = q.trim().slice(0, 240)
  if (!query) {
    return res.status(400).json({ error: 'Missing query (q)' })
  }

  try {
    const results = await Promise.all(OFFICIAL.map(async (s) => ({ ...s, ...(await fetchText(s.url)) })))
    const combined = results
      .filter((r) => r.ok)
      .map((r) => r.text)
      .join('\n')

    const snippets = extractSnippets(combined, query, 4)
    const iso = new Date().toISOString()

    return res.status(200).json({
      ok: true,
      query,
      snippets,
      sources: OFFICIAL.map((s) => ({ id: s.id, label: s.label, url: s.url })),
      fetchedAt: iso,
      pagesReached: results.filter((r) => r.ok).length,
      note:
        snippets.length > 0
          ? 'Snippets extracted from official NELFUND pages. Confirm full context on the official site before acting.'
          : 'Could not extract a clear matching snippet from official pages right now. Open nelf.gov.ng and portal.nelf.gov.ng directly.',
    })
  } catch (err) {
    console.error('[knowledge/lookup]', err)
    return res.status(200).json({
      ok: false,
      query,
      snippets: [],
      sources: OFFICIAL.map((s) => ({ id: s.id, label: s.label, url: s.url })),
      fetchedAt: new Date().toISOString(),
      pagesReached: 0,
      note: 'Live lookup failed. Verify only on nelf.gov.ng and portal.nelf.gov.ng.',
    })
  }
}
