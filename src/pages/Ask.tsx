import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { answerQuestion } from '../lib/ai'
import type { GroundedAnswer } from '../lib/ai'
import { useInstitution } from '../context/InstitutionContext'
import TrustBadge from '../components/TrustBadge'
import InstitutionNotice from '../components/InstitutionNotice'

const EXAMPLE_QUESTIONS = [
  'What is NELFUND?',
  'Is NELFUND a scholarship or a loan?',
  'How do I apply?',
  'How much is upkeep?',
  'My school is not showing',
  'My application is pending',
  'Will NELFUND pay my school fees?',
  'Do I need a guarantor?',
  'I already paid my school fees',
  'When do I repay?',
]

function statusLabel(status: string): 'verified' | 'may_change' | 'guidance' | 'unverified' {
  if (status === 'verified' || status === 'may_change' || status === 'guidance' || status === 'unverified') {
    return status
  }
  return 'guidance'
}

export default function Ask() {
  const { institutionId } = useInstitution()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [result, setResult] = useState<GroundedAnswer | null>(null)

  function run(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    setResult(answerQuestion(trimmed, institutionId))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    run(query)
  }

  const evidenceNote = useMemo(() => {
    if (!result?.hasEvidence) return null
    const statuses = Array.from(new Set(result.evidence.map((e) => e.verification_status)))
    return statuses.join(', ')
  }, [result])

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Ask the guide</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Ask a NELFUND question</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Answers come only from this platform's verified knowledge layer (FAQs, facts, troubleshooting,
        guides, and official sources). The assistant will not invent deadlines, amounts, or policies.
      </p>
      <div className="mt-2">
        <InstitutionNotice />
      </div>

      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="ask-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "How much is upkeep?" or "My school is not showing"'
            className="w-full rounded-full border border-forest-700/20 bg-white px-5 py-3.5 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-forest-500/40"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0 px-6">
            Ask
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setQuery(q)
              run(q)
            }}
            className="rounded-full border border-forest-700/15 bg-forest-50 px-3 py-1.5 text-xs font-medium text-forest-700 hover:bg-forest-100"
          >
            {q}
          </button>
        ))}
      </div>

      {result && submitted && (
        <div className="mt-8 space-y-4" aria-live="polite">
          <p className="text-xs text-ink/50">
            Question: <span className="font-medium text-ink/70">"{submitted}"</span>
          </p>

          {!result.hasEvidence ? (
            <div className="card border-amber-500/40 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">Insufficient verified information</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{result.answer}</p>
              {result.whatThisMeans && (
                <p className="mt-2 text-sm text-ink/65">{result.whatThisMeans}</p>
              )}
              {result.insufficientReason && (
                <p className="mt-2 text-xs text-ink/50">{result.insufficientReason}</p>
              )}
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/70">
                {result.nextActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <a
                href={result.officialFallbackUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2"
              >
                Open official NELFUND portal →
              </a>
            </div>
          ) : (
            <>
              <section className="card">
                <p className="eyebrow">Answer</p>
                <p className="mt-2 text-base leading-relaxed text-ink">{result.answer}</p>
                {evidenceNote && (
                  <p className="mt-3 text-xs text-ink/50">
                    Grounded in platform knowledge · trust labels: {evidenceNote}
                  </p>
                )}
              </section>

              {result.whatThisMeans && (
                <section className="card">
                  <p className="eyebrow">What this means</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{result.whatThisMeans}</p>
                </section>
              )}

              <section className="card border-forest-700/15 bg-forest-50/50">
                <p className="eyebrow">What you should do next</p>
                <ol className="mt-2 space-y-2">
                  {result.nextActions.map((a, i) => (
                    <li key={a} className="flex gap-2 text-sm text-ink/75">
                      <span className="font-display font-semibold text-forest-700">{i + 1}.</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="card">
                <p className="eyebrow">Verified sources used</p>
                <ul className="mt-3 space-y-2">
                  {result.sources.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          s.official ? 'bg-forest-700 text-paper' : 'bg-forest-50 text-forest-700'
                        }`}
                      >
                        {s.official ? 'Official' : 'Guide'}
                      </span>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-forest-700 underline underline-offset-2"
                        >
                          {s.label}
                        </a>
                      ) : (
                        <span className="text-ink/70">{s.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-2">
                  {result.evidence.slice(0, 3).map((e) => (
                    <div key={`${e.kind}-${e.id}`} className="flex flex-wrap items-center gap-2">
                      <TrustBadge
                        status={statusLabel(e.verification_status)}
                        sourceId={e.source_id}
                        lastVerified={e.last_verified}
                      />
                      <Link to={e.path} className="text-xs text-forest-700 underline underline-offset-2">
                        {e.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              {result.video && (
                <section className="card">
                  <p className="eyebrow">Relevant video guide</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{result.video.title}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {result.video.channel} · {result.video.source_type} · not an official NELFUND instruction
                  </p>
                  {result.video.warning && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {result.video.warning}
                    </p>
                  )}
                  {result.video.freshness_note && (
                    <p className="mt-1 text-xs text-ink/50">{result.video.freshness_note}</p>
                  )}
                  <a
                    href={result.video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2"
                  >
                    Watch on YouTube →
                  </a>
                </section>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-10 text-xs text-ink/45">
        This assistant is an interface to verified content on this unofficial student guide. It is not
        affiliated with NELFUND. Always confirm important decisions on official NELFUND channels.
      </p>
    </div>
  )
}
