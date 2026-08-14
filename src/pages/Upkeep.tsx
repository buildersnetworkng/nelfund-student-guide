import { nelfundFacts } from '../lib/data'
import TrustBadge from '../components/TrustBadge'
import ScopeBadge from '../components/ScopeBadge'
import RecommendedVideo from '../components/RecommendedVideo'

export default function Upkeep() {
  const amountFact = nelfundFacts.find((f) => f.id === 'nf-upkeep-amount')!

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Upkeep allowance</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Understanding the upkeep allowance</h1>

      <div className="card mt-6 border-forest-700/20 bg-forest-700 text-paper">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="eyebrow text-gold-300">Currently confirmed amount</p>
          <ScopeBadge scope={amountFact.scope} institutionId={amountFact.institution_id} />
        </div>
        <p className="mt-1 font-display text-4xl font-bold">₦20,000<span className="text-base font-normal text-paper/70"> / month</span></p>
        <p className="mt-2 text-sm text-paper/75">
          Figures you may see elsewhere, including ₦25,000, should not be treated as current
          unless an official NELFUND source confirms a change.
        </p>
      </div>

      <div className="card mt-4">
        <TrustBadge status={amountFact.verification_status} sourceId={amountFact.source_id} lastVerified={amountFact.last_verified} />
      </div>

      <div className="card mt-4">
        <h2 className="font-display text-base font-semibold text-ink">Remember: it's a loan</h2>
        <p className="mt-1 text-sm text-ink/70">
          Upkeep is part of the NELFUND loan, not free money. Applying for it increases the
          amount you will eventually repay, so weigh your actual need against your comfort
          with future repayment.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Watch this</h2>
        <div className="mt-3">
          <RecommendedVideo videoIds={['vid-upkeep-explainer']} topicLabel="upkeep" />
        </div>
      </div>
    </div>
  )
}
