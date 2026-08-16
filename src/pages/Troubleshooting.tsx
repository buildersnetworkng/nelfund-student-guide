import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { troubleshootingItems, getRelevantContent } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Troubleshooting() {
  const { institutionId } = useInstitution()

  const visibleItems = useMemo(
    () => getRelevantContent(troubleshootingItems, institutionId),
    [institutionId],
  )

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="eyebrow">Problems</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">What problem are you having?</h1>
      <p className="section-sub max-w-xl">
        Pick the closest issue for verified guidance — or describe it to the support AI if nothing matches.
      </p>
      <div className="mt-3">
        <InstitutionNotice />
      </div>

      <div className="mt-5">
        <Link
          to="/ask"
          className="card-interactive flex items-center gap-3 border-forest-700/15 bg-forest-50/60 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-sm font-bold text-paper">
            AI
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Not sure which problem it is?</p>
            <p className="text-xs text-ink/60">
              Describe it or upload a screenshot — the support AI will guide you.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {visibleItems.map((t) => (
          <Link key={t.id} to={`/troubleshooting/${t.id}`} className="card-interactive flex items-start gap-3 p-4">
            <span className="text-xl" aria-hidden="true">
              {t.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{t.problem}</p>
              <p className="mt-0.5 text-xs text-ink/55">{t.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
