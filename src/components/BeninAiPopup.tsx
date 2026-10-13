/**
 * Subtle, dismissible BENIN.AI pilot popup.
 * Independent channel — not affiliated with NELFUND.
 * Non-blocking; never interrupts pending AI turns.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AI_ANSWER_READY_EVENT,
  BENIN_AI_AVATAR_URL,
  BENIN_AI_URL,
  canShowPopup,
  recordClick,
  recordDismiss,
  recordImpression,
} from '../lib/beninPopup'

const OTHER_PAGE_DELAY_MS = 12000

type Props = {
  /** When true, only show after AI_ANSWER_READY_EVENT (Ask workspace). */
  askMode?: boolean
}

export default function BeninAiPopup({ askMode = false }: Props) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const shownRef = useRef(false)
  const titleId = useId()
  const descId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  const tryOpen = useCallback(() => {
    if (shownRef.current) return
    if (!canShowPopup(pathname)) return
    shownRef.current = true
    setOpen(true)
    recordImpression()
  }, [pathname])

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    if (askMode || pathname === '/ask') {
      const onReady = () => {
        // Short delay so the answer is readable before the panel appears
        window.setTimeout(() => tryOpen(), 1800)
      }
      window.addEventListener(AI_ANSWER_READY_EVENT, onReady)
      return () => window.removeEventListener(AI_ANSWER_READY_EVENT, onReady)
    }

    // Other public pages: modest delay after engagement time
    const t = window.setTimeout(() => tryOpen(), OTHER_PAGE_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [pathname, askMode, tryOpen])

  useEffect(() => {
    if (!open) return
    // Focus close control for keyboard users
    const t = window.setTimeout(() => closeRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onDismiss() {
    setOpen(false)
    recordDismiss()
  }

  function onCtaClick() {
    recordClick()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 sm:bottom-4 sm:justify-end sm:p-4 md:bottom-6 md:right-6 md:left-auto md:justify-end"
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="pointer-events-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-ink/10 bg-white p-3.5 shadow-lg shadow-ink/10 motion-reduce:animate-none sm:p-4"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {!imgFailed ? (
              <img
                src={BENIN_AI_AVATAR_URL}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-ink/10"
                onError={() => setImgFailed(true)}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B5E3B] text-sm font-bold text-white"
                aria-hidden
              >
                B
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p id={titleId} className="text-sm font-semibold text-ink">
                Explore BENIN.AI Official
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onDismiss}
                className="rounded-md p-1 text-ink/45 hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3B]/40"
                aria-label="Dismiss BENIN.AI promotion"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <p id={descId} className="mt-1 text-[12px] leading-snug text-ink/55">
              AI, technology, education, and African innovation — an independent channel, not affiliated with
              NELFUND.
            </p>
            <a
              href={BENIN_AI_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}
              className="mt-2.5 inline-flex min-h-9 items-center justify-center rounded-full bg-[#1B5E3B] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3B]/50"
            >
              Explore BENIN.AI on YouTube
            </a>
            <p className="mt-1.5 text-[10px] text-ink/35">Opens YouTube in a new tab · You can dismiss anytime</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
