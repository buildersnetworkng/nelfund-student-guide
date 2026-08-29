import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import StatusCard from '../components/StatusCard'
import StaySafe from '../components/StaySafe'
import InstitutionSelect from '../components/InstitutionSelect'
import { QuickActionCard } from '../components/Card'
import { getCurrentAcademicCycle } from '../lib/academicCycle'

const PROBLEM_SHORTCUTS = [
  { to: '/ask', label: 'Missing information' },
  { to: '/ask', label: 'JAMB number rejected' },
  { to: '/ask', label: 'School not showing' },
  { to: '/ask', label: 'Application pending' },
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
    <section id={id} ref={ref} className={`reveal ${className}`}>
      {children}
    </section>
  )
}

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#institution') {
      document.getElementById('institution')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="pb-2">
      <section
        className="relative overflow-hidden pb-16 pt-10 sm:pt-14"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 90% -10%, rgba(200,155,60,0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(46,130,89,0.35), transparent 50%), linear-gradient(165deg, #0a3a24 0%, #0f5132 42%, #1e6b45 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
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
                Describe the issue in your own words, attach a screenshot, and get step-by-step help.
              </p>
            </div>
          </Link>

          <Link to="/troubleshooting" className="card-interactive flex items-start gap-4 p-5">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-lg"
            >
              ⚠
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Common problems</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Missing records, school not listed, pending applications, and portal errors.
              </p>
            </div>
          </Link>
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-12">
        <h2 className="section-title">Explore the guide</h2>
        <p className="section-sub">Verified information for every stage of the process.</p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickActionCard to="/apply" icon="📝" title="How to apply" description="Clear steps from start to submit." />
          <QuickActionCard to="/readiness" icon="✓" title="Am I ready?" description="Quick checklist before you apply." />
          <QuickActionCard to="/fees" icon="₦" title="School fees" description="How institutional charges work." />
          <QuickActionCard to="/upkeep" icon="↗" title="Upkeep" description="What the allowance covers." />
          <QuickActionCard to="/faq" icon="?" title="FAQs" description="Short answers to common questions." />
          <QuickActionCard to="/videos" icon="▶" title="Videos" description="Tutorials organised by topic." />
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-12">
        <div className="card border-forest-100 bg-forest-50/60">
          <p className="text-sm font-semibold text-forest-700">Built for trust</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
            Answers are grounded in verified NELFUND information and official sources. Changing details
            are labelled clearly. Always confirm critical dates on the official portal before you act.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/sources" className="chip">
              Official links
            </Link>
            <Link to="/ask" className="chip">
              Ask support
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-8 pb-8">
        <StaySafe />
      </RevealSection>
    </div>
  )
}
