import { Link } from 'react-router-dom'
import { sources } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'

export default function Footer() {
  const { institutionId, institution } = useInstitution()
  const nationalSources = sources.filter((s) => s.official && s.scope === 'nelfund-wide')

  // Only the selected institution's own sources are ever shown here.
  const ownSources = institutionId
    ? sources.filter((s) => s.official && s.scope === 'institution-specific' && s.institution_id === institutionId)
    : []

  return (
    <footer className="mt-16 border-t border-forest-700/10 bg-forest-900 pb-24 pt-10 text-paper/80 md:pb-10">
      <div className="container-page">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-display text-sm font-semibold text-paper">NELFUND Student Guide</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-paper/60">
              An independent, unofficial guide to NELFUND for Nigerian tertiary students.
              Usable by students at any institution. Not produced or endorsed by NELFUND or any
              institution. Always confirm important decisions on the official portal.
            </p>
          </div>
          <div>
            <p className="eyebrow text-gold-300">Official sources</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {nationalSources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-gold-500/50 underline-offset-2 hover:text-paper">
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
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-gold-500/50 underline-offset-2 hover:text-paper">
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
          <Link to="/sources" className="underline underline-offset-2 hover:text-paper">All official links</Link>
        </div>
      </div>
    </footer>
  )
}
