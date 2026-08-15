import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { answerQuestion } from '../lib/ai'
import type { GroundedAnswer, ConversationTurn } from '../lib/ai'
import { useInstitution } from '../context/InstitutionContext'
import TrustBadge from '../components/TrustBadge'
import InstitutionNotice from '../components/InstitutionNotice'

const EXAMPLE_QUESTIONS = [
  "I'm trying to open that nelfund stuff but it is showing missing information",
  'The nelfund portal is not accepting my Jamb registration number',
  'My school no dey show for the portal',
  "I've submitted since and this thing is still pending",
  'Nelfund rejected me, what do I do now?',
  'How do I get the 20k upkeep?',
  'I already paid my school fees before this loan thing',
  'Do I have to pay this money back after school?',
  'My jamb number is correct but it keeps saying invalid',
  'How do I apply?',
]

function statusLabel(status: string): 'verified' | 'may_change' | 'guidance' | 'unverified' {
  if (status === 'verified' || status === 'may_change' || status === 'guidance' || status === 'unverified') {
    return status
  }
  return 'guidance'
}

function intentLabel(intent: string): string {
  return intent.replace(/-/g, ' ')
}

export default function Ask() {
  const { institutionId } = useInstitution()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [result, setResult] = useState<GroundedAnswer | null>(null)
  const [history, setHistory] = useState<ConversationTurn[]>([])

  function run(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    const nextHistory: ConversationTurn[] = [...history, { role: 'user', text: trimmed }]
    const answer = answerQuestion(trimmed, institutionId, history)
    setResult(answer)
    setHistory([
      ...nextHistory,
      { role: 'assistant', text: answer.answer, intent: answer.intent },
    ].slice(-8))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    run(query)
  }

  function clearThread() {
    setHistory([])
    setResult(null)
    setSubmitted(null)
    setQuery('')
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
        Describe your problem in your own words — even informal or incomplete sentences. Answers
        come only from this platform’s verified knowledge layer. The assistant will not invent
        deadlines, amounts, or policies.
      </p>
      <div className="mt-2">
        <InstitutionNotice />
      </div>

      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="ask-input" className="sr-only">Your question</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="ask-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "My school no dey show" or "JAMB number keeps rejecting"'
            className="w-full rounded-full border border-forest-700/20 bg-white px-5 py-3.5 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-forest-500/40"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0 px-6">Ask</button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => { setQuery(q); run(q) }}
            className="rounded-full border border-forest-700/15 bg-forest-50 px-3 py-1.5 text-xs font-medium text-forest-700 hover:bg-forest-100"
          >
            {q.length > 52 ? `${q.slice(0, 50)}…` : q}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div className="mt-3 flex items-center gap-3 text-xs text-ink/50">
          <span>Follow-up context is on.</span>
          <button type="button" onClick={clearThread} className="underline underline-offset-2 hover:text-ink">Clear conversation</button>
        </div>
      )}

      {result && submitted && (
        <div className="mt-8 space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
            <span>Question: <span className="font-medium text-ink/70">“{submitted}”</span></span>
            {result.problem && (
              <span className="rounded-full bg-forest-50 px-2 py-0.5 font-medium text-forest-700">
                Understood as: {result.problem}
              </span>
            )}
            <span className="rounded-full bg-ink/5 px-2 py-0.5">
              Intent: {intentLabel(result.intent)}
              {result.confidence >= 0.7 ? '' : ' (low confidence)'}
            </span>
          </div>

          {!result.hasEvidence ? (
            <div className="card border-amber-500/40 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">Insufficient verified information</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{result.answer}</p>
              {result.whatThisMeans && <p className="mt-2 text-sm text-ink/65">{result.whatThisMeans}</p>}
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/70">
                {result.nextActions.map((a) => (<li key={a}>{a}</li>))}
              </ul>
              {result.clarifyingQuestions?.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-white/70 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">To help further, tell me</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
                    {result.clarifyingQuestions.map((q) => (<li key={q}>{q}</li>))}
                  </ul>
                </div>
              )}
              <a href={result.officialFallbackUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2">
                Open official NELFUND portal →
              </a>
            </div>
          ) : (
            <>
              <section className="card">
                <p className="eyebrow">Answer</p>
                <p className="mt-2 text-base leading-relaxed text-ink">{result.answer}</p>
                {evidenceNote && (
                  <p className="mt-3 text-xs text-ink/50">Grounded in platform knowledge · trust labels: {evidenceNote}</p>
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

              {result.clarifyingQuestions?.length > 0 && (
                <section className="card border-gold-500/30 bg-gold-50/40">
                  <p className="eyebrow">If you can add detail</p>
                  <p className="mt-1 text-xs text-ink/55">Reply with more detail so the next answer can be more specific.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
                    {result.clarifyingQuestions.map((q) => (<li key={q}>{q}</li>))}
                  </ul>
                </section>
              )}

              <section className="card">
                <p className="eyebrow">Verified sources used</p>
                <ul className="mt-3 space-y-2">
                  {result.sources.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.official ? 'bg-forest-700 text-paper' : 'bg-forest-50 text-forest-700'
                      }`}>{s.official ? 'Official' : 'Guide'}</span>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-forest-700 underline underline-offset-2">{s.label}</a>
                      ) : (
                        <span className="text-ink/70">{s.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-2">
                  {result.evidence.slice(0, 3).map((e) => (
                    <div key={`${e.kind}-${e.id}`} className="flex flex-wrap items-center gap-2">
                      <TrustBadge status={statusLabel(e.verification_status)} sourceId={e.source_id} lastVerified={e.last_verified} />
                      <Link to={e.path} className="text-xs text-forest-700 underline underline-offset-2">{e.title}</Link>
                    </div>
                  ))}
                </div>
              </section>

              {result.video && (
                <section className="card">
                  <p className="eyebrow">Relevant video guide</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{result.video.title}</p>
                  <p className="mt-1 text-xs text-ink/55">{result.video.channel} · {result.video.source_type} · not an official NELFUND instruction</p>
                  {result.video.warning && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{result.video.warning}</p>
                  )}
                  <a href={result.video.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2">
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
