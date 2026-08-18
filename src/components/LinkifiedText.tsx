/** Renders assistant/user text with http(s) URLs as clickable links. */

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi

export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts: Array<string | { href: string }> = []
  let last = 0
  const s = text || ''
  let m: RegExpExecArray | null
  const re = new RegExp(URL_RE)
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index))
    let href = m[1]
    // Trim trailing punctuation common in prose
    href = href.replace(/[.,;:!?)]+$/, '')
    parts.push({ href })
    last = m.index + m[0].length
    // If we trimmed, leave trailing punct as plain text
    if (m[1].length !== href.length) {
      parts.push(m[1].slice(href.length))
    }
  }
  if (last < s.length) parts.push(s.slice(last))

  return (
    <p className={className || 'whitespace-pre-wrap text-[15px] leading-relaxed'}>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-forest-700 underline underline-offset-2 break-all"
          >
            {p.href}
          </a>
        ),
      )}
    </p>
  )
}
