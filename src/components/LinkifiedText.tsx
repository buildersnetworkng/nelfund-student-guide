/**
 * Renders assistant/user text with:
 * - http(s) URLs as clickable links
 * - **bold** and _italic_ lightweight markdown
 * - Preserved line breaks
 * Safe (no raw HTML injection).
 */

const URL_RE = /(https?:\/\/[^\s<>"')\]*]+)/gi

type Part =
  | string
  | { type: 'link'; href: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }

function trimTrailingPunct(href: string): { href: string; trailing: string } {
  let trailing = ''
  // Also strip markdown bold markers so **https://.../** does not become a broken href
  const punct = '.,;:!?)*_'
  while (href.length > 0 && punct.includes(href[href.length - 1]!)) {
    trailing = href[href.length - 1]! + trailing
    href = href.slice(0, -1)
  }
  return { href, trailing }
}

/** Split a plain string segment into bold/italic/link parts */
function parseInline(segment: string): Part[] {
  const out: Part[] = []
  let last = 0
  const re = new RegExp(URL_RE)
  let m: RegExpExecArray | null
  const chunks: Array<string | { href: string; trailing: string }> = []
  while ((m = re.exec(segment)) !== null) {
    if (m.index > last) chunks.push(segment.slice(last, m.index))
    const { href, trailing } = trimTrailingPunct(m[1])
    chunks.push({ href, trailing })
    last = m.index + m[0].length
  }
  if (last < segment.length) chunks.push(segment.slice(last))

  for (const chunk of chunks) {
    if (typeof chunk !== 'string') {
      out.push({ type: 'link', href: chunk.href })
      if (chunk.trailing) out.push(chunk.trailing)
      continue
    }
    const boldRe = /\*\*([^*]+)\*\*/g
    let bLast = 0
    let bm: RegExpExecArray | null
    const afterBold: Part[] = []
    while ((bm = boldRe.exec(chunk)) !== null) {
      if (bm.index > bLast) afterBold.push(...parseItalic(chunk.slice(bLast, bm.index)))
      afterBold.push({ type: 'bold', text: bm[1] })
      bLast = bm.index + bm[0].length
    }
    if (bLast < chunk.length) afterBold.push(...parseItalic(chunk.slice(bLast)))
    out.push(...afterBold)
  }
  return out
}

function parseItalic(segment: string): Part[] {
  const out: Part[] = []
  const italicRe = /_([^_]+)_/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = italicRe.exec(segment)) !== null) {
    if (m.index > last) out.push(segment.slice(last, m.index))
    out.push({ type: 'italic', text: m[1] })
    last = m.index + m[0].length
  }
  if (last < segment.length) out.push(segment.slice(last))
  return out
}

function renderParts(parts: Part[], keyPrefix: string) {
  return parts.map((p, i) => {
    const key = `${keyPrefix}-${i}`
    if (typeof p === 'string') return <span key={key}>{p}</span>
    if (p.type === 'link') {
      return (
        <a
          key={key}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-forest-700 underline decoration-forest-300 underline-offset-2 break-all"
        >
          {p.href}
        </a>
      )
    }
    if (p.type === 'bold') return <strong key={key}>{p.text}</strong>
    if (p.type === 'italic') return <em key={key}>{p.text}</em>
    return null
  })
}

export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const lines = (text || '').split('\n')
  return (
    <div className={className}>
      {lines.map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-1' : undefined}>
          {line.trim() === '' ? '\u00a0' : renderParts(parseInline(line), `l${li}`)}
        </p>
      ))}
    </div>
  )
}
