import { useMemo, useState } from 'react'
import { videos, getRelevantContent } from '../lib/data'
import { useInstitution } from '../context/InstitutionContext'
import VideoCard from '../components/VideoCard'
import InstitutionNotice from '../components/InstitutionNotice'

export default function Videos() {
  const { institutionId } = useInstitution()

  const visibleVideos = useMemo(() => getRelevantContent(videos, institutionId), [institutionId])

  const categories = useMemo(() => Array.from(new Set(visibleVideos.map((v) => v.category))), [visibleVideos])
  const [active, setActive] = useState<string | 'All'>('All')

  const filtered = active === 'All' ? visibleVideos : visibleVideos.filter((v) => v.category === active)

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Video guides</p>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Tutorials organised by topic</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/65">
        Videos are labelled by source: official NELFUND, university, educational,
        community/third-party, or unverified third-party. A non-official label never means
        it is an official NELFUND instruction.
      </p>
      <div className="mt-2"><InstitutionNotice /></div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['All', ...categories] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              active === cat ? 'bg-forest-700 text-paper' : 'bg-forest-50 text-forest-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-ink/55">No videos in this category for the current filter.</p>
      )}
    </div>
  )
}
