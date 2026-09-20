import { useEffect, useId, useState } from 'react'
import { trackFeature } from '../lib/analytics'
import {
  GROUP_NAME_EVENT,
  GROUP_SEARCH_HINTS,
  MORE_GROUPS,
  getSiteUrl,
  getSavedGroupName,
  persistGroupName,
  buildShareText,
  copySharePayload,
} from '../lib/shareCopy'

export function GroupNameField({ source }: { source: string }) {
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const inputId = useId()

  useEffect(() => {
    setName(getSavedGroupName())
    function onName() {
      setName(getSavedGroupName())
    }
    window.addEventListener(GROUP_NAME_EVENT, onName)
    return () => window.removeEventListener(GROUP_NAME_EVENT, onName)
  }, [])

  async function copyName() {
    const value = persistGroupName(name)
    if (!value) return
    const ok = await copySharePayload(value)
    if (!ok) return
    setCopied(true)
    trackFeature('share_group_hint', { hint: 'custom-group-name', source })
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3">
      <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
        Your class group name
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={inputId}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            persistGroupName(e.target.value)
          }}
          placeholder="Example: 300L Computer Science"
          className="min-h-[40px] min-w-0 flex-1 rounded-xl border border-forest-100 bg-white px-3 text-sm text-ink placeholder:text-ink/35"
        />
        <button type="button" onClick={() => void copyName()} disabled={!name.trim()} className="shrink-0 rounded-xl border border-forest-100 bg-forest-50 px-3 text-xs font-semibold text-forest-800 disabled:opacity-40">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export const SHARE_TEXT = buildShareText('https://nelfund-student-guide.vercel.app/?from=class-wa')

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
    persistGroupName(hint)
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
          <button key={hint} type="button" onClick={() => void handleCopy(hint)} className="rounded-full border border-forest-100 bg-forest-50 px-2.5 py-1 text-[11px] font-medium text-forest-800 transition hover:border-forest-300 hover:bg-forest-100">
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
  const [groupName, setGroupName] = useState('')
  const siteUrl = getSiteUrl()

  useEffect(() => {
    setGroupName(getSavedGroupName())
    function onName() {
      setGroupName(getSavedGroupName())
    }
    window.addEventListener(GROUP_NAME_EVENT, onName)
    return () => window.removeEventListener(GROUP_NAME_EVENT, onName)
  }, [])

  const shareText = buildShareText(siteUrl, groupName)
  const href = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className={showHints ? 'space-y-2' : undefined}>
      {showHints && (
        <>
          <GroupNameField source={source} />
          <GroupSearchChips source={source} />
        </>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackFeature('share_channel', { channel: 'whatsapp', source })
          const searchPaste = groupName.trim() || shareText
          void copySharePayload(searchPaste).then((ok) => {
            if (!ok) return
            setCopied(true)
            window.setTimeout(() => setCopied(false), 8000)
          })
        }}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] ${className}`}
      >
        {copied ? (groupName ? 'Group name copied. Paste in Search' : 'Copied. Search the group') : groupName ? `Post to ${groupName}` : 'Post to class group'}
      </a>
      {copied && <MoreGroupsRow source={`${source}-more`} currentName={groupName} />}
    </div>
  )
}

export function MoreGroupsRow({ source, currentName }: { source: string; currentName: string }) {
  const siteUrl = getSiteUrl()
  const extras = MORE_GROUPS.filter((name) => name.toLowerCase() !== currentName.trim().toLowerCase())
  if (extras.length === 0) return null
  return (
    <div className="pt-1">
      <p className="text-[11px] leading-relaxed text-ink/50">
        One group is a start. Also post to department or SUG so more classmates see it.
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {extras.map((name) => {
          const text = buildShareText(siteUrl, name)
          const href = `https://wa.me/?text=${encodeURIComponent(text)}`
          return (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                persistGroupName(name)
                void copySharePayload(name)
                trackFeature('share_channel', { channel: 'whatsapp', source, hop: name })
              }}
              className="rounded-full border border-forest-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-forest-800"
            >
              Also {name}
            </a>
          )
        })}
      </div>
    </div>
  )
}
