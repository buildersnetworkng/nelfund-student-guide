import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import StatusCard from '../components/StatusCard'
import SearchBar from '../components/SearchBar'
import StaySafe from '../components/StaySafe'
import InstitutionSelect from '../components/InstitutionSelect'
import { QuickActionCard } from '../components/Card'
import { applicationStatus } from '../lib/data'

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#institution') {
      document.getElementById('institution')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div>
      <section className="bg-forest-700 bg-stamp-lines pb-14 pt-10 text-paper sm:pt-14">
        <div className="container-page">
          <p className="eyebrow text-gold-300">NELFUND {applicationStatus.cycle}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            NELFUND Student Guide
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/75 sm:text-base">
            Understand NELFUND, prepare your documents, apply correctly, solve common problems,
            and find trusted guidance — all in one place.
          </p>
          <p className="mt-2 max-w-xl text-xs text-paper/55 sm:text-sm">
            Built with OOU students in mind, but designed to help students across Nigeria
            navigate NELFUND. Whether you're at OOU or another Nigerian institution, find
            verified NELFUND information, step-by-step guides, troubleshooting help, and video
            tutorials.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/apply" className="btn-primary bg-gold-500 text-ink hover:bg-gold-300">
              How to apply
            </Link>
            <Link to="/readiness" className="btn-secondary border-paper/40 text-paper hover:bg-paper/10">
              Am I ready?
            </Link>
          </div>

          <div className="mt-6">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container-page -mt-8 sm:-mt-10">
        <StatusCard />
      </div>

      <section id="institution" className="container-page mt-6 scroll-mt-20">
        <InstitutionSelect />
      </section>

      <section className="container-page mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">What do you need help with?</h2>
        <p className="mt-1 text-sm text-ink/60">Jump straight to what you need.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickActionCard to="/apply" icon="📝" title="How to Apply" description="Step-by-step application guide." />
          <QuickActionCard to="/readiness" icon="📋" title="Am I Ready?" description="Interactive readiness checklist." />
          <QuickActionCard to="/fees" icon="💰" title="School Fees" description="How institutional charges work." />
          <QuickActionCard to="/upkeep" icon="💵" title="Upkeep" description="The monthly ₦20,000 allowance." />
          <QuickActionCard to="/troubleshooting" icon="❌" title="Fix a Problem" description="Troubleshoot common issues." />
          <QuickActionCard to="/videos" icon="🎥" title="Watch Tutorials" description="Video guides organised by topic." />
          <QuickActionCard to="/faq" icon="❓" title="FAQs" description="Frequently asked questions." />
          <QuickActionCard to="/sources" icon="🔗" title="Official Links" description="NELFUND and institution sources." />
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="card border-amber-500/30 bg-amber-100/60">
          <p className="text-sm font-semibold text-amber-500">Always verify before you rely on this</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Always verify application dates and changing requirements through official
            NELFUND/institution announcements. This guide labels every piece of information as{' '}
            <strong>Verified</strong>, <strong>May Change</strong>, <strong>General Guidance</strong>,
            or <strong>Unverified</strong> — and as <strong>NELFUND-wide</strong> or{' '}
            <strong>institution-specific</strong> — so you always know how much to rely on it.
          </p>
        </div>
      </section>

      <section className="container-page mt-6 pb-4">
        <StaySafe />
      </section>
    </div>
  )
}
