import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { trackFeature } from '../lib/analytics'

/** Prefer live origin so share links match whatever domain the student is on */
function getSiteUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`
  }
  return 'https://nelfund-student-guide.vercel.app/'
}

function buildShareText(url: string) {
  return (
    '📌 NELFUND GUIDE\n' +
    'Students are advised to go through the NELFUND Guide before taking any further steps regarding NELFUND.\n' +
    'It provides key information and guidance for students at every stage of the process.\n' +
    `🔗 ${url}`
  )
}

const SHARE_TITLE = 'NELFUND Student Guide'

type Channel = {
  id: string
  label: string
  href?: string
  action?: 'native' | 'copy' | 'copy-link'
  tile: string
  icon: ReactNode
}

function buildChannels(siteUrl: string, shareText: string): Channel[] {
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(siteUrl)
  const encodedTitle = encodeURIComponent(SHARE_TITLE)

  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}`,
      tile: 'bg-[#25D366] text-white',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      tile: 'bg-[#26A5E4] text-white',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.064-1.226-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      id: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      tile: 'bg-ink text-white',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      tile: 'bg-[#1877F2] text-white',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      tile: 'bg-[#0A66C2] text-white',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      id: 'sms',
      label: 'SMS',
      href: `sms:?&body=${encodedText}`,
      tile: 'bg-forest-700 text-white',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
      tile: 'bg-gold-500 text-forest-900',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      ),
    },
    {
      id: 'copy',
      label: 'Copy text',
      action: 'copy',
      tile: 'bg-forest-50 text-forest-800 ring-1 ring-forest-100',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      ),
    },
    {
      id: 'copy-link',
      label: 'Copy link',
      action: 'copy-link',
      tile: 'bg-forest-50 text-forest-800 ring-1 ring-forest-100',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
        </svg>
      ),
    },
  ]
}

type ShareGuideProps = {
  variant?: 'icon' | 'button' | 'hero'
  className?: string
}

export default function ShareGuide({ variant = 'button', className = '' }: ShareGuideProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'text' | 'link' | null>(null)
  const [canNative, setCanNative] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleId = useId()

  const siteUrl = getSiteUrl()
  const shareText = buildShareText(siteUrl)
  const channels = buildChannels(siteUrl, shareText)

  useEffect(() => {
    setMounted(true)
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  const copy = useCallback(
    async (kind: 'text' | 'link') => {
      const value = kind === 'text' ? shareText : siteUrl
      try {
        await navigator.clipboard.writeText(value)
        setCopied(kind)
        window.setTimeout(() => setCopied(null), 2000)
      } catch {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(kind)
        window.setTimeout(() => setCopied(null), 2000)
      }
    },
    [shareText, siteUrl],
  )

  const shareNative = useCallback(async () => {
    try {
      trackFeature('share_channel', { channel: 'native' })
      await navigator.share({
        title: SHARE_TITLE,
        text: shareText,
        url: siteUrl,
      })
      setOpen(false)
    } catch {
      /* user cancelled */
    }
  }, [shareText, siteUrl])

  const onChannel = useCallback(
    async (ch: Channel) => {
      trackFeature('share_channel', { channel: ch.id })
      if (ch.action === 'copy') {
        await copy('text')
        return
      }
      if (ch.action === 'copy-link') {
        await copy('link')
        return
      }
      if (ch.action === 'native') {
        await shareNative()
        return
      }
      if (ch.href) {
        window.open(ch.href, '_blank', 'noopener,noreferrer')
      }
    },
    [copy, shareNative],
  )

  /** Continuous rubber-band attention on every share entry point */
  const nudge =
    variant === 'icon' ? 'share-nudge share-nudge-icon' : 'share-nudge'

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={() => {
          trackFeature('share_open', { variant: 'icon' })
          setOpen(true)
        }}
        className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-forest-200 bg-white px-3 text-forest-900 shadow-sm transition hover:bg-forest-50 active:scale-[0.96] ${nudge} ${className}`}
        aria-label="Share this guide"
        title="Share this guide"
      >
        <ShareIcon />
        <span className="text-[11px] font-semibold sm:text-xs">Share guide</span>
      </button>
    ) : variant === 'hero' ? (
      <button
        type="button"
        onClick={() => {
          trackFeature('share_open', { variant: 'hero' })
          setOpen(true)
        }}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:border-white/50 hover:bg-white/15 active:scale-[0.98] ${nudge} ${className}`}
      >
        <ShareIcon className="opacity-90" />
        Share guide
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          trackFeature('share_open', { variant: 'button' })
          setOpen(true)
        }}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-forest-200 bg-white px-4 py-2 text-sm font-semibold text-forest-900 shadow-sm transition hover:bg-forest-50 active:scale-[0.98] ${nudge} ${className}`}
      >
        <ShareIcon />
        Share guide
      </button>
    )

  const sheet =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
              aria-label="Close share sheet"
              onClick={close}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-forest-100 bg-white shadow-2xl sm:rounded-3xl"
            >
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-forest-100 sm:hidden" aria-hidden />

              <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-3 sm:px-6 sm:pt-5">
                <div>
                  <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                    Share this guide
                  </h2>
                  <p className="mt-1 text-sm text-ink/55">
                    Send the short note below to classmates on any app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-2 text-ink/40 transition hover:bg-forest-50 hover:text-ink"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
              >
                <pre className="mt-3 max-h-32 overflow-auto rounded-2xl border border-forest-100 bg-forest-50/60 p-3 text-left text-[12px] leading-relaxed text-ink/80 whitespace-pre-wrap font-sans">
                  {shareText}
                </pre>

                {canNative && (
                  <button
                    type="button"
                    onClick={shareNative}
                    className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-forest-900 text-sm font-semibold text-paper shadow-sm transition hover:bg-forest-800 active:scale-[0.99]"
                  >
                    <ShareIcon />
                    Share via phone apps
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const wa = channels.find((c) => c.id === 'whatsapp')
                    if (wa) void onChannel(wa)
                  }}
                  className="mt-2.5 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
                >
                  WhatsApp a classmate
                </button>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onChannel(ch)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-forest-50 bg-white p-3 text-center transition hover:border-forest-100 hover:bg-forest-50/50 active:scale-[0.97]"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${ch.tile}`}>
                        {ch.icon}
                      </span>
                      <span className="text-[11px] font-semibold text-ink/70">
                        {ch.action === 'copy' && copied === 'text'
                          ? 'Copied!'
                          : ch.action === 'copy-link' && copied === 'link'
                            ? 'Copied!'
                            : ch.label}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-center text-[11px] text-ink/40">
                  Opens the app you choose with the message ready to send.
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {trigger}
      {sheet}
    </>
  )
}

function ShareIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
    </svg>
  )
}

/** Exported for tests / other surfaces */
export const SHARE_TEXT = buildShareText('https://nelfund-student-guide.vercel.app/')
