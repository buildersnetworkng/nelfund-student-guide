import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { search, SEARCH_SUGGESTIONS } from '../lib/search'
import { useInstitution } from '../context/InstitutionContext'

const TYPE_LABEL: Record<string, string> = {
  faq: 'FAQ',
  guide: 'Guide',
  troubleshooting: 'Troubleshooting',
  video: 'Video',
  source: 'Official source',
  institution: 'Institution',
}

export default function SearchBar({ placeholder = 'e.g. "my NIN failed", "how much is upkeep"' }: { placeholder?: string }) {
  const [query, setQuery] = useState('')
  const { institutionId } = useInstitution()
  const results = useMemo(() => search(query, institutionId), [query, institutionId])
  const hasQuery = query.trim().length > 0

  return (
    <div className="relative">
      <label htmlFor="site-search" className="sr-only">Search the guide</label>
      <div className="flex items-center gap-2 rounded-full border border-forest-700/20 bg-white px-4 py-3 shadow-card">
        <span aria-hidden="true" className="text-forest-500">🔎</span>
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
      </div>

      {!hasQuery && (
        <div className="mt-2 flex flex-wrap gap-2">
          {SEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s.query}
              type="button"
              onClick={() => setQuery(s.query)}
              className="rounded-full border border-forest-700/15 bg-white px-3 py-1.5 text-xs font-medium text-forest-700 hover:bg-forest-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {hasQuery && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-forest-700/10 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink/60">
              No matches yet. Try different words, or browse the FAQ and Troubleshooting sections.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-forest-700/10 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    to={r.path}
                    onClick={() => setQuery('')}
                    className="flex flex-col gap-0.5 px-4 py-3 hover:bg-forest-50"
                  >
                    <span className="eyebrow">{TYPE_LABEL[r.type]}</span>
                    <span className="text-sm font-semibold text-ink">{r.title}</span>
                    <span className="line-clamp-1 text-xs text-ink/55">{r.snippet}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
