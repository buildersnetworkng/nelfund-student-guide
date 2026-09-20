import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ShareGuide, { SHARE_TEXT } from './ShareGuide'
import { trackFeature } from '../lib/analytics'

const STORAGE_KEY = 'nelfund-share-soft-dismissed-at'
const VALUE_KEY = 'nelfund-share-value-seen'
const DISMISS_MS = 1000 * 60 * 60 * 24 * 3
/** Keep reading pages clear — soft share card only on Home and similar surfaces */
const SKIP_PROMPT_PATHS = ['/ask', '/apply', '/fees', '/upkeep', '/troubleshooting', '/faq', '/videos', '/sources', '/readiness']

const WHATSAPP_HREF = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`

/** Call after a student gets a useful answer or finishes a guide step. */
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

function hasValue() {
  try {
    return window.sessionStorage.getItem(VALUE_KEY) === '1'
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
      return
    }
    if (alreadyDismissed()) return

    let shown = false
    let valueTimer: number | undefined
    const startedAt = Date.now()

    function reveal() {
      if (shown || alreadyDismissed()) return
      if (Date.now() - startedAt < 1800) return
      shown = true
      setVisible(true)
      trackFeature('share_prompt_shown', { variant: 'soft-prompt' })
    }

    function onValue() {
      if (shown || alreadyDismissed()) return
      if (valueTimer) window.clearTimeout(valueTimer)
      valueTimer = window.setTimeout(reveal, 2800)
    }

    function onScroll() {
      if (shown || alreadyDismissed()) return
      const help = document.getElementById('home-help')
      if (!help) return
      if (help.getBoundingClientRect().top < window.innerHeight * 0.75) {
        markShareValue()
        onValue()
      }
    }

    window.addEventListener('nelfund-share-value', onValue)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (hasValue()) onValue()
    else {
      valueTimer = window.setTimeout(reveal, 9000)
    }

    return () => {
      window.removeEventListener('nelfund-share-value', onValue)
      window.removeEventListener('scroll', onScroll)
      if (valueTimer) window.clearTimeout(valueTimer)
    }
  }, [location.pathname])

  function dismiss() {
    setVisible(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    trackFeature('share_prompt_dismissed', { variant: 'soft-prompt' })
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-24 left-3 right-3 z-40 mx-auto max-w-md sm:bottom-5 sm:left-auto sm:right-5 sm:w-[22rem]"
      role="status"
    >
      <div className="rounded-2xl border border-forest-100 bg-white p-3.5 shadow-xl">
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
            onClick={() => trackFeature('share_channel', { channel: 'whatsapp', source: 'soft-prompt' })}
            className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-full bg-[#25D366] px-3 text-xs font-semibold text-white"
          >
            Send to class group
          </a>
          <ShareGuide variant="button" className="!min-h-[36px] !px-3 !py-1.5 !text-xs" />
        </div>
      </div>
    </div>
  )
}
