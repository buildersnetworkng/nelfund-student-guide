import { Link } from 'react-router-dom'
import { nelfundFacts } from '../lib/data'
import TrustBadge from '../components/TrustBadge'
import ScopeBadge from '../components/ScopeBadge'
import RecommendedVideo from '../components/RecommendedVideo'

export default function Fees() {
  const facts = nelfundFacts.filter((f) => ['nf-components'].includes(f.id))

  return (
    <div className="container-page py-10">
      <p className="eyebrow">School fees</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">How NELFUND pays school fees</h1>

      <div className="mt-6 space-y-4">
        {facts.map((f) => (
          <div key={f.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-ink">{f.title}</h2>
              <ScopeBadge scope={f.scope} institutionId={f.institution_id} />
            </div>
            <p className="mt-1 text-sm text-ink/70">{f.content}</p>
            <div className="mt-3">
              <TrustBadge status={f.verification_status} sourceId={f.source_id} lastVerified={f.last_verified} />
            </div>
          </div>
        ))}

        <div className="card border-rust-500/30 bg-rust-100/50">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Already paid your fees?</h2>
            <ScopeBadge scope="nelfund-wide" />
          </div>
          <p className="mt-1 text-sm text-ink/70">
            This guide does not have an official source confirming how refunds or credits are
            handled if you already paid before your NELFUND application processed. See the
            troubleshooting entry below rather than assuming an outcome.
          </p>
          <Link to="/troubleshooting/tb-already-paid-fees" className="mt-3 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2">
            I already paid my school fees →
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Watch this</h2>
        <div className="mt-3">
          <RecommendedVideo videoIds={['vid-school-fees-explainer']} topicLabel="school fees" />
        </div>
      </div>
    </div>
  )
}
