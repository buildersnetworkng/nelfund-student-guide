import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { trackFeature } from '../lib/analytics'
import { stripLongDashes } from '../lib/copyHygiene'

function getSiteUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`
  }
  return 'https://nelfund-student-guide.vercel.app/'
}

function buildShareText(url: string) {
  return stripLongDashes(
    'PIN THIS IN YOUR CLASS WHATSAPP GROUP\n' +
      'Before you apply or wait on the portal, open this first.\n' +
      'Clear steps for application, pending status, and common portal issues.\n' +
      'In WhatsApp, use Search at the top. Type your class or department group. Do not tap one classmate.\n' +
      `Link ${url}`,
  )
}

async function copySharePayload(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

const SHARE_TITLE = 'NELFUND Student Guide'
const GROUP_SEARCH_HINTS = [
  '100L',
  '200L',
  '300L',
  '400L',
  'ND1',
  'ND2',
  'HND1',
  'HND2',
  'class group',
  'department',
  'faculty',
  'class rep',
]
let shareDeepLinkConsumed = false

type Channel = {
  id: string
  label: string
  href?: string
  action?: 'native' | 'copy' | 'copy-link'
  tile: string
}

function buildChannels(siteUrl: string, shareText: string): Channel[] {
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(siteUrl)
  const encodedTitle = encodeURIComponent(SHARE_TITLE)
  return [
    { id: 'whatsapp', label: 'Class group', href: `https://wa.me/?text=${encodedText}`, tile: 'bg-[#25D366] text-white' },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, tile: 'bg-[#26A5E4] text-white' },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${encodedText}`, tile: 'bg-ink text-white' },
    { id: 'copy', label: 'Copy text', action: 'copy', tile: 'bg-forest-50 text-forest-800 ring-1 ring-forest-100' },
    { id: 'copy-link', label: 'Copy link', action: 'copy-link', tile: 'bg-forest-50 text-forest-800 ring-1 ring-forest-100' },
    { id: 'email', label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedText}`, tile: 'bg-gold-500 text-forest-900' },
  ]
}

type ShareGuideProps = {
  variant?: 'icon' | 'button' | 'hero'
  className?: string
}

export default function ShareGuide({ variant = 'button', className = '' }: ShareGuideProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'text' | 'link' | null>(null)
  const [copiedHint, setCopiedHint] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const [canNative, setCanNative] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleId = useId()
  const siteUrl = getSiteUrl()
  const shareText = buildShareText(siteUrl)
  const channels = buildChannels(siteUrl, shareText)

  useEffect(() => {
    setMounted(true)
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash.replace(/^#/, '')
    if (!shareDeepLinkConsumed && (params.get('share') === '1' || hash === 'share')) {
      shareDeepLinkConsumed = true
      setOpen(true)
      trackFeature('share_open', { variant: 'deep-link' })
      params.delete('share')
      const qs = params.toString()
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${hash === 'share' ? '' : window.location.hash}`
      window.history.replaceState({}, '', next || window.location.pathname)
    }
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

  const close = useCallback(() => {
    setOpen(false)
    setPosted(false)
    setCopiedHint(null)
  }, [])

  const copy = useCallback(
    async (kind: 'text' | 'link') => {
      const value = kind === 'text' ? shareText : siteUrl
      const ok = await copySharePayload(value)
      if (!ok) return
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 2000)
    },
    [shareText, siteUrl],
  )

  const copyHint = useCallback(async (hint: string) => {
    const ok = await copySharePayload(hint)
    if (!ok) return
    setCopiedHint(hint)
    trackFeature('share_group_hint', { hint, source: 'share-sheet' })
    window.setTimeout(() => setCopiedHint(null), 2000)
  }, [])

  const shareNative = useCallback(async () => {
    try {
      trackFeature('share_channel', { channel: 'native' })
      await navigator.share({ title: SHARE_TITLE, text: shareText })
      setOpen(false)
    } catch {
      /* user cancelled */
    }
  }, [shareText])

  const onChannel = useCallback(
    async (ch: Channel) => {
      trackFeature('share_channel', { channel: ch.id })
      if (ch.id === 'whatsapp') {
        await copySharePayload(shareText)
        setPosted(true)
        window.setTimeout(() => setPosted(false), 8000)
      }
      if (ch.action === 'copy') {
        await copy('text')
        return
      }
      if (ch.action === 'copy-link') {
        await copy('link')
        return
      }
      if (ch.href) window.open(ch.href, '_blank', 'noopener,noreferrer')
    },
    [copy, shareText],
  )

  const nudge = variant === 'icon' ? 'share-nudge share-nudge-icon' : 'share-nudge'

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={() => {
          trackFeature('share_open', { variant: 'icon' })
          setOpen(true)
        }}
        className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-forest-200 bg-white px-3 text-forest-900 shadow-sm transition hover:bg-forest-50 active:scale-[0.96] ${nudge} ${className}`}
        aria-label="Share this guide with your class"
        title="Share this guide with your class"
      >
        <ShareIcon />
        <span className="text-[11px] font-semibold sm:text-xs">Class WhatsApp</span>
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
        Class WhatsApp
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
        Class WhatsApp
      </button>
    )

  const sheet =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
            <button type="button" className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" aria-label="Close share sheet" onClick={close} />
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
                    Help the whole class, not one friend
                  </h2>
                  <p className="mt-1 text-sm text-ink/55">
                    WhatsApp may show a list of people first. Skip that list. Tap Search at the top and type your class, level, or department group.
                  </p>
                </div>
                <button type="button" onClick={close} className="rounded-full p-2 text-ink/40 transition hover:bg-forest-50 hover:text-ink" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                <pre className="mt-3 max-h-32 overflow-auto rounded-2xl border border-forest-100 bg-forest-50/60 p-3 text-left text-[12px] leading-relaxed text-ink/80 whitespace-pre-wrap font-sans">
                  {shareText}
                </pre>
                <GroupSearchChips className="mt-3" source="share-sheet" copiedHint={copiedHint} onCopy={copyHint} />
                <ol className="mt-3 space-y-1 text-[12px] leading-relaxed text-ink/55">
                  <li>1. Tap Post to class group. The pin text is copied for you.</li>
                  <li>2. If WhatsApp shows names, tap Search and paste a level or department (example: 300L, ND1, class group).</li>
                  <li>3. Open the group, paste if the box is empty, send, then pin the message.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => {
                    const wa = channels.find((c) => c.id === 'whatsapp')
                    if (wa) void onChannel(wa)
                  }}
                  className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
                >
                  {posted ? 'Copied. Search the group' : 'Post to class group'}
                </button>
                {canNative && (
                  <button
                    type="button"
                    onClick={shareNative}
                    className="mt-2.5 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-forest-900 text-sm font-semibold text-paper shadow-sm transition hover:bg-forest-800 active:scale-[0.99]"
                  >
                    <ShareIcon />
                    Other phone apps
                  </button>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onChannel(ch)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-forest-50 bg-white p-3 text-center transition hover:border-forest-100 hover:bg-forest-50/50 active:scale-[0.97]"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[11px] font-semibold ${ch.tile}`}>{ch.label.slice(0, 2)}</span>
                      <span className="text-[11px] font-semibold text-ink/70">
                        {ch.action === 'copy' && copied === 'text' ? 'Copied!' : ch.action === 'copy-link' && copied === 'link' ? 'Copied!' : ch.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-center text-[11px] text-ink/40">
                  After WhatsApp opens, search the group name. Do not tap one classmate.
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
    </svg>
  )
}

