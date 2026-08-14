import { getRecommendedVideos, getInstitution } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import type { Video, VideoSourceType } from '../lib/types'

interface RecommendedVideoProps {
  videoIds: string[]
  topicLabel?: string
}

const SOURCE_LABEL: Record<VideoSourceType, string> = {
  official: '✓ Official NELFUND',
  university: '✓ Official university source',
  educational: 'Third-party tutorial',
  community: 'Third-party tutorial',
  third_party: 'Third-party — unverified',
}

function sourceLabel(video: Video): string {
  if (video.source_type === 'university') {
    const institution = getInstitution(video.institution_id)
    return institution ? `✓ Official university source — ${institution.short_name}` : SOURCE_LABEL.university
  }
  return SOURCE_LABEL[video.source_type]
}

/**
 * Renders the "🎥 Recommended Video" pattern: a short explanation plus a
 * "Watch tutorial →" link that opens the specific YouTube video when available,
 * or an explicit "No sufficiently reliable tutorial is currently available"
 * message when it isn't. Never fabricates a link.
 */
export default function RecommendedVideo({ videoIds, topicLabel }: RecommendedVideoProps) {
  const { institutionId } = useInstitution()
  const available = getRecommendedVideos(videoIds, institutionId)

  if (available.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-forest-700/20 bg-forest-50 px-4 py-3 text-sm text-ink/55">
        🎥 <span className="font-semibold">Recommended video</span>
        <p className="mt-1">
          No sufficiently reliable tutorial is currently available{topicLabel ? ` for ${topicLabel}` : ' for this topic'}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {available.map((v) => (
        <div key={v.id} className="rounded-xl2 border border-forest-700/15 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">🎥 Recommended video</p>
          <p className="mt-1 text-sm font-semibold text-ink">{v.title}</p>
          <p className="mt-0.5 text-xs text-ink/60">By {v.channel || 'Unknown channel'} · {sourceLabel(v)}</p>
          <p className="mt-1 text-xs text-ink/60">{v.description}</p>
          {v.warning && (
            <p className="mt-2 rounded-lg bg-amber-100/60 px-3 py-1.5 text-xs text-amber-800">⚠️ {v.warning}</p>
          )}
          <a
            href={v.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-forest-700 underline underline-offset-2"
          >
            Watch tutorial →
          </a>
        </div>
      ))}
    </div>
  )
}
