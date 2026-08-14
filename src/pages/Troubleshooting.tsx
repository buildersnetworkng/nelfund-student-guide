import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { troubleshootingItems, getRelevantContent } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Troubleshooting() {
  const { institutionId } = useInstitution()

  // NELFUND-wide problems always show; institution-specific ones only show
  // once a student has selected that institution.
  const visibleItems = useMemo(
    () => getRelevantContent(troubleshootingItems, institutionId),
    [institutionId],
  )

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Troubleshooting</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">What problem are you having?</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/65">
        Pick the issue closest to yours for what it usually means, what to do, and where to go
        if you're still stuck.
      </p>
      <div className="mt-3"><InstitutionNotice /></div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {visibleItems.map((t) => (
          <Link key={t.id} to={`/troubleshooting/${t.id}`} className="card flex items-start gap-3 hover:border-forest-500/40 hover:-translate-y-0.5 transition-transform">
            <span className="text-xl" aria-hidden="true">{t.icon}</span>
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
