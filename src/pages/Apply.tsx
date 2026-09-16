import { guides, getSource } from '../lib/data'
import TrustBadge from '../components/TrustBadge'
import RecommendedVideo from '../components/RecommendedVideo'
import InstitutionTip from '../components/InstitutionTip'
import InstitutionNotice from '../components/InstitutionNotice'
import ShareGuide from '../components/ShareGuide'
import ShareSoftPrompt from '../components/ShareSoftPrompt'

export default function Apply() {
  const guide = guides.find((g) => g.id === 'guide-how-to-apply')
  if (!guide) return null

  return (
    <div className="container-page py-10">
      <ShareSoftPrompt />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Step-by-step guide</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{guide.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-ink/65">{guide.summary}</p>
        </div>
        <ShareGuide variant="button" className="shrink-0" />
      </div>
      <div className="mt-2"><InstitutionNotice /></div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <a
          href="https://nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-1 border-forest-700/25 p-4 transition hover:border-forest-700/50"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-forest-800">Official website</span>
          <span className="text-sm font-semibold text-ink">nelf.gov.ng</span>
          <span className="text-xs text-ink/55">Log in or sign in if you already have an account.</span>
        </a>
        <a
          href="https://portal.nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-1 border-gold-500/30 p-4 transition hover:border-gold-500/60"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-700">Official portal</span>
          <span className="text-sm font-semibold text-ink">portal.nelf.gov.ng</span>
          <span className="text-xs text-ink/55">Create an account or continue an application.</span>
        </a>
      </div>

      <InstitutionTip className="mt-6" />

      <ol className="mt-8 space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="card flex gap-3 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-bold text-paper">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink/80">{step}</p>
          </li>
        ))}
      </ol>

      {guide.common_mistakes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Common mistakes</h2>
          <ul className="mt-3 space-y-2">
            {guide.common_mistakes.map((m) => (
              <li key={m} className="text-sm text-ink/70">
                · {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest-100 bg-forest-50/50 p-4">
        <p className="text-sm text-ink/70">Pass this apply guide to a classmate who is still guessing.</p>
        <ShareGuide variant="button" className="shrink-0" />
      </div>

      <RecommendedVideo topic="apply" className="mt-8" />
      <div className="mt-6">
        <TrustBadge sources={guide.source_ids.map((id) => getSource(id)).filter(Boolean) as ReturnType<typeof getSource>[]} />
      </div>
    </div>
  )
}
