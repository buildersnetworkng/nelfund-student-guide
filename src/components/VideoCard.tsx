import type { Video, VideoSourceType } from '../lib/types'
import { getInstitution } from '../lib/data'

const SOURCE_TYPE_LABEL: Record<VideoSourceType, { label: string; className: string }> = {
  official: { label: '✓ Official NELFUND', className: 'stamp-verified' },
  university: { label: '✓ University', className: 'stamp-verified' },
  educational: { label: 'Educational channel — third-party tutorial', className: 'stamp-guidance' },
  community: { label: 'Community/third-party tutorial', className: 'stamp-guidance' },
  third_party: { label: 'Third-party — unverified', className: 'stamp-unverified' },
}

function getSourceBadge(video: Video): { label: string; className: string } {
  if (video.source_type === 'university') {
    const institution = getInstitution(video.institution_id)
    return {
      label: institution ? `✓ Official university source — ${institution.short_name}` : '✓ University',
      className: 'stamp-verified',
    }
  }
  return SOURCE_TYPE_LABEL[video.source_type]
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    return null
  } catch {
    return null
  }
}

export default function VideoCard({ video }: { video: Video }) {
  const embedUrl = video.url ? getEmbedUrl(video.url) : null
  const badge = getSourceBadge(video)
  const institution = getInstitution(video.institution_id)

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-ink">{video.title}</h3>
        <span className={badge.className}>{badge.label}</span>
      </div>
      <p className="mt-1 text-xs text-ink/60">
        {video.category}{institution ? ` · ${institution.short_name}-specific` : ''}
      </p>

      {embedUrl ? (
        <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-forest-700/10">
          <iframe
            src={embedUrl}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-forest-700/20 bg-forest-50 px-4 text-center text-xs text-ink/50">
          No sufficiently reliable tutorial is currently available for this topic yet.
        </div>
      )}

      <p className="mt-3 text-sm text-ink/70">{video.description}</p>

      {video.warning && (
        <p className="mt-2 rounded-lg bg-amber-100/60 px-3 py-1.5 text-xs text-amber-800">
          ⚠️ {video.warning}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
        {video.channel && (
          <span>
            By{' '}
            {video.channel_url ? (
              <a href={video.channel_url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-forest-700">
                {video.channel}
              </a>
            ) : (
              video.channel
            )}
          </span>
        )}
        <span>
          {video.last_reviewed ? `Last reviewed: ${video.last_reviewed}` : 'Review status: Pending'}
        </span>
      </div>
    </div>
  )
}
