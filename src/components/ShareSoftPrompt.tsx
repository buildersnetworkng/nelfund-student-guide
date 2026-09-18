import { useEffect, useState } from 'react'
import ShareGuide, { SHARE_TEXT } from './ShareGuide'
import { trackFeature } from '../lib/analytics'

const STORAGE_KEY = 'nelfund-share-soft-dismissed'
const VALUE_KEY = 'nelfund-share-value-seen'
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
    return window.sessionStorage.getItem(STORAGE_KEY) === '1'
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (alreadyDismissed()) return

    let shown = false
    let valueTimer: number | undefined

    function reveal() {
      if (shown || alreadyDismissed()) return
      shown = true
      setVisible(true)
      trackFeature('share_prompt_shown', { variant: 'soft-prompt' })
    }

    function onValue() {
      if (shown || alreadyDismissed()) return
      if (valueTimer) window.clearTimeout(valueTimer)
      valueTimer = window.setTimeout(reveal, 2200)
    }

    function onScroll() {
      if (shown || alreadyDismissed()) return
      const help = document.getElementById('home-help')
      const helpVisible = help ? help.getBoundingClientRect().top < window.innerHeight * 0.92 : false
      const scrolledPastStatus = window.scrollY > 420
      if (helpVisible || scrolledPastStatus) {
        markShareValue()
        onValue()
      }
    }

    window.addEventListener('nelfund-share-value', onValue)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (hasValue()) onValue()
    onScroll()

    return () => {
      window.removeEventListener('nelfund-share-value', onValue)
      window.removeEventListener('scroll', onScroll)
      if (valueTimer) window.clearTimeout(valueTimer)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    trackFeature('share_prompt_dismissed', { variant: 'soft-prompt' })
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md sm:bottom-5 sm:left-auto sm:right-5 sm:w-[22rem]"
      role="status"
    >
      <div className="rounded-2xl border border-forest-100 bg-white p-3.5 shadow-xl">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">One student can help ten more</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              If this guide helped you, drop it in your class or department WhatsApp group so others
              are not stuck on the portal alone.
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
        <p className="mt-2 text-[11px] leading-relaxed text-ink/40">
          Pick the group chat in WhatsApp, not one friend.
        </p>
      </div>
    </div>
  )
}
