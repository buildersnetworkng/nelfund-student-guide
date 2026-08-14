import type { InformationScope } from '../lib/types'
import { getInstitution } from '../lib/data'

interface ScopeBadgeProps {
  scope: InformationScope | null | undefined
  institutionId?: string | null
}

export default function ScopeBadge({ scope, institutionId }: ScopeBadgeProps) {
  if (!scope) return null

  if (scope === 'nelfund-wide') {
    return (
      <span
        className="inline-flex items-center rounded-md border border-forest-500 bg-forest-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700"
        title="Applies to every NELFUND applicant nationwide, not just one institution."
      >
        NELFUND-wide
      </span>
    )
  }

  const institution = getInstitution(institutionId ?? null)
  const label = institution ? `${institution.short_name}-specific` : 'Institution-specific'

  return (
    <span
      className="inline-flex items-center rounded-md border border-gold-500 bg-gold-100/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-700"
      title="Specific to how this institution handles it — don't assume another institution's process matches."
    >
      {label}
    </span>
  )
}
