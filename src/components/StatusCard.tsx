import { applicationStatus } from '../lib/data'
import type { ApplicationCycleStatus } from '../lib/types'

const STATUS_DOT: Record<ApplicationCycleStatus, string> = {
  not_announced: 'bg-ink/30',
  open: 'bg-forest-300',
  closed: 'bg-rust-500',
  extended: 'bg-gold-300',
  pending_verification: 'bg-gold-300',
}

export default function StatusCard() {
  const dot = STATUS_DOT[applicationStatus.status]

  return (
    <div className="card border-forest-700/20 bg-forest-700 text-paper">
      <div className="eyebrow text-gold-300">{applicationStatus.cycle} application status</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
        <span className="font-display text-lg font-semibold text-paper">
          {applicationStatus.status_label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-paper/80">{applicationStatus.note}</p>
      <p className="mt-3 text-xs text-paper/60">Last checked: {applicationStatus.last_checked}</p>
    </div>
  )
}
