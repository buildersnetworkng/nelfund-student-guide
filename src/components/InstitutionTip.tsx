import type { InstitutionTip as InstitutionTipData } from '../lib/types'
import { findInstitutionTip } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import ScopeBadge from './ScopeBadge'

/**
 * Renders nothing unless the student's selected institution has a matching
 * tip in `tips`. This is what keeps NELFUND-wide content (guide steps,
 * facts, FAQs) genuinely neutral: the shared text never names an
 * institution, and only a student who picked that institution ever sees
 * the addendum.
 */
export default function InstitutionTip({ tips }: { tips: InstitutionTipData[] }) {
  const { institutionId } = useInstitution()
  const match = findInstitutionTip(tips, institutionId)

  if (!match) return null

  return (
    <div className="mt-2 rounded-xl2 border border-gold-500/30 bg-gold-100/40 px-3 py-2">
      <ScopeBadge scope="institution-specific" institutionId={match.institution_id} />
      <p className="mt-1.5 text-sm text-ink/75">{match.tip}</p>
    </div>
  )
}
