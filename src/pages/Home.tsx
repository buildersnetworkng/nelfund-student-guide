import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import StatusCard from '../components/StatusCard'
import StaySafe from '../components/StaySafe'
import InstitutionSelect from '../components/InstitutionSelect'
import { QuickActionCard } from '../components/Card'
import { applicationStatus } from '../lib/data'

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
  children: React.ReactNode
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
      <section className="hero-surface relative overflow-hidden pb-16 pt-10 sm:pt-14">
        <div aria-hidden className="hero-glow hero-glow-a" />
        <div aria-hidden className="hero-glow hero-glow-b" />

        <div className="container-page relative">
          <p className="hero-enter hero-enter-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
            NELFUND · {applicationStatus.cycle}
          </p>

          <h1 className="hero-enter hero-enter-2 mt-4 max-w-xl text-balance font-display text-3xl font-semibold leading-[1.18] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            <span className="block text-white">Understand your</span>
            <span className="block text-white">NELFUND application.</span>
            <span className="mt-1 block text-gold-300">Know what to do next.</span>
          </h1>

          <p className="hero-enter hero-enter-3 mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Get clear guidance on your NELFUND application, portal issues, and next steps, backed by
            verified information.
          </p>
          <p className="hero-enter hero-enter-3 mt-2 max-w-md text-sm leading-relaxed text-white/60">
            Ask questions, capture portal errors, and find relevant support contacts.
          </p>

          <div className="hero-enter hero-enter-4 mt-8 flex flex-wrap gap-3">
            <Link to="/ask" className="btn-gold btn-hero-cta">
              Ask the support AI
            </Link>
            <Link to="/apply" className="btn-hero-secondary">
              How to apply
            </Link>
          </div>

          <div className="hero-enter hero-enter-5 mt-6 flex flex-wrap gap-2">
            {PROBLEM_SHORTCUTS.map((p) => (
              <Link key={p.label} to={p.to} className="hero-chip">
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
            <p className="section-sub">Start with the AI, or jump to a focused guide.</p>
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
                Talk to the support AI
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
              Ask the AI
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
