import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnalyticsStats, type AnalyticsStats } from '../lib/analytics'

const KEY_STORAGE = 'nsg_admin_key_v1'

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
    </div>
  )
}

function RankList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink/45">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-ink/80">{item.key}</span>
              <span className="shrink-0 font-mono text-xs text-forest-700">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminAnalytics() {
  const [key, setKey] = useState(() => {
    try {
      return sessionStorage.getItem(KEY_STORAGE) || ''
    } catch {
      return ''
    }
  })
  const [input, setInput] = useState(key)
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (adminKey: string) => {
    if (!adminKey.trim()) {
      setError('Enter the admin key.')
      return
    }
    setLoading(true)
    setError(null)
    const data = await fetchAnalyticsStats(adminKey.trim())
    setLoading(false)
    if (!data) {
      setStats(null)
      setError('Could not load stats. Check the admin key, or confirm the API is deployed.')
      return
    }
    try {
      sessionStorage.setItem(KEY_STORAGE, adminKey.trim())
    } catch {
      /* ignore */
    }
    setKey(adminKey.trim())
    setStats(data)
  }, [])

  useEffect(() => {
    if (key) void load(key)
  }, [key, load])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void load(input)
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-forest-100 bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">Admin</p>
            <h1 className="font-display text-lg font-semibold text-ink">Usage analytics</h1>
          </div>
          <Link to="/" className="text-sm font-medium text-forest-700 hover:underline">
            Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {!stats && (
          <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-2xl border border-forest-100 bg-white p-5 shadow-card">
            <p className="text-sm leading-relaxed text-ink/70">
              Enter the analytics admin key to view privacy-safe usage metrics. No student passwords, OTPs, BVN,
              NIN, or free-text questions are stored.
            </p>
            <label htmlFor="admin-key" className="mt-4 block text-xs font-semibold text-ink/60">
              Admin key
            </label>
            <input
              id="admin-key"
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-field mt-1"
              autoComplete="current-password"
            />
            <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
              {loading ? 'Loading…' : 'View analytics'}
            </button>
            {error && <p className="mt-3 text-sm text-rust-500">{error}</p>}
          </form>
        )}

        {stats && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink/45">
                Updated {new Date(stats.generatedAt).toLocaleString()} · storage: {stats.storage}
              </p>
              <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={() => void load(key)} disabled={loading}>
                Refresh
              </button>
            </div>

            <section>
              <h2 className="text-sm font-semibold text-ink">Active students</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total unique users" value={stats.totals.uniqueUsers} />
                <StatCard label="Today" value={stats.active.today} hint="Daily active users" />
                <StatCard label="This week" value={stats.active.week} hint="7-day unique" />
                <StatCard label="This month" value={stats.active.month} hint="30-day unique" />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-ink">Product usage</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Sessions" value={stats.totals.sessions} />
                <StatCard label="Page views" value={stats.totals.pageViews} />
                <StatCard label="AI conversations" value={stats.totals.aiConversations} />
                <StatCard label="AI questions" value={stats.totals.aiQuestions} />
                <StatCard label="Image analyses" value={stats.totals.imageAnalyses} />
                <StatCard label="FAQ opens" value={stats.totals.faqOpens} />
                <StatCard label="Unresolved AI" value={stats.totals.unresolvedAi} hint="Low-confidence answers" />
                <StatCard
                  label="Unknown AI"
                  value={stats.totals.unknownAi ?? 0}
                  hint="Intent not classified"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-ink">Last 7 days</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-forest-100 bg-white shadow-card">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="border-b border-forest-100 text-xs uppercase tracking-wide text-ink/45">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Users</th>
                      <th className="px-4 py-2 font-semibold">Sessions</th>
                      <th className="px-4 py-2 font-semibold">AI questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.daily.map((row) => (
                      <tr key={row.date} className="border-b border-forest-50 last:border-0">
                        <td className="px-4 py-2 text-ink/80">{row.date}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.users}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.sessions}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.aiQuestions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RankList title="Common AI intents / problems" items={stats.topIntents} />
              <RankList
                title="Unknown AI topic buckets"
                items={stats.topUnknownTopics || []}
              />
              <RankList title="Institutions (when provided)" items={stats.topInstitutions} />
              <RankList title="Top pages" items={stats.topPages} />
              <RankList title="Features used" items={stats.topFeatures} />
            </section>

            <p className="text-xs leading-relaxed text-ink/45">
              Metrics use anonymous device IDs and session IDs only. Refreshing the page does not create a new unique
              user. Free-text questions are never stored — unknown questions only produce coarse topic buckets
              (e.g. missing-info, jamb, pending-status) so product gaps can be improved safely.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
