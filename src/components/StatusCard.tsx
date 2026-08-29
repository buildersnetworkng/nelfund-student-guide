import { getCurrentAcademicCycle } from '../lib/academicCycle'
import { useEffect, useState } from 'react'
import { applicationStatus as staticStatus } from '../lib/data'
import {
  fetchLiveApplicationStatus,
  formatChecked,
  type LiveApplicationStatus,
} from '../lib/knowledge/client'
import type { ApplicationCycleStatus } from '../lib/types'

const STATUS_DOT: Record<ApplicationCycleStatus, string> = {
  not_announced: 'bg-ink/30',
  open: 'bg-forest-300',
  closed: 'bg-rust-500',
  extended: 'bg-gold-300',
  pending_verification: 'bg-gold-300',
}

function toView(s: LiveApplicationStatus | typeof staticStatus) {
  const asLive: LiveApplicationStatus = {
    cycle: s.cycle,
    status: s.status as LiveApplicationStatus['status'],
    status_label: s.status_label,
    note: s.note,
    last_checked: s.last_checked,
    last_checked_iso:
      'last_checked_iso' in s
        ? (s as LiveApplicationStatus).last_checked_iso
        : s.last_checked,
    freshness:
      'freshness' in s ? (s as LiveApplicationStatus).freshness : ('static_fallback' as const),
    verified: 'verified' in s ? Boolean((s as LiveApplicationStatus).verified) : false,
  }
  return {
    cycle: getCurrentAcademicCycle(),
    status: asLive.status as ApplicationCycleStatus,
    status_label: asLive.status_label,
    note: asLive.note,
    last_checked: formatChecked(asLive),
    freshness: asLive.freshness || ('static_fallback' as const),
    verified: Boolean(asLive.verified),
  }
}

export default function StatusCard() {
  const [view, setView] = useState(() => toView(staticStatus))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const live = await fetchLiveApplicationStatus()
        if (cancelled) return
        if (live) {
          setView(toView(live))
        } else {
          const iso = new Date().toISOString()
          setView(
            toView({
              ...staticStatus,
              last_checked: iso.slice(0, 10),
              last_checked_iso: iso,
              freshness: 'static_fallback',
              verified: false,
            } as typeof staticStatus & {
              last_checked_iso: string
              freshness: 'static_fallback'
              verified: boolean
            }),
          )
        }
      } catch {
        if (!cancelled) {
          const iso = new Date().toISOString()
          setView(
            toView({
              ...staticStatus,
              last_checked: iso.slice(0, 10),
              last_checked_iso: iso,
              freshness: 'static_fallback',
              verified: false,
            } as typeof staticStatus & {
              last_checked_iso: string
              freshness: 'static_fallback'
              verified: boolean
            }),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const dot = STATUS_DOT[view.status] || STATUS_DOT.pending_verification
  const freshnessLabel =
    view.freshness === 'live'
      ? 'Verified from official sources'
      : view.freshness === 'cached'
        ? 'Recently verified'
        : 'Confirm on official portal'

  return (
    <div className="card border-forest-700/20 bg-forest-700 text-paper">
      <div className="eyebrow text-gold-300">{view.cycle} application status</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
        <span className="font-display text-lg font-semibold text-paper">
          {view.status_label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-paper/80">{view.note}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper/60">
        <span>
          Last checked: {view.last_checked}
          {loading ? ' · updating…' : ''}
        </span>
        <span className="text-paper/40" aria-hidden>
          ·
        </span>
        <span>{freshnessLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="https://portal.nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-paper ring-1 ring-white/20 transition hover:bg-white/15"
        >
          Open official portal
        </a>
        <a
          href="https://nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-xs font-semibold text-gold-300/90 transition hover:text-gold-300"
        >
          nelf.gov.ng
        </a>
      </div>
    </div>
  )
}
