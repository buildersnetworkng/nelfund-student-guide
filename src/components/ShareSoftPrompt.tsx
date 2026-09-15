import { useEffect, useState } from 'react'
import ShareGuide from './ShareGuide'
import { trackFeature } from '../lib/analytics'

const STORAGE_KEY = 'nelfund-share-soft-dismissed'

export default function ShareSoftPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      /* private mode */
    }
    const timer = window.setTimeout(() => {
      setVisible(true)
      trackFeature('share_open', { variant: 'soft-prompt-shown' })
    }, 18000)
    return () => window.clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:left-auto sm:right-5 sm:w-[22rem]"
      role="status"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-forest-100 bg-white p-3 shadow-xl">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Send this to a classmate</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
            If the guide helped you, share it so another student is not guessing on the portal.
          </p>
          <div className="mt-2">
            <ShareGuide variant="button" className="!min-h-[36px] !px-3 !py-1.5 !text-xs" />
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1.5 text-ink/40 hover:bg-forest-50 hover:text-ink"
          aria-label="Dismiss share reminder"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
