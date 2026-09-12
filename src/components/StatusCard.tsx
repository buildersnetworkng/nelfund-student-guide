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

function stripLongDashes(s: string) {
  return s.replace(/[\u2010-\u2015\u2212]/g, '-')
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
    status_label: stripLongDashes(asLive.status_label),
    note: asLive.note,
    last_checked: formatChecked(asLive),
    freshness: asLive.freshness || ('static_fallback' as const),
    verified: Boolean(asLive.verified),
  }
}

/** Split note into readable blocks (bullets / short paragraphs). */
function NoteBlocks({ note }: { note: string }) {
  const lines = stripLongDashes(note || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  // Prefer bullet lines that start with • or -
  const bullets = lines.filter((l) => /^[•\-]/.test(l))
  const rest = lines.filter((l) => !/^[•\-]/.test(l))

  return (
    <div className="mt-3 space-y-2 text-sm leading-relaxed text-paper/85">
      {bullets.length > 0 ? (
        <ul className="list-none space-y-2">
          {bullets.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" aria-hidden />
              <span>{line.replace(/^[•\-]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {rest.map((line, i) => (
        <p key={`p-${i}`} className="text-paper/75">
          {line}
        </p>
      ))}
    </div>
  )
}

export default function StatusCard() {
  const [view, setView] = useState(() => toView(staticStatus))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const live = await fetchLiveApplicationStatus({ force: true })
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
      <div className="mt-2 flex items-start gap-2">
        <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span className="font-display text-base font-semibold leading-snug text-paper sm:text-lg">
          {view.status_label}
        </span>
      </div>
      <NoteBlocks note={view.note} />
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
          href="https://nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-paper ring-1 ring-white/20 transition hover:bg-white/15"
        >
          Log in / sign in
        </a>
        <a
          href="https://portal.nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-xs font-semibold text-gold-300/90 transition hover:text-gold-300"
        >
          Sign up / apply
        </a>
      </div>
    </div>
  )
}
