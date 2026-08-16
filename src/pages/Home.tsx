import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
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

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#institution') {
      document.getElementById('institution')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="pb-2">
      <section className="relative overflow-hidden bg-forest-700 pb-16 pt-10 text-paper sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-forest-500/30 blur-3xl"
        />

        <div className="container-page relative">
          <p className="eyebrow text-gold-300">NELFUND · {applicationStatus.cycle}</p>
          <h1 className="mt-3 max-w-xl text-balance text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-[2.75rem]">
            Understand your NELFUND application.
            <span className="block text-gold-300">Know what to do next.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/80 sm:text-base">
            Ask about portal errors, upload a screenshot, find verified support contacts, and get clear next
            steps — grounded in official NELFUND information.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/ask" className="btn-gold">
              Ask the support AI
            </Link>
            <Link
              to="/apply"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-paper/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-paper/10"
            >
              How to apply
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {PROBLEM_SHORTCUTS.map((p) => (
              <Link
                key={p.label}
                to={p.to}
                className="rounded-full border border-paper/20 bg-paper/5 px-3 py-1.5 text-xs font-medium text-paper/85 transition hover:bg-paper/15"
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

      <section id="institution" className="container-page mt-6 scroll-mt-24">
        <InstitutionSelect />
      </section>

      <section className="container-page mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Solve a problem</h2>
            <p className="section-sub">Start with the AI, or jump to a focused guide.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/ask"
            className="card-interactive group flex items-start gap-4 border-forest-700/15 bg-gradient-to-br from-forest-50 to-white p-5"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-lg text-paper"
            >
              ✦
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink group-hover:text-forest-800">
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
      </section>

      <section className="container-page mt-10">
        <h2 className="section-title">Explore the guide</h2>
        <p className="section-sub">Verified information for every stage of the process.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickActionCard to="/apply" icon="📝" title="How to apply" description="Clear steps from start to submit." />
          <QuickActionCard to="/readiness" icon="✓" title="Am I ready?" description="Quick checklist before you apply." />
          <QuickActionCard to="/fees" icon="₦" title="School fees" description="How institutional charges work." />
          <QuickActionCard to="/upkeep" icon="↗" title="Upkeep" description="What the allowance covers." />
          <QuickActionCard to="/faq" icon="?" title="FAQs" description="Short answers to common questions." />
          <QuickActionCard to="/videos" icon="▶" title="Videos" description="Tutorials organised by topic." />
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="card border-forest-700/10 bg-forest-50/50">
          <p className="text-sm font-semibold text-forest-800">Built for trust</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
            Answers are grounded in verified NELFUND information and official sources. Changing details
            are labelled clearly. Always confirm critical dates on the official portal before you act.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/sources" className="chip">
              Official links
            </Link>
            <Link to="/ask" className="chip">
              Ask the AI →
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page mt-6 pb-6">
        <StaySafe />
      </section>
    </div>
  )
}
