import type { VerificationStatus } from '../lib/types'
import { getSource } from '../lib/data'

const COPY: Record<VerificationStatus, { label: string; icon: string; className: string; helper: string }> = {
  verified: {
    label: 'Verified',
    icon: '✓',
    className: 'stamp-verified',
    helper: 'Supported by an official NELFUND or institutional source.',
  },
  may_change: {
    label: 'May change',
    icon: '⚠',
    className: 'stamp-may-change',
    helper: 'Depends on the current session, institutional procedure, or a future official announcement.',
  },
  guidance: {
    label: 'General guidance',
    icon: 'ⓘ',
    className: 'stamp-guidance',
    helper: 'A useful explanation. Confirm against current official instructions.',
  },
  unverified: {
    label: 'Unverified',
    icon: '❗',
    className: 'stamp-unverified',
    helper: 'No official source yet. Do not treat this as confirmed fact.',
  },
}

interface TrustBadgeProps {
  status: VerificationStatus
  sourceId?: string | null
  lastVerified?: string | null
  compact?: boolean
}

export default function TrustBadge({ status, sourceId, lastVerified, compact }: TrustBadgeProps) {
  const { label, icon, className, helper } = COPY[status]
  const source = getSource(sourceId ?? null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={className} title={helper}>
        {icon} {label}
      </span>
      {!compact && source && (
        <span className="text-xs text-ink/50">
          Source: {source.official ? source.label : 'Guide notes'}
        </span>
      )}
      {!compact && (
        <span className="text-xs text-ink/50">
          {lastVerified ? `Last verified: ${formatDate(lastVerified)}` : 'Verification status: Pending'}
        </span>
      )}
      {!compact && status === 'unverified' && (
        <span className="text-xs text-ink/50">Check the official portal or your institution&apos;s latest announcement.</span>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}
