import { institutions } from '../lib/data'
import { useInstitution, useInstitutionNoticeText, OTHER_INSTITUTION } from '../context/InstitutionContext'

export default function InstitutionSelect() {
  const { institutionId, institution, setInstitutionId } = useInstitution()
  const noticeText = useInstitutionNoticeText()

  return (
    <div className="card">
      <label htmlFor="institution-select" className="text-sm font-semibold text-ink">
        Which institution do you attend?
      </label>
      <p className="mt-1 text-xs text-ink/55">
        Choose your institution to see relevant institution-specific guidance alongside it.
        General NELFUND information is available to everyone, whether or not you select one.
      </p>
      <select
        id="institution-select"
        value={institutionId ?? ''}
        onChange={(e) => setInstitutionId(e.target.value || null)}
        className="mt-2 w-full rounded-full border border-forest-700/20 bg-white px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-500/40"
      >
        <option value="">Select your institution</option>
        {institutions.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
        <option value={OTHER_INSTITUTION}>Other / my institution isn't listed</option>
      </select>

      {institutionId && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink/65">{noticeText}</p>
          {institution?.nelfund_instructions && (
            <p className="rounded-xl2 border border-forest-700/10 bg-forest-50 px-3 py-2 text-xs text-ink/60">
              {institution.nelfund_instructions}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
