import { useEffect, useState } from 'react'
import { getCurrentAcademicCycle } from '../lib/academicCycle'

type LiveStatus = {
  cycle?: string
  status?: string
  status_label?: string
  note?: string
  last_checked?: string
}

function labelFor(status?: string, fallback?: string) {
  if (fallback) return fallback
  if (!status) return 'Check official portal'
  const s = status.toLowerCase()
  if (s.includes('open')) return 'Application window open'
  if (s.includes('closed')) return 'Application window closed'
  if (s.includes('pending')) return 'Status pending'
  return 'Check official portal'
}

export default function StatusCard() {
  const [live, setLive] = useState<LiveStatus | null>(null)
  const cycle = getCurrentAcademicCycle()

  useEffect(() => {
    let cancelled = false
    fetch('/api/knowledge/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setLive(data as LiveStatus)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const statusText = labelFor(live?.status, live?.status_label)
  const freshnessLabel = live?.last_checked
    ? `Checked ${live.last_checked}`
    : 'Confirm on official portal'

  return (
    <div className="rounded-2xl bg-forest-900 px-4 py-4 text-paper shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-paper/50">
        Application status
      </p>
      <p className="mt-1 font-display text-lg font-semibold leading-snug">{statusText}</p>
      <p className="mt-1 text-xs text-paper/70">
        Cycle focus: {live?.cycle || cycle.label}
        {live?.note ? ` · ${live.note}` : ''}
      </p>
      <div className="mt-2 text-[10px] text-paper/45">
        <span>{freshnessLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="https://nelf.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-paper ring-1 ring-white/20 transition hover:bg-white/15"
        >
          Official website
        </a>
        <a
          href="https://portal.nelf.gov.ng/auth/login"
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
