import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import StatusCard from '../components/StatusCard'
import StaySafe from '../components/StaySafe'
import InstitutionSelect from '../components/InstitutionSelect'
import ShareGuide, { SHARE_TEXT } from '../components/ShareGuide'
import ShareSoftPrompt from '../components/ShareSoftPrompt'
import { getCurrentAcademicCycle } from '../lib/academicCycle'

const WHATSAPP_SHARE_HREF = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`

const FEATURES = [
  {
    to: '/apply',
    title: 'Apply',
    description: 'Step-by-step guide',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h7l3 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    to: '/ask',
    title: 'Check Status',
    description: 'Live updates',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    to: '/ask',
    title: 'Get Support',
    description: 'AI assistant',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-4 4v-4z" />
      </svg>
    ),
  },
  {
    to: '/sources',
    title: 'Official Links',
    description: 'Trusted sources',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

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
  const navigate = useNavigate()
  const [askDraft, setAskDraft] = useState('')

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    }
  }, [location.hash])

  function onAskSubmit(e: FormEvent) {
    e.preventDefault()
    const q = askDraft.trim()
    if (q) {
      navigate(`/ask?q=${encodeURIComponent(q)}`)
    } else {
      navigate('/ask')
    }
  }

  return (
    <div className="pb-16">
      <ShareSoftPrompt />

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-forest-50/40 to-paper pb-10 pt-8 sm:pb-14 sm:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-forest-100/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-gold-100/50 blur-3xl"
        />

        <div className="container-page relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-600">
            NELFUND · {getCurrentAcademicCycle()} · Independent guide
          </p>

          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.15] tracking-tight text-forest-900 sm:text-4xl lg:text-[2.75rem]">
            Your NELFUND Student Guide
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/65 sm:text-base">
            Get clear answers, official links and step-by-step help for your NELFUND journey.
          </p>

          <form onSubmit={onAskSubmit} className="mt-8 max-w-xl">
            <label htmlFor="home-ask" className="sr-only">
              Ask a question about NELFUND
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-forest-100 bg-white p-1.5 shadow-lift sm:p-2">
              <span className="pl-3 text-forest-400" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="M20 20l-3-3" />
                </svg>
              </span>
              <input
                id="home-ask"
                value={askDraft}
                onChange={(e) => setAskDraft(e.target.value)}
                placeholder="Ask a question..."
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white shadow-sm transition hover:bg-forest-600 active:scale-[0.97]"
                aria-label="Ask support"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </button>
            </div>
          </form>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                to={f.to}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-forest-100/90 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700 transition group-hover:bg-forest-100">
                  {f.icon}
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold text-ink sm:text-[15px]">{f.title}</span>
                  <span className="mt-0.5 block text-xs text-ink/55">{f.description}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <ShareGuide variant="button" />
            <a
              href={WHATSAPP_SHARE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              WhatsApp
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {PROBLEM_SHORTCUTS.map((p) => (
              <Link
                key={p.label}
                to={p.to}
                className="rounded-full border border-forest-100 bg-white px-3 py-1.5 text-xs font-medium text-forest-800 transition hover:border-forest-300 hover:bg-forest-50"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page relative mt-6 sm:mt-8">
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
          <Link to="/apply" className="card-interactive group flex items-start gap-4 p-5">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-base font-semibold text-forest-800"
            >
              1
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink group-hover:text-forest-700">
                How to apply
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Account creation, profile, institutional charges, and upkeep in the right order.
              </p>
            </div>
          </Link>
          <Link to="/troubleshooting" className="card-interactive group flex items-start gap-4 p-5">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-base font-semibold text-forest-800"
            >
              !
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink group-hover:text-forest-700">
                Portal problems
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Missing information, school not on list, JAMB errors, and pending status.
              </p>
            </div>
          </Link>
          <Link to="/sources" className="card-interactive group flex items-start gap-4 p-5">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-base font-semibold text-forest-800"
            >
              ✓
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink group-hover:text-forest-700">
                Official sources
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Portal, website, FAQ, and eSupport, verified links only.
              </p>
            </div>
          </Link>
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-12">
        <h2 className="section-title">Quick links</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/fees" className="tag">
            School fees
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
        <div className="rounded-2xl border border-forest-100 bg-gradient-to-br from-forest-50 to-white p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Help another student
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink/60">
            Share the NELFUND Guide so other students can check readiness, apply correctly, and
            troubleshoot portal issues before they get stuck.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ShareGuide variant="button" />
            <a
              href={WHATSAPP_SHARE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            >
              WhatsApp a classmate
            </a>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="container-page mt-14">
        <StaySafe />
      </RevealSection>
    </div>
  )
}
