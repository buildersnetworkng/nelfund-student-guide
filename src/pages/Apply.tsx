import { guides, getSource } from '../lib/data'
import TrustBadge from '../components/TrustBadge'
import RecommendedVideo from '../components/RecommendedVideo'
import InstitutionTip from '../components/InstitutionTip'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Apply() {
  const guide = guides.find((g) => g.id === 'guide-how-to-apply')
  if (!guide) return null

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Step-by-step guide</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{guide.title}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/65">{guide.summary}</p>
      <div className="mt-2"><InstitutionNotice /></div>

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

              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-rust-500">Common mistake</dt>
                  <dd className="text-ink/70">{step.common_mistake}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">What to check</dt>
                  <dd className="text-ink/70">{step.what_to_check}</dd>
                </div>
              </dl>

              <InstitutionTip tips={step.institution_tips} />

              <div className="mt-3">
                <RecommendedVideo videoIds={step.video_id ? [step.video_id] : []} topicLabel={step.title.toLowerCase()} />
              </div>

              {source && (
                <a href={source.url || undefined} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-forest-700 underline underline-offset-2">
                  {source.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-8">
        <TrustBadge status="guidance" sourceId="nelfund-portal" lastVerified="2026-08-11" />
        <p className="mt-2 text-xs text-ink/50">
          The portal's own on-screen instructions always take precedence over this guide if they differ.
        </p>
      </div>
    </div>
  )
}
