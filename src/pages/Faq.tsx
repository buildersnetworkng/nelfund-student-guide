import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { faqs, getFaqsByIds, getRelevantContent } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import TrustBadge from '../components/TrustBadge'
import ScopeBadge from '../components/ScopeBadge'
import RecommendedVideo from '../components/RecommendedVideo'
import InstitutionNotice from '../components/InstitutionNotice'
import InstitutionTip from '../components/InstitutionTip'
import { trackFaqOpen } from '../lib/analytics'

export default function Faq() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const { institutionId } = useInstitution()

  const visibleFaqs = useMemo(() => getRelevantContent(faqs, institutionId), [institutionId])

  const categories = useMemo(() => Array.from(new Set(visibleFaqs.map((f) => f.category))), [visibleFaqs])
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visibleFaqs.filter((f) => {
      const matchesQuery = !q || f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'All' || f.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [visibleFaqs, query, activeCategory])

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="eyebrow">FAQ</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Frequently asked questions</h1>
      <p className="section-sub max-w-xl">Short, verified answers. For a specific portal error, use the support AI.</p>
      <div className="mt-2">
        <InstitutionNotice />
      </div>

      <div className="mt-4 rounded-2xl border border-forest-700/10 bg-forest-50/50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-ink/70">Can&apos;t find your problem?</p>
        <Link to="/ask" className="btn-primary mt-3 px-4 py-2 text-xs sm:mt-0">
          Ask the AI
        </Link>
      </div>

      <div className="mt-5">
        <label htmlFor="faq-search" className="sr-only">
          Search FAQs
        </label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          className="input-field rounded-full"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['All', ...categories] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeCategory === cat ? 'bg-forest-700 text-paper' : 'bg-forest-50 text-forest-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.map((f) => {
          const isOpen = openId === f.id
          const related = getRelevantContent(getFaqsByIds(f.related_faq_ids), institutionId)

          return (
            <li key={f.id} id={f.id} className="card">
              <button
                onClick={() => {
                  if (!isOpen) trackFaqOpen(f.id)
                  setOpenId(isOpen ? null : f.id)
                }}
                className="flex w-full items-start justify-between gap-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-sm font-semibold text-ink">{f.title}</span>
                <span aria-hidden="true" className="text-forest-700">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3 border-t border-forest-700/10 pt-3">
                  <p className="text-sm leading-relaxed text-ink/70">{f.content}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <TrustBadge status={f.verification_status} sourceId={f.source_id} lastVerified={f.last_verified} />
                    <ScopeBadge scope={f.scope} institutionId={f.institution_id} />
                  </div>
                  <RecommendedVideo videoIds={f.related_video_ids} topicLabel={f.title.toLowerCase()} />
                  <InstitutionTip tips={f.institution_tips} />
                  {related.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {related.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setOpenId(r.id)}
                          className="rounded-full border border-forest-700/20 px-3 py-1 text-xs text-forest-700 hover:bg-forest-50"
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-ink/60">No FAQs match this search. Try the troubleshooting section instead.</p>
        )}
      </ul>
    </div>
  )
}