export const SHARE_TEXT = buildShareText('https://nelfund-student-guide.vercel.app/')

export function GroupSearchChips({
  source,
  copiedHint,
  onCopy,
  className = '',
}: {
  source: string
  copiedHint?: string | null
  onCopy?: (hint: string) => void | Promise<void>
  className?: string
}) {
  const [localCopied, setLocalCopied] = useState<string | null>(null)
  const active = copiedHint ?? localCopied

  async function handleCopy(hint: string) {
    if (onCopy) {
      await onCopy(hint)
      return
    }
    const ok = await copySharePayload(hint)
    if (!ok) return
    setLocalCopied(hint)
    trackFeature('share_group_hint', { hint, source })
    window.setTimeout(() => setLocalCopied(null), 2000)
  }

  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">Copy a WhatsApp search</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {GROUP_SEARCH_HINTS.map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => void handleCopy(hint)}
            className="rounded-full border border-forest-100 bg-forest-50 px-2.5 py-1 text-[11px] font-medium text-forest-800 transition hover:border-forest-300 hover:bg-forest-100"
          >
            {active === hint ? 'Copied' : hint}
          </button>
        ))}
      </div>
    </div>
  )
}

export function WhatsAppClassLink({
  source,
  className = '',
  showHints = false,
}: {
  source: string
  className?: string
  showHints?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const siteUrl = getSiteUrl()
  const shareText = buildShareText(siteUrl)
  const href = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className={showHints ? 'space-y-2' : undefined}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackFeature('share_channel', { channel: 'whatsapp', source })
          void copySharePayload(shareText).then((ok) => {
            if (!ok) return
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2500)
          })
        }}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] ${className}`}
      >
        {copied ? 'Copied. Search the group' : 'Post to class group'}
      </a>
      {showHints && <GroupSearchChips source={source} />}
    </div>
  )
}
