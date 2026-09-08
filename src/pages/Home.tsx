import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import StatusCard from '../components/StatusCard'
import StaySafe from '../components/StaySafe'
import InstitutionSelect from '../components/InstitutionSelect'
import { QuickActionCard } from '../components/Card'
import { getCurrentAcademicCycle } from '../lib/academicCycle'

// Driven by production top pages + unknown topics (admin analytics)
const PROBLEM_SHORTCUTS = [
  { to: '/ask', label: 'Application pending' },
  { to: '/ask', label: 'Invalid JAMB number' },
  { to: '/ask', label: 'Is NELFUND open?' },
  { to: '/ask', label: 'Missing information' },
  { to: '/ask', label: 'School not showing' },
  { to: '/ask', label: 'How to apply' },
]

function useReveal() {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function RevealSection({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  const ref = useReveal()
  return (
    <section ref={ref} id={id} className={`reveal ${className}`}>
      {children}
    </section>
  )
}

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    }
  }, [location.hash])

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-forest-900 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-forest-300/25 blur-3xl"
        />

        <div className="container-page relative">
          <p className="fade-in text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
            NELFUND · {getCurrentAcademicCycle()}
          </p>

          <h1 className="slide-up mt-4 max-w-xl text-balance font-display text-3xl font-semibold leading-[1.18] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            <span className="block text-white">Understand your</span>
            <span className="block text-white">NELFUND application.</span>
            <span className="mt-1 block text-gold-300">Know what to do next.</span>
          </h1>

          <p className="slide-up mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Get clear guidance on your NELFUND application, portal issues, and next steps, backed by
            verified information.
          </p>
          <p className="slide-up mt-2 max-w-md text-sm leading-relaxed text-white/60">
            Ask questions, capture portal errors, and find relevant support contacts.
          </p>

          <div className="slide-up mt-8 flex flex-wrap gap-3">
            <Link to="/ask" className="btn-gold shadow-md hover:shadow-lg">
              Ask support
            </Link>
            <Link
              to="/apply"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/25 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:border-white/40 hover:bg-white/10 active:scale-[0.98]"
            >
              How to apply
            </Link>
          </div>

          <div className="slide-up mt-6 flex flex-wrap gap-2">
            {PROBLEM_SHORTCUTS.map((p) => (
              <Link
                key={p.label}
                to={p.to}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 transition duration-150 hover:border-white/30 hover:bg-white/12"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page relative -mt-8 sm:-mt-10">
        <StatusCard />
      </div>

      <RevealSection id="institution" className="container-page mt-8 scroll-mt-24">
        <InstitutionSelect />
      </RevealSection>

      <RevealSection className="container-page mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Solve a problem</h2>
            <p className="section-sub">Start with support, or jump to a focused guide.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/ask"
            className="card-interactive group flex items-start gap-4 border-forest-100 bg-gradient-to-br from-forest-50 to-white p-5"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-lg text-paper transition group-hover:scale-105"
            >
              ✦
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink group-hover:text-forest-700">
                Ask support
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Describe the issue in your own words, or upload a portal screenshot for guided next
                steps.
              </p>
            </div>
          </Link>

          <QuickActionCard
            to="/troubleshooting"
            title="Troubleshooting"
            description="Common portal errors and how students usually resolve them."
          />
          <QuickActionCard
            to="/apply"
            title="How to apply"
            description="Official steps, links, and what you need before you start."
          />
          <QuickActionCard
            to="/readiness"
            title="Am I ready?"
            description="Quick checklist before you open the portal."
          />
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-12">
        <h2 className="section-title">Also useful</h2>
        <p className="section-sub">Fees, upkeep, FAQs, and verified videos.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/fees" className="tag">
            Fees
          </Link>
          <Link to="/upkeep" className="tag">
            Upkeep
          </Link>
          <Link to="/faq" className="tag">
            FAQ
          </Link>
          <Link to="/videos" className="tag">
            Videos
          </Link>
          <Link to="/sources" className="tag">
            Official sources
          </Link>
          <Link to="/ask" className="tag">
            Ask support
          </Link>
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-14">
        <StaySafe />
      </RevealSection>
    </div>
  )
}
