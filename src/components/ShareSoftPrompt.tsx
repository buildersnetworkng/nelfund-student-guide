import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ShareGuide, { SHARE_TEXT } from './ShareGuide'
import { trackFeature } from '../lib/analytics'
import { setShareSoftOpen } from '../lib/promoGate'

/** Bumped key so older dismiss flags no longer hide the card */
const STORAGE_KEY = 'nelfund-share-soft-v3'
const VALUE_KEY = 'nelfund-share-value-seen'
const DISMISS_MS = 1000 * 60 * 60 * 6
const SKIP_PROMPT_PATHS = [
  '/ask',
  '/apply',
  '/fees',
  '/upkeep',
  '/troubleshooting',
  '/faq',
  '/videos',
  '/sources',
  '/readiness',
  '/admin',
]

const WHATSAPP_HREF = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`

export function markShareValue() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(VALUE_KEY, '1')
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event('nelfund-share-value'))
}

function alreadyDismissed() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < DISMISS_MS
  } catch {
    return false
  }
}

export default function ShareSoftPrompt() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (SKIP_PROMPT_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))) {
      setVisible(false)
      setShareSoftOpen(false)
      return
    }
    if (alreadyDismissed()) {
      setVisible(false)
      setShareSoftOpen(false)
      return
    }

    let shown = false
    let timer: number | undefined

    function reveal() {
      if (shown || alreadyDismissed()) return
      shown = true
      setVisible(true)
      setShareSoftOpen(true)
      try {
        trackFeature('share_prompt_shown')
      } catch {
        /* ignore */
      }
    }

    // Home and other non-skipped pages: short delay so content paints first
    timer = window.setTimeout(reveal, 1500)

    return () => {
      if (timer) window.clearTimeout(timer)
      setShareSoftOpen(false)
    }
  }, [location.pathname])

  function dismiss() {
    setVisible(false)
    setShareSoftOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    try {
      trackFeature('share_prompt_dismissed')
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-24 left-3 right-3 z-[65] mx-auto max-w-md sm:bottom-5 sm:left-auto sm:right-5 sm:w-[22rem]"
      style={{ animation: 'soft-rise 0.4s ease-out' }}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-forest-200 bg-white p-3.5 shadow-2xl ring-1 ring-forest-900/5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">One student can help ten more</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              If this guide helped you, drop it in your class or department WhatsApp group so others are not stuck on
              the portal alone.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1.5 text-ink/35 hover:bg-forest-50 hover:text-ink"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              try {
                trackFeature('share_channel')
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-[#25D366] px-3 text-xs font-semibold text-white"
          >
            Send to class group
          </a>
          <ShareGuide variant="button" className="!min-h-[40px] !px-3 !py-1.5 !text-xs" />
        </div>
      </div>
    </div>
  )
}
