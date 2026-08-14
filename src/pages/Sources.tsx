import { Link } from 'react-router-dom'
import { sources } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'

export default function Sources() {
  const { institutionId, institution } = useInstitution()

  const national = sources.filter((s) => s.official && s.scope === 'nelfund-wide')

  const ownSources = institutionId
    ? sources.filter((s) => s.official && s.scope === 'institution-specific' && s.institution_id === institutionId)
    : []

  const institutionLabel = institution?.short_name ?? institution?.name ?? null

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Official links</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Verified official sources</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/65">
        Only official NELFUND and institution sources are listed here. Third-party sources
        referenced elsewhere in this guide are always labelled separately.
      </p>

      <h2 className="mt-8 font-display text-base font-semibold text-ink">NELFUND (nationwide)</h2>
      <ul className="mt-3 space-y-3">
        {national.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="card flex items-center justify-between gap-3 hover:border-forest-500/40"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{s.label}</p>
                <p className="mt-0.5 text-xs text-forest-700">{s.url}</p>
              </div>
              <span aria-hidden="true" className="text-forest-500">↗</span>
            </a>
          </li>
        ))}
      </ul>

      {institutionId ? (
        <div>
          <h2 className="mt-8 font-display text-base font-semibold text-ink">
            Institution-specific — {institutionLabel ?? 'your institution'}
          </h2>
          {ownSources.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {ownSources.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="card flex items-center justify-between gap-3 hover:border-gold-500/40"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.label}</p>
                      <p className="mt-0.5 text-xs text-forest-700">{s.url}</p>
                    </div>
                    <span aria-hidden="true" className="text-forest-500">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/60">
              This guide doesn't have verified official sources for {institutionLabel ?? 'your institution'} yet
              — not that NELFUND doesn't apply to you.
            </p>
          )}
        </div>
      ) : (
        <div className="card mt-8 border-forest-700/15 bg-forest-50">
          <p className="text-sm text-ink/70">
            <Link to="/#institution" className="font-semibold text-forest-700 underline underline-offset-2">
              Select your institution
            </Link>{' '}
            to view institution-specific official sources where available.
          </p>
        </div>
      )}

      <div className="card mt-8 border-amber-500/30 bg-amber-100/50">
        <p className="text-sm text-ink/70">
          Always verify application dates, amounts, and eligibility rules directly on these
          official sources — not on unofficial websites or social media posts.
        </p>
      </div>
    </div>
  )
}
