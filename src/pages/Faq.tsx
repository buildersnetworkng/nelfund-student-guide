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
      <p className="section-sub max-w-xl">Short, verified answers. For a specific portal error, use Ask support.</p>
      <div className="mt-2">
        <InstitutionNotice />
      </div>

      <div className="mt-4 rounded-2xl border border-forest-700/10 bg-forest-50/50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-ink/70">Can&apos;t find your problem?</p>
        <Link to="/ask" className="btn-primary mt-3 px-4 py-2 text-xs sm:mt-0">
          Ask support
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

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('All')}
          className={`chip whitespace-nowrap ${
            activeCategory === 'All' ? 'bg-forest-700 text-paper' : ''
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={`chip whitespace-nowrap ${
              activeCategory === c ? 'bg-forest-700 text-paper' : ''
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {filtered.map((f) => {
          const isOpen = openId === f.id
          return (
            <li key={f.id} className="card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => {
                  setOpenId(isOpen ? null : f.id)
                  if (!isOpen) trackFaqOpen(f.id)
                }}
                aria-expanded={isOpen}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{f.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <ScopeBadge scope={f.scope} />
                    <TrustBadge trust={f.trust} />
                  </div>
                </div>
                <span className="mt-0.5 text-ink/40" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-forest-700/10 px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-ink/75">{f.content}</p>
                  {f.institution_tips && f.institution_tips.length > 0 && (
                    <InstitutionTip tips={f.institution_tips} />
                  )}
                  {f.related_faq_ids && f.related_faq_ids.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Related</p>
                      <ul className="mt-1 space-y-1">
                        {getFaqsByIds(f.related_faq_ids).map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              className="text-sm font-medium text-forest-700 hover:underline"
                              onClick={() => {
                                setOpenId(r.id)
                                trackFaqOpen(r.id)
                              }}
                            >
                              {r.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.video_id && <RecommendedVideo videoId={f.video_id} className="mt-3" />}
                </div>
              )}
            </li>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/55">No FAQs match this search. Try the troubleshooting section instead.</p>
        )}
      </ul>
    </div>
  )
}
