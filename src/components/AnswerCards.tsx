import type { GroundedAnswer, EscalationContactView } from '../lib/ai'
import TrustBadge from './TrustBadge'

function statusLabel(status: string): 'verified' | 'may_change' | 'guidance' | 'unverified' {
  if (status === 'verified' || status === 'may_change' || status === 'guidance' || status === 'unverified') {
    return status
  }
  return 'guidance'
}

function ContactCard({
  title,
  subtitle,
  contact,
  kind,
}: {
  title: string
  subtitle?: string | null
  contact: EscalationContactView
  kind: 'nelfund' | 'institution'
}) {
  const isTicket = Boolean(contact.url && /esupport\.ng/i.test(contact.url))
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        kind === 'nelfund' ? 'border-forest-700/20 bg-white' : 'border-forest-700/10 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="rounded-full bg-forest-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-forest-700">
          {contact.priority}
        </span>
        <TrustBadge status={statusLabel(contact.verification_status)} />
      </div>
      {subtitle && <p className="mt-0.5 text-xs font-medium text-ink/70">{subtitle}</p>}
      <p className="mt-1 text-xs text-ink/55">{contact.why}</p>

      <div className="mt-2 flex flex-col gap-1.5">
        {isTicket && contact.url && (
          <a
            href={contact.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-forest-700 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Open NELFUND Support →
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800 underline underline-offset-2"
          >
            <span aria-hidden>📧</span>
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800 underline underline-offset-2"
          >
            <span aria-hidden>📞</span>
            {contact.phone}
          </a>
        )}
        {contact.url && !isTicket && (
          <a
            href={contact.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700"
          >
            {kind === 'nelfund' ? 'Open official page →' : 'Open institution page →'}
          </a>
        )}
        {!contact.email && !contact.phone && contact.url && !isTicket && (
          <p className="text-[11px] text-ink/45">
            No unit email is stored here. Use the official page to confirm the correct contact before writing.
          </p>
        )}
      </div>
      {contact.notes && <p className="mt-1.5 text-[11px] text-ink/45">{contact.notes}</p>}
    </div>
  )
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
            {answer.nextActions.slice(0, 5).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </div>
      )}

      {answer.escalation && (
        <div className="rounded-xl border border-forest-700/15 bg-forest-50/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-800">Support path</p>
          <p className="mt-1 text-sm text-ink/80">{answer.escalation.understanding}</p>

          {answer.escalation.diagnosis.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink/70">
              {answer.escalation.diagnosis.slice(0, 4).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}

          {answer.escalation.needsInstitution && (
            <p className="mt-2 rounded-lg bg-gold-100 px-2 py-1.5 text-xs text-ink/80">
              Which institution/school are you attending? Reply with the name so I can show the right offices.
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

          {answer.escalation.nelfundContacts.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">NELFUND support</p>
              {answer.escalation.nelfundContacts.map((c) => (
                <ContactCard key={c.id} title={c.label} contact={c} kind="nelfund" />
              ))}
            </div>
          )}

          {answer.escalation.institutionContacts.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">
                Your institution
                {answer.escalation.institutionName ? ` · ${answer.escalation.institutionName}` : ''}
              </p>
              {answer.escalation.institutionContacts.map((c) => (
                <ContactCard
                  key={c.id}
                  title={c.label}
                  subtitle={c.office}
                  contact={c}
                  kind="institution"
                />
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">What to send</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink/70">
              {answer.escalation.evidenceChecklist.slice(0, 6).map((item) => (
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
            {answer.sources.slice(0, 4).map((s) => (
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

      {answer.insufficientReason && <p className="text-xs text-amber-800">{answer.insufficientReason}</p>}
    </div>
  )
}
