import { useMemo, useState } from 'react'
import { readinessQuestions, getInstitution } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import ScopeBadge from '../components/ScopeBadge'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Readiness() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const { institutionId } = useInstitution()

  const questions = useMemo(
    () => readinessQuestions.filter((q) => q.institution_id === null || q.institution_id === institutionId),
    [institutionId],
  )

  const total = questions.length
  const score = useMemo(
    () => questions.filter((q) => checked[q.id]).length,
    [checked, questions],
  )

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isReady = total > 0 && score === total
  const institution = getInstitution(institutionId)

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Preparation checklist</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Am I ready to apply?</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/65">
        Tick off what you already have. This is a preparation checklist to help you get
        organised — verify the final, official requirements on the NELFUND portal before
        you apply, since specific requirements can be updated between cycles.
      </p>
      <div className="mt-2"><InstitutionNotice /></div>

      <div
        className={`card mt-6 flex items-center justify-between ${
          isReady ? 'border-forest-500 bg-forest-50' : 'border-gold-500/40 bg-gold-100/50'
        }`}
        aria-live="polite"
      >
        <div>
          <p className="eyebrow">Application readiness score</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{score}/{total} ready</p>
        </div>
        <div className="h-16 w-16 flex-shrink-0">
          <ProgressRing value={score} total={total} />
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {questions.map((q) => (
          <li key={q.id}>
            <label className="card flex cursor-pointer items-start gap-3 hover:border-forest-500/40">
              <input
                type="checkbox"
                checked={!!checked[q.id]}
                onChange={() => toggle(q.id)}
                className="mt-1 h-5 w-5 flex-shrink-0 rounded border-forest-700/30 text-forest-700 focus:ring-forest-500"
              />
              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block text-sm font-semibold text-ink">{q.label}</span>
                  {q.institution_id && <ScopeBadge scope="institution-specific" institutionId={q.institution_id} />}
                </span>
                <span className="mt-0.5 block text-xs text-ink/55">{q.helper}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {institution && institution.verification_status !== 'unverified' && (
        <p className="mt-4 text-xs text-ink/50">
          {institution.short_name}-specific items above come from this guide's {institution.short_name} coverage —
          {' '}general items apply to every NELFUND applicant.
        </p>
      )}

      <p className="mt-6 text-xs text-ink/50">
        This checklist reflects common preparation items and is not an official statement of
        eligibility requirements. See the FAQ for what this guide can and cannot confirm about
        eligibility.
      </p>
    </div>
  )
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : value / total
  const circumference = 2 * Math.PI * 26
  const offset = circumference * (1 - pct)

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
      <circle cx="32" cy="32" r="26" fill="none" stroke="#EAF3EE" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="#0A4F2E"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 300ms ease' }}
      />
    </svg>
  )
}
