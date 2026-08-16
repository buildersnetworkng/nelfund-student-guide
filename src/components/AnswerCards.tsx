import type { GroundedAnswer } from '../lib/ai'
import TrustBadge from './TrustBadge'

function statusLabel(status: string): 'verified' | 'may_change' | 'guidance' | 'unverified' {
  if (status === 'verified' || status === 'may_change' || status === 'guidance' || status === 'unverified') {
    return status
  }
  return 'guidance'
}

export function AnswerCards({ answer }: { answer: GroundedAnswer }) {
  return (
    <div className="mt-3 space-y-3 border-t border-forest-700/10 pt-3">
      {answer.whatThisMeans && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">What this means</p>
          <p className="mt-0.5 text-sm text-ink/75">{answer.whatThisMeans}</p>
        </div>
      )}

      {answer.nextActions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">What to do next</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink/80">
            {answer.nextActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </div>
      )}

      {answer.escalation && (
        <div className="rounded-xl border border-forest-700/15 bg-forest-50/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-800">Support path</p>
          <p className="mt-1 text-sm text-ink/80">{answer.escalation.understanding}</p>

          {answer.escalation.diagnosis.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink/70">
              {answer.escalation.diagnosis.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}

          {answer.escalation.needsInstitution && (
            <p className="mt-2 rounded-lg bg-gold-100 px-2 py-1.5 text-xs text-ink/80">
              Reply with your institution name so I can show the relevant campus offices.
            </p>
          )}

          {answer.escalation.institutionName && (
            <p className="mt-2 text-xs text-ink/65">
              Institution: <span className="font-semibold text-ink">{answer.escalation.institutionName}</span>
            </p>
          )}

          {answer.escalation.contactOrderExplanation && (
            <p className="mt-1 text-xs text-ink/60">{answer.escalation.contactOrderExplanation}</p>
          )}

          {answer.escalation.institutionContacts.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Campus offices</p>
              {answer.escalation.institutionContacts.map((c) => (
                <div key={c.id} className="rounded-lg border border-forest-700/10 bg-white px-2.5 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-ink">{c.label}</span>
                    <span className="rounded-full bg-forest-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-forest-700">
                      {c.priority}
                    </span>
                    <TrustBadge status={statusLabel(c.verification_status)} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink/55">{c.why}</p>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-forest-700 underline underline-offset-2"
                    >
                      Official website
                    </a>
                  )}
                  {!c.email && !c.phone && (
                    <p className="mt-1 text-[11px] text-amber-800">
                      No unit email stored here. Confirm the correct contact on the institution website before writing.
                    </p>
                  )}
                  {c.notes && <p className="mt-0.5 text-[11px] text-ink/45">{c.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {answer.escalation.nelfundContacts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">NELFUND channels</p>
              {answer.escalation.nelfundContacts.map((c) => (
                <div key={c.id} className="text-sm text-ink/75">
                  <span className="font-medium">{c.label}</span>
                  {c.url && (
                    <>
                      {' · '}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-forest-700 underline underline-offset-2"
                      >
                        Open
                      </a>
                    </>
                  )}
                  <p className="text-xs text-ink/50">{c.why}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">What to send</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink/70">
              {answer.escalation.evidenceChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-ink/50">{answer.escalation.screenshotAdvice}</p>
          </div>

          {answer.escalation.supportMessage && (
            <div className="mt-3 rounded-lg border border-forest-700/15 bg-white px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-700">
                Ready-to-copy message (review before sending)
              </p>
              <p className="mt-1 text-xs font-semibold text-ink">
                Subject: {answer.escalation.supportMessage.subject}
              </p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-ink/75">
                {answer.escalation.supportMessage.body}
              </pre>
              <p className="mt-1 text-[10px] text-ink/45">This app never sends email for you.</p>
            </div>
          )}

          {answer.escalation.followUp && (
            <p className="mt-2 text-xs text-ink/65">{answer.escalation.followUp}</p>
          )}
        </div>
      )}

      {answer.video && (
        <div className="rounded-xl border border-forest-700/10 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Related video</p>
          <a
            href={answer.video.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-sm font-medium text-forest-800 underline underline-offset-2"
          >
            {answer.video.title}
          </a>
          <p className="mt-0.5 text-xs text-ink/50">
            {answer.video.channel}
            {answer.video.warning ? ` · ${answer.video.warning}` : ''}
          </p>
          <TrustBadge status={statusLabel(answer.video.verification_status)} />
        </div>
      )}

      {answer.sources.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Sources</p>
          <ul className="mt-1 space-y-1">
            {answer.sources.map((s) => (
              <li key={s.id} className="text-xs text-ink/70">
                {s.official && (
                  <span className="mr-1 rounded bg-forest-100 px-1 py-0.5 text-[9px] font-bold uppercase text-forest-800">
                    Official
                  </span>
                )}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.insufficientReason && (
        <p className="text-xs text-amber-800">{answer.insufficientReason}</p>
      )}
    </div>
  )
}
