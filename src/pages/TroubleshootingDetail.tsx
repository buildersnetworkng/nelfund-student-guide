import { Link, useParams } from 'react-router-dom'
import { getTroubleshootingItem, isContentVisible } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import TrustBadge from '../components/TrustBadge'
import ScopeBadge from '../components/ScopeBadge'
import RecommendedVideo from '../components/RecommendedVideo'
import ScopeRestricted from '../components/ScopeRestricted'
import NotFound from './NotFound'

export default function TroubleshootingDetail() {
  const { id } = useParams()
  const item = getTroubleshootingItem(id ?? null)
  const { institutionId } = useInstitution()

  if (!item) return <NotFound />

  if (!isContentVisible(item, institutionId)) {
    return (
      <ScopeRestricted
        institutionId={item.institution_id}
        backTo="/troubleshooting"
        backLabel="All problems"
      />
    )
  }

  return (
    <div className="container-page py-10">
      <Link to="/troubleshooting" className="text-sm text-forest-700 underline underline-offset-2">← All problems</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">{item.category}</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{item.icon} {item.problem}</h1>
        </div>
        <ScopeBadge scope={item.scope} institutionId={item.institution_id} />
      </div>

      <div className="mt-3">
        <TrustBadge status={item.verification_status} sourceId={item.source_id} lastVerified={item.last_verified} />
      </div>

      <section className="card mt-6">
        <h2 className="font-display text-base font-semibold text-ink">What this usually means</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">{item.what_it_usually_means}</p>
      </section>

      <section className="card mt-4">
        <h2 className="font-display text-base font-semibold text-ink">What you should do</h2>
        <ol className="mt-2 space-y-2">
          {item.what_to_do.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink/70">
              <span className="font-display font-semibold text-forest-700">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-4 border-rust-500/30 bg-rust-100/40">
        <h2 className="font-display text-base font-semibold text-rust-500">Avoid this</h2>
        <ul className="mt-2 space-y-2">
          {item.avoid_this.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink/70">
              <span aria-hidden="true">•</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Watch a guide</h2>
        <div className="mt-3">
          <RecommendedVideo videoIds={item.video_ids} topicLabel={item.problem.toLowerCase()} />
        </div>
      </section>

      <section className="card mt-4 border-teal-500/30 bg-teal-500/5">
        <h2 className="font-display text-base font-semibold text-teal-700">Still stuck?</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">{item.still_stuck}</p>
      </section>
    </div>
  )
}
