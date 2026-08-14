import { Link } from 'react-router-dom'
import { getInstitution } from '../lib/data'
import ScopeBadge from './ScopeBadge'

interface ScopeRestrictedProps {
  /** The institution this content belongs to. */
  institutionId: string | null
  /** Where "back to the list" should go, e.g. /troubleshooting. */
  backTo: string
  backLabel: string
}

/**
 * Shown instead of a detail page's content when a student reaches an
 * institution-specific item directly by URL (bookmark, shared link, typed
 * address) without having that institution selected. This is what stops a
 * direct link from bypassing the same scope rule every list page already
 * enforces via getRelevantContent()/isContentVisible() — the item's content
 * is simply never rendered, not hidden with CSS or shown-then-warned.
 */
export default function ScopeRestricted({ institutionId, backTo, backLabel }: ScopeRestrictedProps) {
  const institution = getInstitution(institutionId)
  const name = institution?.short_name ?? institution?.name ?? 'this institution'

  return (
    <div className="container-page py-10">
      <Link to={backTo} className="text-sm text-forest-700 underline underline-offset-2">← {backLabel}</Link>

      <div className="card mt-6 border-gold-500/40 bg-gold-100/40">
        <ScopeBadge scope="institution-specific" institutionId={institutionId} />
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          This guide is specific to {name}. Select {name} as your institution to view it.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={backTo} className="btn-secondary">{backLabel}</Link>
          <Link to="/#institution" className="btn-primary bg-forest-700 text-paper hover:bg-forest-500">
            Select your institution
          </Link>
        </div>
      </div>
    </div>
  )
}
