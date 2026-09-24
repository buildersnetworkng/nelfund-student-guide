import { Link } from 'react-router-dom'
import { guides } from '../lib/data'
import { getSource } from '../lib/data'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Apply() {
  const guide = guides.find((g) => g.id === 'how-to-apply') || guides[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">How to apply</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{guide.title}</h1>
      <p className="mt-2 text-sm text-ink/70">{guide.summary}</p>

      <div className="mt-3">
        <InstitutionNotice />
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="https://nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-1 border-forest-700/25 p-4 transition hover:border-forest-700/50"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">Official website</span>
          <span className="text-sm font-medium text-ink">nelf.gov.ng</span>
          <span className="text-xs text-ink/55">News, policies, official info</span>
        </a>
        <a
          href="https://portal.nelf.gov.ng/auth/login"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-1 border-forest-700/25 p-4 transition hover:border-forest-700/50"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">Log in / sign in</span>
          <span className="text-sm font-medium text-ink">portal.nelf.gov.ng/auth/login</span>
          <span className="text-xs text-ink/55">Existing account login page</span>
        </a>
        <a
          href="https://portal.nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-1 border-forest-700/25 p-4 transition hover:border-forest-700/50"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">Sign up / apply</span>
          <span className="text-sm font-medium text-ink">portal.nelf.gov.ng</span>
          <span className="text-xs text-ink/55">Create account & application portal</span>
        </a>
      </div>

      <ol className="mt-8 space-y-4">
        {guide.steps.map((step) => {
          const source = getSource(step.source_id)
          return (
            <li key={step.step} className="card relative pl-14">
              <span className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 font-display text-sm font-bold text-paper">
                {step.step}
              </span>
              <h2 className="font-display text-base font-semibold text-ink">{step.title}</h2>
              <p className="mt-1 text-sm text-ink/70">{step.explanation}</p>
              {source?.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-forest-700 underline underline-offset-2"
                >
                  {source.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>

      <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-forest-800 underline underline-offset-2">
        ← Back home
      </Link>
    </div>
  )
}
