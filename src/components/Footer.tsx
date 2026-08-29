import { Link } from 'react-router-dom'
import { sources } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'

export default function Footer() {
  const { institutionId, institution } = useInstitution()
  const nationalSources = sources.filter((s) => s.official && s.scope === 'nelfund-wide')

  const ownSources = institutionId
    ? sources.filter((s) => s.official && s.scope === 'institution-specific' && s.institution_id === institutionId)
    : []

  return (
    <footer className="mt-12 border-t border-forest-700/10 bg-forest-900 pb-24 pt-10 text-paper/80 md:mt-16 md:pb-10">
      <div className="container-page">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/brand/logo.svg" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" aria-hidden="true" />
              <p className="font-display text-sm font-semibold text-paper">NELFUND Student Guide</p>
            </div>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-paper/60">
              An independent guide for Nigerian tertiary students. Not produced or endorsed by NELFUND or any
              institution. Always confirm important decisions on the official portal.
            </p>
            <Link to="/ask" className="mt-4 inline-flex text-sm font-semibold text-gold-300 hover:text-gold-100">
              Ask support →
            </Link>
          </div>
          <div>
            <p className="eyebrow text-gold-300">Official sources</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {nationalSources.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-gold-500/50 underline-offset-2 hover:text-paper"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            {ownSources.length > 0 && (
              <>
                <p className="mt-4 eyebrow text-gold-300">
                  Institution-specific ({institution?.short_name ?? 'your institution'})
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {ownSources.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-gold-500/50 underline-offset-2 hover:text-paper"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-paper/10 pt-6 text-xs text-paper/50">
          <span>Not affiliated with NELFUND or any institution.</span>
          <Link to="/sources" className="underline underline-offset-2 hover:text-paper">
            All official links
          </Link>
        </div>
      </div>
    </footer>
  )
}
